export function downloadJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  triggerDownload(blob, `${filename}.json`);
}

export function downloadCSV(data: any, filename: string) {
  const csv = flattenToCSV(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${filename}.csv`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function flattenToCSV(data: any): string {
  const rows = flattenObject(data);
  if (rows.length === 0) return "";

  if (Array.isArray(rows)) {
    const allKeys = new Set<string>();
    rows.forEach((row) => Object.keys(row).forEach((k) => allKeys.add(k)));
    const headers = Array.from(allKeys);
    const lines = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((h) => csvEscape(row[h] ?? "")).join(",")
      ),
    ];
    return lines.join("\n");
  }

  return Object.entries(rows)
    .map(([k, v]) => `${csvEscape(k)},${csvEscape(v)}`)
    .join("\n");
}

function flattenObject(
  obj: any,
  prefix = ""
): Array<Record<string, string>> | Record<string, string> {
  if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === "object") {
    return obj.map((item) => {
      const flat: Record<string, string> = {};
      for (const [k, v] of Object.entries(item)) {
        if (typeof v === "object" && v !== null) {
          flat[k] = JSON.stringify(v);
        } else {
          flat[k] = String(v ?? "");
        }
      }
      return flat;
    });
  }

  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj ?? {})) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      flat[fullKey] = value
        .map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v)))
        .join("; ");
    } else if (typeof value === "object" && value !== null) {
      const nested = flattenObject(value, fullKey);
      if (!Array.isArray(nested)) {
        Object.assign(flat, nested);
      } else {
        flat[fullKey] = JSON.stringify(value);
      }
    } else {
      flat[fullKey] = String(value ?? "");
    }
  }
  return flat;
}

function csvEscape(val: any): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
