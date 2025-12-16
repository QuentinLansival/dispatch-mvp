export function parseDelimited(text: string): Record<string, string>[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const lines = trimmed.split(/\r?\n/).filter(l => l.trim().length > 0);
  const first = lines[0];

  const delimiter =
    first.includes("\t") ? "\t" :
    first.includes(";") ? ";" :
    ",";

  const headers = splitLine(first, delimiter).map(h => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i], delimiter);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => row[h] = (cells[idx] ?? "").trim());
    rows.push(row);
  }
  return rows;
}

function splitLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (!inQuotes && ch === delimiter) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
}

export function toBoolOuiNon(v: string): boolean {
  const s = (v ?? "").trim().toLowerCase();
  return s === "oui" || s === "true" || s === "1" || s === "yes";
}

export function toNumberSmart(v: string): number | null {
  const s = (v ?? "").trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
