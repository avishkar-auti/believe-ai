import Editor from "@monaco-editor/react";
import { useTheme } from "../../app/providers/ThemeProvider.js";
import { Spinner } from "../../components/ui/Spinner.js";

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  py: "python",
  md: "markdown",
  json: "json",
  js: "javascript",
  ts: "typescript",
  txt: "plaintext",
};

function languageFor(path: string): string {
  const ext = path.split(".").pop() ?? "";
  return LANGUAGE_BY_EXTENSION[ext] ?? "plaintext";
}

export function CodeEditor({
  path,
  value,
  readOnly,
  onChange,
}: {
  path: string;
  value: string;
  readOnly: boolean;
  onChange: (value: string) => void;
}) {
  const { resolved } = useTheme();

  return (
    <div className="h-[420px] overflow-hidden rounded-b-card border-x border-b border-line">
      <Editor
        path={path}
        language={languageFor(path)}
        value={value}
        theme={resolved === "dark" ? "vs-dark" : "light"}
        onChange={(v) => onChange(v ?? "")}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          padding: { top: 12 },
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
        loading={
          <div className="flex h-full items-center justify-center">
            <Spinner className="h-5 w-5 text-fg-subtle" />
          </div>
        }
      />
    </div>
  );
}
