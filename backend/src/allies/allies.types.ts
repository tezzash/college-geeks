export interface AllyDefinition {
  id: string;
  name: string;
  cost: number;
  powerBonus: number;
  smartnessBonus: number;
}

export interface PlayerAlly {
  playerId: string;
  allyId: string;
  hiredAt: Date;
}
