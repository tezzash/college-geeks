import { PlayerService } from '../player';
import { ActiveJob, CollectJobResult, JobDefinition, StartJobResult } from './jobs.types';

export class JobsService {
  private readonly jobs = new Map<string, JobDefinition>();
  private readonly activeJobs = new Map<string, ActiveJob>();
  private sequence = 0;

  constructor(private readonly players: PlayerService, private readonly now: () => Date = () => new Date()) {}

  register(job: JobDefinition): JobDefinition {
    this.validateJob(job);
    if (this.jobs.has(job.id)) throw new Error('Job already exists.');
    this.jobs.set(job.id, { ...job });
    return { ...job };
  }

  listJobs(): JobDefinition[] {
    return [...this.jobs.values()].map((job) => ({ ...job }));
  }

  start(playerId: string, jobId: string): StartJobResult {
    this.players.get(playerId);
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Job not found.');
    if ([...this.activeJobs.values()].some((active) => active.playerId === playerId && !active.collected)) {
      throw new Error('Player already has an active job.');
    }

    const startedAt = this.now();
    const activeJob: ActiveJob = {
      id: `active-job-${++this.sequence}`,
      playerId,
      jobId,
      startedAt,
      finishesAt: new Date(startedAt.getTime() + job.durationSeconds * 1000),
      collected: false,
    };
    this.activeJobs.set(activeJob.id, activeJob);
    return { activeJob: { ...activeJob }, job: { ...job } };
  }

  getActive(playerId: string): ActiveJob | undefined {
    const active = [...this.activeJobs.values()].find((job) => job.playerId === playerId && !job.collected);
    return active ? { ...active } : undefined;
  }

  collect(playerId: string, activeJobId: string): CollectJobResult {
    const activeJob = this.activeJobs.get(activeJobId);
    if (!activeJob || activeJob.playerId !== playerId) throw new Error('Active job not found.');
    if (activeJob.collected) throw new Error('Job reward has already been collected.');
    if (this.now().getTime() < activeJob.finishesAt.getTime()) throw new Error('Job is not finished yet.');

    const job = this.jobs.get(activeJob.jobId);
    if (!job) throw new Error('Job definition not found.');

    this.players.addCash(playerId, job.rewardCash);
    activeJob.collected = true;
    this.activeJobs.set(activeJob.id, activeJob);
    return { activeJob: { ...activeJob }, rewardCash: job.rewardCash };
  }

  private validateJob(job: JobDefinition): void {
    if (!job.id.trim()) throw new Error('job id is required.');
    if (!job.name.trim()) throw new Error('job name is required.');
    if (!Number.isInteger(job.durationSeconds) || job.durationSeconds <= 0) {
      throw new Error('durationSeconds must be a positive integer.');
    }
    if (!Number.isFinite(job.rewardCash) || job.rewardCash <= 0) throw new Error('rewardCash must be positive.');
  }
}
