export interface TowerRoom {
  id: string;
  name: string;
  cost: number;
  powerBonus: number;
  smartnessBonus: number;
}

export interface PlayerTowerRoom {
  playerId: string;
  roomId: string;
  purchasedAt: Date;
}
