import { pool } from "@/lib/postgres";
import { warehouseRetentionPolicy } from "./policy";

export async function enforceWarehouseRetention() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const facts = [];
    for (const name of [
      "business", "opportunity", "proposal", "outreach", "crm", "revenue", "user", "workflow",
    ]) {
      facts.push(await client.query(
        `DELETE FROM warehouse_fact_${name}
         WHERE occurred_on < CURRENT_DATE-($1||' months')::interval`,
        [warehouseRetentionPolicy.factsMonths],
      ));
    }
    const snapshots = await client.query(
      `DELETE FROM warehouse_metric_snapshots
       WHERE period_end < CURRENT_DATE-($1||' months')::interval`,
      [warehouseRetentionPolicy.metricSnapshotsMonths],
    );
    const refreshRuns = await client.query(
      `DELETE FROM warehouse_refresh_runs
       WHERE started_at < NOW()-($1||' months')::interval`,
      [warehouseRetentionPolicy.refreshRunsMonths],
    );
    const aiRuns = await client.query(
      `DELETE FROM executive_ai_runs
       WHERE requested_at < NOW()-($1||' months')::interval`,
      [warehouseRetentionPolicy.aiRunsMonths],
    );
    await client.query("COMMIT");
    return {
      facts: facts.reduce((total, result) => total + (result.rowCount || 0), 0),
      snapshots: snapshots.rowCount || 0,
      refreshRuns: refreshRuns.rowCount || 0,
      aiRuns: aiRuns.rowCount || 0,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
