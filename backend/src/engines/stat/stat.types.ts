export interface StatTotals {
  power: number;
  smartness: number;
}

export interface StatContribution {
  power: number;
  smartness: number;
}

export interface StatModifierSource {
  getContribution(playerId: string): Promise<StatContribution>;
}
