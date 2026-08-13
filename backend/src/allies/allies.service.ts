import { PlayerService } from '../player';
import { AllyDefinition, PlayerAlly } from './allies.types';

export class AlliesService {
  private readonly allies = new Map<string, AllyDefinition>();
  private readonly hired = new Map<string, PlayerAlly[]>();

  constructor(private readonly players: PlayerService, private readonly now: () => Date = () => new Date()) {}

  registerAlly(ally: AllyDefinition): AllyDefinition {
    this.validateAlly(ally);
    if (this.allies.has(ally.id)) throw new Error('Ally already exists.');
    this.allies.set(ally.id, { ...ally });
    return { ...ally };
  }

  listAllies(): AllyDefinition[] {
    return [...this.allies.values()].map((ally) => ({ ...ally }));
  }

  hire(playerId: string, allyId: string): PlayerAlly {
    this.players.get(playerId);
    const ally = this.allies.get(allyId);
    if (!ally) throw new Error('Ally not found.');
    const hired = this.hired.get(playerId) ?? [];
    if (hired.some((entry) => entry.allyId === allyId)) throw new Error('Ally already hired.');

    this.players.spendCash(playerId, ally.cost);
    const entry: PlayerAlly = { playerId, allyId, hiredAt: this.now() };
    this.hired.set(playerId, [...hired, entry]);
    this.players.updateStats(playerId, ally.powerBonus, ally.smartnessBonus);
    return { ...entry };
  }

  listHired(playerId: string): PlayerAlly[] {
    this.players.get(playerId);
    return (this.hired.get(playerId) ?? []).map((entry) => ({ ...entry }));
  }

  private validateAlly(ally: AllyDefinition): void {
    if (!ally.id.trim()) throw new Error('ally id is required.');
    if (!ally.name.trim()) throw new Error('ally name is required.');
    if (!Number.isFinite(ally.cost) || ally.cost <= 0) throw new Error('cost must be positive.');
    if (!Number.isInteger(ally.powerBonus) || ally.powerBonus < 0) throw new Error('powerBonus must be non-negative.');
    if (!Number.isInteger(ally.smartnessBonus) || ally.smartnessBonus < 0) throw new Error('smartnessBonus must be non-negative.');
    if (ally.powerBonus === 0 && ally.smartnessBonus === 0) throw new Error('ally must provide a stat bonus.');
  }
}
