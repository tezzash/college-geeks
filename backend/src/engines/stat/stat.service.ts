import { BadRequestException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { STAT_MODIFIER_SOURCES } from './stat.tokens';
import { StatModifierSource, StatTotals } from './stat.types';

type PlayerRoomWithOccupants = {
  roomOccupants?: Array<{
    ally?: {
      basePower?: number | null;
      power?: number | null;
      baseSmartness?: number | null;
      smartness?: number | null;
    } | null;
  }>;
};

@Injectable()
export class StatService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(STAT_MODIFIER_SOURCES)
    private readonly modifierSources: StatModifierSource[] = [],
  ) {}

  async calculate(playerId: string): Promise<StatTotals> {
    this.validatePlayerId(playerId);
    await this.ensurePlayerExists(playerId);

    const [allyTotals, modifierTotals] = await Promise.all([
      this.calculateAllyTotals(playerId),
      this.calculateModifierTotals(playerId),
    ]);

    return {
      power: allyTotals.power + modifierTotals.power,
      smartness: allyTotals.smartness + modifierTotals.smartness,
    };
  }

  async getPower(playerId: string): Promise<number> {
    return (await this.calculate(playerId)).power;
  }

  async getSmartness(playerId: string): Promise<number> {
    return (await this.calculate(playerId)).smartness;
  }

  private validatePlayerId(playerId: string): void {
    if (typeof playerId !== 'string' || playerId.trim().length === 0) {
      throw new BadRequestException('playerId is required');
    }
  }

  private async ensurePlayerExists(playerId: string): Promise<void> {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }
  }

  private async calculateAllyTotals(playerId: string): Promise<StatTotals> {
    const rooms = await this.readPlayerRooms(playerId);

    return rooms.reduce<StatTotals>(
      (totals, room) => {
        const occupants = room.roomOccupants ?? [];

        for (const occupant of occupants) {
          const ally = occupant.ally;

          if (!ally) {
            continue;
          }

          totals.power += this.resolveStatValue(ally.basePower, ally.power);
          totals.smartness += this.resolveStatValue(ally.baseSmartness, ally.smartness);
        }

        return totals;
      },
      { power: 0, smartness: 0 },
    );
  }

  private async readPlayerRooms(playerId: string): Promise<PlayerRoomWithOccupants[]> {
    return this.prisma.towerRoom.findMany({
      where: {
        playerId,
        unlocked: true,
      },
      include: {
        roomOccupants: {
          include: {
            ally: true,
          },
        },
      },
    });
  }

  private async calculateModifierTotals(playerId: string): Promise<StatTotals> {
    const contributions = await Promise.all(
      this.modifierSources.map((source) => source.getContribution(playerId)),
    );

    return contributions.reduce<StatTotals>(
      (totals, contribution) => ({
        power: totals.power + contribution.power,
        smartness: totals.smartness + contribution.smartness,
      }),
      { power: 0, smartness: 0 },
    );
  }

  private resolveStatValue(primary?: number | null, fallback?: number | null): number {
    return primary ?? fallback ?? 0;
  }
}
