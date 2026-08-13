import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const jobs = [
    { id: 'job-study', name: 'Study Session', durationSeconds: 30, rewardCash: 100 },
    { id: 'job-freelance', name: 'Freelance Gig', durationSeconds: 90, rewardCash: 300 },
    { id: 'job-night-shift', name: 'Night Shift', durationSeconds: 180, rewardCash: 750 },
  ];
  for (const job of jobs) await prisma.job.upsert({ where: { id: job.id }, update: job, create: job });

  const allies = [
    { id: 'ally-tutor', name: 'Campus Tutor', tier: 'common', power: 0, smartness: 4, hireCost: 250 },
    { id: 'ally-athlete', name: 'Varsity Athlete', tier: 'rare', power: 5, smartness: 0, hireCost: 450 },
    { id: 'ally-captain', name: 'Club Captain', tier: 'epic', power: 3, smartness: 5, hireCost: 900 },
    { id: 'ally-legend', name: 'Campus Legend', tier: 'legendary', power: 10, smartness: 8, hireCost: 1800 },
  ];
  for (const ally of allies) await prisma.ally.upsert({ where: { id: ally.id }, update: ally, create: ally });
  console.log(`Seeded ${jobs.length} jobs and ${allies.length} allies.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
