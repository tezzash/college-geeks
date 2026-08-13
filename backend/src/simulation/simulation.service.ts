import {
  AllyBalanceResult,
  BattleSimulationResult,
  BattleStats,
  EconomyPlayer,
  EconomySimulationResult,
  SimulationBalanceConfig,
  SimulationOptions,
} from './simulation.types';

type RandomSource = () => number;

const DEFAULT_BALANCE_CONFIG: Required<SimulationBalanceConfig> = {
  battleRating: 0.5,
  stealRate: 0.05,
  defaultJobRewardCash: 100,
  minimumWinProbability: 0.05,
  maximumWinProbability: 0.95,
};
const DEFAULT_ALLIES: BattleStats[] = [
  { id: 'alex', name: 'Alex', power: 24, smartness: 16, cash: 1_000 },
  { id: 'miranda', name: 'Miranda', power: 14, smartness: 28, cash: 1_000 },
  { id: 'maze', name: 'Maze', power: 21, smartness: 21, cash: 1_000 },
  { id: 'gwen', name: 'Gwen', power: 17, smartness: 24, cash: 1_000 },
];

export class SimulationService {
  simulateBattle(
    attackerStats: BattleStats,
    defenderStats: BattleStats,
    iterations: number,
    options: SimulationOptions = {},
  ): BattleSimulationResult {
    this.validateStats(attackerStats, 'attackerStats');
    this.validateStats(defenderStats, 'defenderStats');
    this.validatePositiveInteger(iterations, 'iterations');

    const random = this.createRandom(options.seed);
    const balance = this.createBalanceConfig(options.balance);
    const started = performance.now();
    const probability = this.calculateWinProbability(attackerStats, defenderStats, options, balance);
    let attackerWins = 0;
    let cashWon = 0;
    let cashLost = 0;

    for (let index = 0; index < iterations; index += 1) {
      if (random() < probability) {
        attackerWins += 1;
        cashWon += this.calculateCashTransfer(defenderStats, balance);
      } else {
        cashLost += this.calculateCashTransfer(attackerStats, balance);
      }
    }

    const defenderWins = iterations - attackerWins;
    return {
      attackerWins,
      defenderWins,
      winRate: this.percent(attackerWins, iterations),
      averageCashWon: cashWon / iterations,
      averageCashLost: cashLost / iterations,
      averageProbability: probability * 100,
      battles: iterations,
      averageDurationMs: (performance.now() - started) / iterations,
    };
  }

  simulateEconomy(
    players: EconomyPlayer[],
    jobsPerDay: number,
    attacksPerDay: number,
    days: number,
    options: SimulationOptions = {},
  ): EconomySimulationResult {
    this.validatePlayers(players);
    this.validateNonNegativeInteger(jobsPerDay, 'jobsPerDay');
    this.validateNonNegativeInteger(attacksPerDay, 'attacksPerDay');
    this.validatePositiveInteger(days, 'days');

    const workingPlayers = this.clonePlayers(players);
    const balance = this.createBalanceConfig(options.balance);
    const totalMoneyCreated = this.applyJobIncome(workingPlayers, days, jobsPerDay, balance);
    const pvp = this.simulatePvpEconomy(workingPlayers, attacksPerDay * days, options);
    return this.createEconomyReport(pvp.players, totalMoneyCreated, pvp.totalMoneyTransferred);
  }

  simulateJobIncome(
    players: EconomyPlayer[],
    days: number,
    options: { jobsPerDay?: number; balance?: SimulationBalanceConfig } = {},
  ): EconomySimulationResult {
    this.validatePlayers(players);
    this.validatePositiveInteger(days, 'days');
    const jobsPerDay = options.jobsPerDay ?? 1;
    this.validateNonNegativeInteger(jobsPerDay, 'jobsPerDay');

    const workingPlayers = this.clonePlayers(players);
    const balance = this.createBalanceConfig(options.balance);
    const totalMoneyCreated = this.applyJobIncome(workingPlayers, days, jobsPerDay, balance);

    return this.createEconomyReport(workingPlayers, totalMoneyCreated, 0);
  }

  simulatePvpEconomy(
    players: EconomyPlayer[],
    attacks: number,
    options: SimulationOptions = {},
  ): EconomySimulationResult {
    this.validatePlayers(players);
    this.validateNonNegativeInteger(attacks, 'attacks');
    if (players.length < 2 && attacks > 0) {
      throw new Error('At least two players are required to simulate PvP attacks.');
    }

    const workingPlayers = this.clonePlayers(players);
    const random = this.createRandom(options.seed);
    const balance = this.createBalanceConfig(options.balance);
    let totalMoneyTransferred = 0;
    for (let attack = 0; attack < attacks; attack += 1) {
      const attackerIndex = Math.floor(random() * workingPlayers.length);
      let defenderIndex = Math.floor(random() * (workingPlayers.length - 1));
      if (defenderIndex >= attackerIndex) defenderIndex += 1;
      const attacker = workingPlayers[attackerIndex];
      const defender = workingPlayers[defenderIndex];
      if (random() < this.calculateWinProbability(attacker, defender, options, balance)) {
        const transfer = Math.min(defender.cash, this.calculateCashTransfer(defender, balance));
        defender.cash -= transfer;
        attacker.cash += transfer;
        totalMoneyTransferred += transfer;
      }
    }

    return this.createEconomyReport(workingPlayers, 0, totalMoneyTransferred);
  }

  simulateAllyBalance(options: SimulationOptions = {}): AllyBalanceResult[] {
    const random = this.createRandom(options.seed);
    const balance = this.createBalanceConfig(options.balance);
    const records = DEFAULT_ALLIES.map((ally) => ({ ally, wins: 0, losses: 0, cash: 0 }));

    for (let i = 0; i < DEFAULT_ALLIES.length; i += 1) {
      for (let j = i + 1; j < DEFAULT_ALLIES.length; j += 1) {
        const probability = this.calculateWinProbability(DEFAULT_ALLIES[i], DEFAULT_ALLIES[j], options, balance);
        const firstWins = random() < probability;
        records[firstWins ? i : j].wins += 1;
        records[firstWins ? j : i].losses += 1;
        records[firstWins ? i : j].cash += this.calculateCashTransfer(DEFAULT_ALLIES[firstWins ? j : i], balance);
      }
    }

    return records.map((record) => {
      const battles = record.wins + record.losses;
      const winPercent = this.percent(record.wins, battles);
      return {
        ally: { ...record.ally },
        wins: record.wins,
        losses: record.losses,
        winPercent,
        lossPercent: this.percent(record.losses, battles),
        averageCashEarned: battles === 0 ? 0 : record.cash / battles,
        balanceScore: 100 - Math.abs(50 - winPercent) * 2,
      };
    });
  }

  private applyJobIncome(
    players: EconomyPlayer[],
    days: number,
    jobsPerDay: number,
    balance: Required<SimulationBalanceConfig>,
  ): number {
    let totalMoneyCreated = 0;
    for (const player of players) {
      const created = (player.jobRewardCash ?? balance.defaultJobRewardCash) * jobsPerDay * days;
      player.cash += created;
      totalMoneyCreated += created;
    }
    return totalMoneyCreated;
  }

  private validateStats(stats: BattleStats, name: string): void {
    if (!stats || !Number.isFinite(stats.power) || !Number.isFinite(stats.smartness) || stats.power < 0 || stats.smartness < 0) {
      throw new Error(`${name} must include non-negative finite power and smartness.`);
    }
  }

  private validatePlayers(players: EconomyPlayer[]): void {
    if (!Array.isArray(players) || players.length === 0) throw new Error('players must include at least one player.');
    players.forEach((player, index) => {
      this.validateStats(player, `players[${index}]`);
      if (!player.id || !Number.isFinite(player.cash) || player.cash < 0) {
        throw new Error(`players[${index}] must include an id and non-negative finite cash.`);
      }
    });
  }

  private validatePositiveInteger(value: number, name: string): void {
    if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer.`);
  }

  private validateNonNegativeInteger(value: number, name: string): void {
    if (!Number.isInteger(value) || value < 0) throw new Error(`${name} must be a non-negative integer.`);
  }

  private calculateWinProbability(
    attacker: BattleStats,
    defender: BattleStats,
    options: SimulationOptions,
    balance: Required<SimulationBalanceConfig>,
  ): number {
    const action = options.action ?? 'balanced';
    const attackerScore = this.calculateActionScore(attacker, action);
    const defenderScore = this.calculateActionScore(defender, action);
    if (attackerScore + defenderScore === 0) return 0.5;
    return Math.min(
      balance.maximumWinProbability,
      Math.max(balance.minimumWinProbability, attackerScore / (attackerScore + defenderScore)),
    );
  }

  private calculateActionScore(stats: BattleStats, action: SimulationOptions['action']): number {
    if (action === 'punch') return stats.power;
    if (action === 'face-off') return stats.smartness;
    return stats.power + stats.smartness;
  }

  private calculateCashTransfer(loser: BattleStats, balance: Required<SimulationBalanceConfig>): number {
    const cash = loser.unprotectedCash ?? loser.cash ?? 0;
    return Math.max(0, cash * balance.stealRate * balance.battleRating);
  }

  private createBalanceConfig(config: SimulationBalanceConfig = {}): Required<SimulationBalanceConfig> {
    const balance = { ...DEFAULT_BALANCE_CONFIG, ...config };
    if (balance.minimumWinProbability < 0 || balance.maximumWinProbability > 1) {
      throw new Error('Win probability bounds must be between 0 and 1.');
    }
    if (balance.minimumWinProbability > balance.maximumWinProbability) {
      throw new Error('minimumWinProbability must be less than or equal to maximumWinProbability.');
    }
    if (balance.battleRating < 0 || balance.stealRate < 0 || balance.defaultJobRewardCash < 0) {
      throw new Error('Balance cash values must be non-negative.');
    }
    return balance;
  }

  private createRandom(seed?: number): RandomSource {
    if (seed === undefined) return Math.random;
    let state = seed >>> 0;
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    };
  }

  private createEconomyReport(
    players: EconomyPlayer[],
    totalMoneyCreated: number,
    totalMoneyTransferred: number,
  ): EconomySimulationResult {
    const sorted = [...players].sort((a, b) => a.cash - b.cash);
    const totalCash = players.reduce((sum, player) => sum + player.cash, 0);
    return {
      totalMoneyCreated,
      totalMoneyTransferred,
      averagePlayerCash: totalCash / players.length,
      poorestPlayer: { ...sorted[0] },
      richestPlayer: { ...sorted[sorted.length - 1] },
      players,
    };
  }

  private clonePlayers(players: EconomyPlayer[]): EconomyPlayer[] {
    return players.map((player) => ({ ...player }));
  }

  private percent(part: number, total: number): number {
    return total === 0 ? 0 : (part / total) * 100;
  }
}
