import { Queue, Job, Worker, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const queueName = 'revora-jobs';
export const queue = new Queue(queueName, { connection });

export interface JobRecord<T = any> {
 id: string;
 status: string;
 result?: T;
 error?: string;
 returnvalue?: T;
}

export async function enqueueJob<T = any>(processorPayload: T, opts?: JobsOptions) {
 const job = await queue.add('job', processorPayload, opts);
 return job.id as string;
}

export async function getJob(jobId: string) {
 const job = await queue.getJob(jobId);
 if (!job) return null;
 const state = await job.getState();
 const returnvalue = await job.returnvalue;
 return { id: String(job.id), state, returnvalue, failedReason: job.failedReason };
}

export async function listJobs(limit =50) {
 const jobs = await queue.getJobs(['waiting','active','completed','failed'],0, Math.max(0, limit -1));
 const results: Array<{ id: string; state: string | null }> = [];
 for (const j of jobs) {
 const state = await j.getState();
 results.push({ id: String(j.id), state });
 }
 return results;
}

export async function removeJob(jobId: string) {
 try {
 const job = await queue.getJob(jobId);
 if (!job) return false;
 await job.remove();
 return true;
 } catch (err) {
 console.warn('removeJob failed', err);
 return false;
 }
}

export async function cleanJobs(olderThanSeconds =3600) {
 const ms = olderThanSeconds *1000;
 try {
 // Fetch completed and failed jobs (up to1000) and remove those older than threshold
 const completed = await queue.getJobs(['completed'],0,999);
 const failed = await queue.getJobs(['failed'],0,999);
 const now = Date.now();
 const combined = [...completed, ...failed];
 for (const job of combined) {
 const finished = (job as any).finishedOn || (job as any).processedOn || (job as any).timestamp ||0;
 if (!finished) continue;
 if (now - finished > ms) {
 try { await job.remove(); } catch (err) { /* ignore per-job errors */ }
 }
 }
 return true;
 } catch (err) {
 console.warn('cleanJobs failed', err);
 return false;
 }
}

export function createWorker(processor: (job: Job) => Promise<any>, opts?: { concurrency?: number }) {
 return new Worker(queueName, async (job) => processor(job), { connection, concurrency: opts?.concurrency ??1 });
}
