import { GameConfig } from '../game-config';
import { EnergyState } from './energy.types';

export class EnergyService {
  constructor(private readonly config: Pick<GameConfig, 'maxEnergy' | 'energyRegenSeconds' | 'pvpEnergyCost'>) {}

  regenerate(state: EnergyState, now: Date): EnergyState {
    this.validateState(state);
    if (now < state.lastEnergyUpdate) throw new Error('now cannot be before lastEnergyUpdate.');
    if (state.energy >= this.config.maxEnergy) return { energy: this.config.maxEnergy, lastEnergyUpdate: state.lastEnergyUpdate };

    const elapsedSeconds = Math.floor((now.getTime() - state.lastEnergyUpdate.getTime()) / 1000);
    const regenerated = Math.floor(elapsedSeconds / this.config.energyRegenSeconds);
    if (regenerated <= 0) return { ...state };

    const energy = Math.min(this.config.maxEnergy, state.energy + regenerated);
    const consumedSeconds = regenerated * this.config.energyRegenSeconds;
    return {
      energy,
      lastEnergyUpdate: energy >= this.config.maxEnergy ? now : new Date(state.lastEnergyUpdate.getTime() + consumedSeconds * 1000),
    };
  }

  spendForPvp(state: EnergyState, now: Date): EnergyState {
    const regenerated = this.regenerate(state, now);
    if (regenerated.energy < this.config.pvpEnergyCost) throw new Error('Not enough energy for PvP.');
    return { ...regenerated, energy: regenerated.energy - this.config.pvpEnergyCost };
  }

  private validateState(state: EnergyState): void {
    if (!Number.isInteger(state.energy) || state.energy < 0 || state.energy > this.config.maxEnergy) {
      throw new Error('energy must be an integer within configured bounds.');
    }
    if (!(state.lastEnergyUpdate instanceof Date) || Number.isNaN(state.lastEnergyUpdate.getTime())) {
      throw new Error('lastEnergyUpdate must be a valid Date.');
    }
  }
}
