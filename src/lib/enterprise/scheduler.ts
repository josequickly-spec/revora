import { randomUUID } from "node:crypto";
import { pool } from "../postgres.ts";

type CronParts = {
  minute: Set<number>;
  hour: Set<number>;
  day: Set<number>;
  month: Set<number>;
  weekday: Set<number>;
  dayWildcard: boolean;
  weekdayWildcard: boolean;
};

function values(field: string, minimum: number, maximum: number) {
  const result = new Set<number>();
  for (const segment of field.split(",")) {
    const [range, stepRaw] = segment.split("/");
    const step = stepRaw ? Number(stepRaw) : 1;
    if (!Number.isInteger(step) || step < 1) throw new Error("invalid_cron_step");
    const [startRaw, endRaw] = range === "*" ? [minimum, maximum] : range.split("-").map(Number);
    const start = Number(startRaw);
    const end = endRaw === undefined ? start : Number(endRaw);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < minimum || end > maximum || start > end) {
      throw new Error("invalid_cron_range");
    }
    for (let value = start; value <= end; value += step) result.add(value);
  }
  return result;
}

function parseCron(expression: string): CronParts {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) throw new Error("cron_requires_five_fields");
  return {
    minute: values(fields[0], 0, 59),
    hour: values(fields[1], 0, 23),
    day: values(fields[2], 1, 31),
    month: values(fields[3], 1, 12),
    weekday: values(fields[4], 0, 6),
    dayWildcard: fields[2] === "*",
    weekdayWildcard: fields[4] === "*",
  };
}

const weekdays: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    minute: "numeric",
    hour: "numeric",
    day: "numeric",
    month: "numeric",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find(part => part.type === type)?.value || "";
  return {
    minute: Number(get("minute")),
    hour: Number(get("hour")),
    day: Number(get("day")),
    month: Number(get("month")),
    weekday: weekdays[get("weekday")],
  };
}

export function nextCronOccurrence(expression: string, timeZone: string, after = new Date()) {
  const cron = parseCron(expression);
  const candidate = new Date(after);
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  for (let index = 0; index < 60 * 24 * 370; index++) {
    const part = zonedParts(candidate, timeZone);
    const dayMatch = cron.day.has(part.day);
    const weekdayMatch = cron.weekday.has(part.weekday);
    const calendarMatch = cron.dayWildcard || cron.weekdayWildcard
      ? dayMatch && weekdayMatch
      : dayMatch || weekdayMatch;
    if (
      cron.minute.has(part.minute) &&
      cron.hour.has(part.hour) &&
      cron.month.has(part.month) &&
      calendarMatch
    ) return new Date(candidate);
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }
  throw new Error("cron_has_no_occurrence_within_one_year");
}

export async function enqueueDueSchedules(limit = 50) {
  const client = await pool.connect();
  const queued: string[] = [];
  const invalid: string[] = [];
  try {
    await client.query("BEGIN");
    const due = await client.query(
      `SELECT * FROM platform_schedules
       WHERE enabled AND next_run_at IS NOT NULL AND next_run_at<=NOW()
       ORDER BY next_run_at FOR UPDATE SKIP LOCKED LIMIT $1`,
      [Math.min(Math.max(limit, 1), 200)],
    );
    for (const schedule of due.rows) {
      try {
        const next = nextCronOccurrence(schedule.cron_expression, schedule.timezone, new Date(schedule.next_run_at));
        const id = randomUUID();
        await client.query(
          `INSERT INTO platform_jobs
           (id,organization_id,queue,job_type,payload,idempotency_key,correlation_id)
           VALUES($1,$2,'scheduled',$3,$4,$5,$6)
           ON CONFLICT(organization_id,idempotency_key) DO NOTHING`,
          [
            id,
            schedule.organization_id,
            schedule.job_type,
            JSON.stringify(schedule.payload),
            `schedule:${schedule.id}:${new Date(schedule.next_run_at).toISOString()}`,
            randomUUID(),
          ],
        );
        await client.query(
          "UPDATE platform_schedules SET last_run_at=next_run_at,next_run_at=$2,updated_at=NOW() WHERE id=$1",
          [schedule.id, next],
        );
        queued.push(schedule.id);
      } catch {
        await client.query(
          "UPDATE platform_schedules SET enabled=FALSE,updated_at=NOW() WHERE id=$1",
          [schedule.id],
        );
        invalid.push(schedule.id);
      }
    }
    await client.query("COMMIT");
    return { examined: due.rowCount || 0, queued, invalid };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
