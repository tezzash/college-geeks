import { Injectable } from '@nestjs/common';
export interface PlayerStats { power: number; smartness: number }
@Injectable()
export class StatService { getPlayerStats(_playerId: string): Promise<PlayerStats> { return Promise.resolve({ power: 0, smartness: 0 }); } }
