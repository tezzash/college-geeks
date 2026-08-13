import { CashTransactionType } from '@prisma/client';
import { PrismaService } from './prisma.service';

export interface PersistentJobDefinition {
  id?: string;
  name: string;
  durationSeconds: number;
  rewardCash: number;
}

export class DatabaseJobsService {
  constructor(private readonly prisma: PrismaService, private readonly now: () => Date = () => new Date()) {}

  async createJob(input: PersistentJobDefinition) {
    if (!input.name.trim()) throw new Error('job name is required.');
    if (!Number.isInteger(input.durationSeconds) || input.durationSeconds <= 0) throw new Error('durationSeconds must be a positive integer.');
    if (!Number.isFinite(input.rewardCash) || input.rewardCash <= 0) throw new Error('rewardCash must be positive.');
    return this.prisma.job.create({
      data: {
        ...(input.id ? { id: input.id } : {}),
        name: input.name.trim(),
        durationSeconds: input.durationSeconds,
        rewardCash: input.rewardCash,
      },
    });
  }

  listJobs() {
    return this.prisma.job.findMany({ orderBy: { name: 'asc' } });
  }

  async start(playerId: string, jobId: string) {
    return this.prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({ where: { id: jobId } });
      if (!job) throw new Error('Job not found.');
      const active = await tx.activeJob.findFirst({ where: { playerId, collected: false } });
      if (active) throw new Error('Player already has an active job.');
      const player = await tx.player.findUnique({ where: { id: playerId }, select: { id: true } });
      if (!player) throw new Error('Player not found.');
      const startedAt = this.now();
      return tx.activeJob.create({
        data: {
          playerId,
          jobId,
          startedAt,
          finishesAt: new Date(startedAt.getTime() + job.durationSeconds * 1000),
        },
        include: { job: true },
      });
    }, { isolationLevel: 'Serializable' });
  }

  getActive(playerId: string) {
    return this.prisma.activeJob.findFirst({
      where: { playerId, collected: false },
      include: { job: true },
    });
  }

  async collect(playerId: string, activeJobId: string) {
    return this.prisma.$transaction(async (tx) => {
      const active = await tx.activeJob.findFirst({
        where: { id: activeJobId, playerId, collected: false },
        include: { job: true },
      });
      if (!active) throw new Error('Active job not found.');
      if (this.now().getTime() < active.finishesAt.getTime()) throw new Error('Job is not finished yet.');

      const reward = Number(active.job.rewardCash);
      const updatedPlayer = await tx.player.update({
        where: { id: playerId },
        data: { cash: { increment: reward } },
      });
      const completed = await tx.activeJob.update({ where: { id: active.id }, data: { collected: true } });
      await tx.cashTransaction.create({
        data: {
          playerId,
          type: CashTransactionType.JOB_REWARD,
          amount: reward,
          balanceAfter: updatedPlayer.cash,
          reference: active.id,
        },
      });

      return { activeJob: completed, rewardCash: reward, player: updatedPlayer };
    }, { isolationLevel: 'Serializable' });
  }
}
