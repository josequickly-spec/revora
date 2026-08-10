import { NextResponse } from 'next/server';
import { listJobs, getJob, removeJob, cleanJobs } from '@/lib/job-queue';

export async function GET(req: Request) {
 try {
 const url = new URL(req.url);
 const id = url.searchParams.get('id');
 if (id) {
 const job = await getJob(id);
 if (!job) return NextResponse.json({ success: false, error: 'Not found' }, { status:404 });
 return NextResponse.json({ success: true, job });
 }
 const limit = Number(url.searchParams.get('limit') || '50');
 const jobs = await listJobs(limit);
 return NextResponse.json({ success: true, jobs });
 } catch (err) {
 return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status:500 });
 }
}

export async function DELETE(req: Request) {
 try {
 const url = new URL(req.url);
 const id = url.searchParams.get('id');
 if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status:400 });
 const ok = await removeJob(id);
 if (!ok) return NextResponse.json({ success: false, error: 'remove failed' }, { status:500 });
 return NextResponse.json({ success: true });
 } catch (err) {
 return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status:500 });
 }
}

export async function POST(req: Request) {
 try {
 const url = new URL(req.url);
 const action = url.searchParams.get('action');
 if (action === 'clean') {
 const body = await req.json().catch(() => ({}));
 const older = Number(body.olderThanSeconds || body.older ||3600);
 const ok = await cleanJobs(older);
 return NextResponse.json({ success: ok });
 }
 return NextResponse.json({ success: false, error: 'unknown action' }, { status:400 });
 } catch (err) {
 return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status:500 });
 }
}