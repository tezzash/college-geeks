export interface SimulationOptions {
  seed?: number;
}

export interface BattleStats {
  id?: string;
  name?: string;
  power: number;
  smartness: number;
  cash?: number;
  unprotectedCash?: number;
  jobRewardCash?: number;
}

export interface BattleSimulationResult {
  attackerWins: number;
  defenderWins: number;
  winRate: number;
  averageCashWon: number;
  averageCashLost: number;
  averageProbability: number;
  battles: number;
  averageDurationMs: number;
}

export interface EconomyPlayer extends BattleStats {
  id: string;
  cash: number;
}

export interface EconomySimulationResult {
  totalMoneyCreated: number;
  totalMoneyTransferred: number;
  averagePlayerCash: number;
  richestPlayer: EconomyPlayer;
  poorestPlayer: EconomyPlayer;
  players: EconomyPlayer[];
}

export interface AllyBalanceResult {
  ally: BattleStats;
  wins: number;
  losses: number;
  winPercent: number;
  lossPercent: number;
  averageCashEarned: number;
  balanceScore: number;
}
