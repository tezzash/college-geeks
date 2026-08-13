export interface JobDefinition {
  id: string;
  name: string;
  durationSeconds: number;
  rewardCash: number;
}

export interface ActiveJob {
  id: string;
  playerId: string;
  jobId: string;
  startedAt: Date;
  finishesAt: Date;
  collected: boolean;
}

export interface StartJobResult {
  activeJob: ActiveJob;
  job: JobDefinition;
}

export interface CollectJobResult {
  activeJob: ActiveJob;
  rewardCash: number;
}
