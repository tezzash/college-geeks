export interface PlayerGameState {
  id: string;
  username: string;
  email: string;
  cash: number;
  energy: number;
  power: number;
  smartness: number;
}

export interface CreatePlayerInput {
  id: string;
  username: string;
  email: string;
  cash?: number;
  energy?: number;
  power?: number;
  smartness?: number;
}
