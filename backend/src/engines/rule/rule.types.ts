export type RuleFailureReason =
  | 'INVALID_PLAYER_ID'
  | 'INVALID_TARGET_ID'
  | 'INVALID_AMOUNT'
  | 'PLAYER_NOT_FOUND'
  | 'TARGET_NOT_FOUND'
  | 'SELF_TARGET_NOT_ALLOWED'
  | 'PVP_DISABLED'
  | 'JOBS_DISABLED'
  | 'NOT_ENOUGH_ENERGY'
  | 'NOT_ENOUGH_CASH'
  | 'ALLY_NOT_FOUND'
  | 'ALLY_ALREADY_HIRED'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_ALREADY_UNLOCKED'
  | 'ROOM_LIMIT_REACHED'
  | 'JOB_NOT_FOUND'
  | 'ACTIVE_JOB_EXISTS'
  | 'NO_ACTIVE_JOB'
  | 'JOB_NOT_READY'
  | 'JOB_ALREADY_COLLECTED';

export interface RuleValidationResult<TMeta extends Record<string, unknown> = Record<string, unknown>> {
  allowed: boolean;
  reason?: RuleFailureReason;
  message?: string;
  meta?: TMeta;
}
