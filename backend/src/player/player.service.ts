import { CreatePlayerInput, PlayerGameState } from './player.types';

export class PlayerService {
  private readonly players = new Map<string, PlayerGameState>();

  create(input: CreatePlayerInput): PlayerGameState {
    this.validateIdentity(input);
    if (this.players.has(input.id)) throw new Error('Player already exists.');
    if ([...this.players.values()].some((player) => player.username === input.username)) throw new Error('Username is already taken.');
    if ([...this.players.values()].some((player) => player.email === input.email)) throw new Error('Email is already registered.');
    const player: PlayerGameState = { id: input.id, username: input.username, email: input.email, cash: input.cash ?? 1000, energy: input.energy ?? 10, power: input.power ?? 0, smartness: input.smartness ?? 0 };
    this.validateState(player);
    this.players.set(player.id, player);
    return { ...player };
  }

  get(id: string): PlayerGameState {
    const player = this.players.get(id);
    if (!player) throw new Error('Player not found.');
    return { ...player };
  }

  list(): PlayerGameState[] { return [...this.players.values()].map((player) => ({ ...player })); }

  updateStats(id: string, powerDelta: number, smartnessDelta: number): PlayerGameState {
    this.validateDelta(powerDelta, 'powerDelta');
    this.validateDelta(smartnessDelta, 'smartnessDelta');
    const player = this.get(id);
    player.power += powerDelta;
    player.smartness += smartnessDelta;
    this.validateState(player);
    this.players.set(id, player);
    return { ...player };
  }

  addCash(id: string, amount: number): PlayerGameState {
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('amount must be positive.');
    const player = this.get(id);
    player.cash = Math.round((player.cash + amount) * 100) / 100;
    this.players.set(id, player);
    return { ...player };
  }

  spendCash(id: string, amount: number): PlayerGameState {
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('amount must be positive.');
    const player = this.get(id);
    if (player.cash < amount) throw new Error('Insufficient cash.');
    player.cash = Math.round((player.cash - amount) * 100) / 100;
    this.players.set(id, player);
    return { ...player };
  }

  spendEnergy(id: string, amount: number): PlayerGameState {
    if (!Number.isInteger(amount) || amount <= 0) throw new Error('energy amount must be a positive integer.');
    const player = this.get(id);
    if (player.energy < amount) throw new Error('Insufficient energy.');
    player.energy -= amount;
    this.players.set(id, player);
    return { ...player };
  }

  private validateIdentity(input: CreatePlayerInput): void {
    if (!input.id.trim()) throw new Error('id is required.');
    if (!input.username.trim()) throw new Error('username is required.');
    if (!input.email.trim()) throw new Error('email is required.');
  }

  private validateDelta(value: number, name: string): void {
    if (!Number.isInteger(value) || value < 0) throw new Error(`${name} must be a non-negative integer.`);
  }

  private validateState(player: PlayerGameState): void {
    if (!Number.isFinite(player.cash) || player.cash < 0) throw new Error('cash must be non-negative.');
    if (!Number.isInteger(player.energy) || player.energy < 0) throw new Error('energy must be a non-negative integer.');
    if (!Number.isInteger(player.power) || player.power < 0) throw new Error('power must be a non-negative integer.');
    if (!Number.isInteger(player.smartness) || player.smartness < 0) throw new Error('smartness must be a non-negative integer.');
  }
}
