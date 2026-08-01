import { Injectable } from '@nestjs/common';

export interface CombatValidationContext {
  attackerId: string;
  defenderId: string;
  attackType: string;
  energyCost: number;
}

@Injectable()
export class RuleService {
  async validateCombatAttack(_context: CombatValidationContext): Promise<void> {
    throw new Error('RuleService.validateCombatAttack is provided by the Rule Engine');
  }
}
