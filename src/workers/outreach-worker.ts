import { createWorker } from '@/lib/job-queue';
import { Job } from 'bullmq';
import { processOutreachJob } from '@/lib/outreach-processor';

createWorker(async (job: Job) => {
 const payload = job.data as any;
 const result = await processOutreachJob(payload);
 return result;
}, { concurrency:4 });
