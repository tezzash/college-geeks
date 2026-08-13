import { PlayerService } from '../player';
import { PlayerTowerRoom, TowerRoom } from './tower.types';

export class TowerService {
  private readonly rooms = new Map<string, TowerRoom>();
  private readonly owned = new Map<string, PlayerTowerRoom[]>();

  constructor(private readonly players: PlayerService, private readonly now: () => Date = () => new Date()) {}

  registerRoom(room: TowerRoom): TowerRoom {
    this.validateRoom(room);
    if (this.rooms.has(room.id)) throw new Error('Tower room already exists.');
    this.rooms.set(room.id, { ...room });
    return { ...room };
  }

  listRooms(): TowerRoom[] {
    return [...this.rooms.values()].map((room) => ({ ...room }));
  }

  purchase(playerId: string, roomId: string): PlayerTowerRoom {
    this.players.get(playerId);
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Tower room not found.');
    const owned = this.owned.get(playerId) ?? [];
    if (owned.some((entry) => entry.roomId === roomId)) throw new Error('Tower room already owned.');

    this.players.spendCash(playerId, room.cost);
    const entry: PlayerTowerRoom = { playerId, roomId, purchasedAt: this.now() };
    this.owned.set(playerId, [...owned, entry]);
    this.players.updateStats(playerId, room.powerBonus, room.smartnessBonus);
    return { ...entry };
  }

  listOwned(playerId: string): PlayerTowerRoom[] {
    this.players.get(playerId);
    return (this.owned.get(playerId) ?? []).map((entry) => ({ ...entry }));
  }

  private validateRoom(room: TowerRoom): void {
    if (!room.id.trim()) throw new Error('room id is required.');
    if (!room.name.trim()) throw new Error('room name is required.');
    if (!Number.isFinite(room.cost) || room.cost <= 0) throw new Error('cost must be positive.');
    if (!Number.isInteger(room.powerBonus) || room.powerBonus < 0) throw new Error('powerBonus must be non-negative.');
    if (!Number.isInteger(room.smartnessBonus) || room.smartnessBonus < 0) throw new Error('smartnessBonus must be non-negative.');
    if (room.powerBonus === 0 && room.smartnessBonus === 0) throw new Error('room must provide a stat bonus.');
  }
}
