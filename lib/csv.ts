import Papa from "papaparse";

export type ParseResult = {
  names: string[];
  error?: string;
};

const NAME_COLUMNS = ["prenom", "prénom", "name", "nom", "firstname", "first_name"];

export function parseCsv(content: string): ParseResult {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    // Try no-header mode
    return parseNoHeader(content);
  }

  const headers = result.meta.fields || [];
  const nameCol = headers.find((h) => NAME_COLUMNS.includes(h));

  if (!nameCol && headers.length > 0) {
    // Use first column
    const firstCol = headers[0];
    const names = result.data
      .map((row) => String(row[firstCol] || "").trim())
      .filter((n) => n.length > 0);
    if (names.length === 0) return parseNoHeader(content);
    return { names: names.slice(0, 500) };
  }

  if (!nameCol) return parseNoHeader(content);

  const names = result.data
    .map((row) => String(row[nameCol] || "").trim())
    .filter((n) => n.length > 0 && n.length <= 40);

  if (names.length === 0) return { names: [], error: "Aucun prénom détecté, vérifiez le format" };

  return { names: names.slice(0, 500) };
}

function parseNoHeader(content: string): ParseResult {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.replace(/\uFEFF/g, "").trim())
    .filter((l) => l.length > 0 && l.length <= 40);

  if (lines.length === 0) {
    return { names: [], error: "Aucun prénom détecté, vérifiez le format" };
  }

  return { names: lines.slice(0, 500) };
}

export function generateSampleCsv(): string {
  const header = "prenom";
  const rows = ["Alice", "Bob", "Charlie", "Diana", "Ethan"];
  return [header, ...rows].join("\n");
}

export function downloadSampleCsv() {
  const content = generateSampleCsv();
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "exemple_participants.csv";
  a.click();
  URL.revokeObjectURL(url);
}
