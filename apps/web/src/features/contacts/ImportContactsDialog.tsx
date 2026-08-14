import { useRef, useState } from "react";
import type { CsvImportSummary } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { Card, CardBody, CardHeader } from "../../components/ui/Card.js";
import { importContactsCsv, parseContactsCsv } from "./contactsApi.js";

const REQUIRED_FIELDS = [
  { key: "email", label: "Email", required: true },
  { key: "firstName", label: "First name", required: false },
  { key: "lastName", label: "Last name", required: false },
  { key: "company", label: "Company", required: false },
  { key: "jobTitle", label: "Job title", required: false },
  { key: "phone", label: "Phone", required: false },
] as const;

function guessColumn(columns: string[], field: string): string {
  const normalized = field.toLowerCase();
  const match = columns.find((c) => c.toLowerCase().replace(/[^a-z]/g, "") === normalized.replace(/[^a-z]/g, ""));
  return match ?? "";
}

interface ImportContactsDialogProps {
  onClose: () => void;
  onImported: () => void;
}

export function ImportContactsDialog({ onClose, onImported }: ImportContactsDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<CsvImportSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const parsed = await parseContactsCsv(file);
      setColumns(parsed.columns);
      setRows(parsed.rows);
      const nextMapping: Record<string, string> = {};
      for (const field of REQUIRED_FIELDS) {
        const guess = guessColumn(parsed.columns, field.key);
        if (guess) nextMapping[field.key] = guess;
      }
      setMapping(nextMapping);
    } catch {
      setError("Couldn't read that CSV file.");
    } finally {
      setBusy(false);
    }
  }

  async function handleImport() {
    if (!mapping.email) {
      setError("Map an Email column before importing.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await importContactsCsv(rows, mapping as { email: string });
      setSummary(result);
      onImported();
    } catch {
      setError("Import failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex items-center justify-between">
          <h2 className="font-medium text-ink-900 dark:text-white">Import contacts</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </CardHeader>
        <CardBody className="space-y-4">
          {summary ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium text-ink-900 dark:text-white">
                {summary.imported} contacts imported
              </p>
              <p className="text-ink-500 dark:text-ink-400">
                {summary.duplicatesSkipped} duplicates skipped · {summary.invalidSkipped} invalid emails ·{" "}
                {summary.unsubscribedSkipped} unsubscribed skipped
              </p>
              <Button className="mt-2 w-full" onClick={onClose}>
                Done
              </Button>
            </div>
          ) : columns.length === 0 ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && void handleFile(e.target.files[0])}
              />
              <Button variant="secondary" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={busy}>
                {busy ? "Reading file…" : "Choose a CSV file"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-ink-500 dark:text-ink-400">
                Map your CSV columns to believe.ai fields ({rows.length} rows detected).
              </p>
              {REQUIRED_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-ink-700 dark:text-ink-200">
                    {field.label}
                    {field.required && <span className="text-red-500"> *</span>}
                  </span>
                  <select
                    className="h-9 rounded-lg border border-ink-200 bg-white px-2 text-sm dark:border-ink-700 dark:bg-ink-800"
                    value={mapping[field.key] ?? ""}
                    onChange={(e) => setMapping((m) => ({ ...m, [field.key]: e.target.value }))}
                  >
                    <option value="">— skip —</option>
                    {columns.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <Button className="w-full" onClick={() => void handleImport()} disabled={busy}>
                {busy ? "Importing…" : `Import ${rows.length} rows`}
              </Button>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardBody>
      </Card>
    </div>
  );
}
