import { env } from "../config/env.js";
import { IntegrationError, ValidationError } from "../errors/AppError.js";

/** A small curated set — enough for typical interview practice, not a general-purpose IDE. */
const LANGUAGE_IDS = {
  python: 71,
  javascript: 63,
  java: 62,
  cpp: 54,
  go: 95,
} as const;

export type SandboxLanguage = keyof typeof LANGUAGE_IDS;

export interface RunCodeResult {
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  status: string;
  timeSeconds: number | null;
  memoryKb: number | null;
}

interface Judge0Submission {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: { id: number; description: string };
  time: string | null;
  memory: number | null;
}

export const codeSandboxService = {
  async run(language: string, sourceCode: string, stdin: string): Promise<RunCodeResult> {
    if (!env.RAPIDAPI_KEY) {
      throw new IntegrationError(
        "The code sandbox isn't configured yet — this needs a Judge0/RapidAPI key (RAPIDAPI_KEY) on the server.",
      );
    }
    if (!(language in LANGUAGE_IDS)) {
      throw new ValidationError(`Unsupported language "${language}". Supported: ${Object.keys(LANGUAGE_IDS).join(", ")}`);
    }

    const res = await fetch("https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      },
      body: JSON.stringify({
        source_code: sourceCode,
        language_id: LANGUAGE_IDS[language as SandboxLanguage],
        stdin,
      }),
    });

    if (!res.ok) {
      throw new IntegrationError(`Code sandbox request failed: ${res.status} ${await res.text()}`);
    }

    const data = (await res.json()) as Judge0Submission;
    return {
      stdout: data.stdout,
      stderr: data.stderr ?? data.message,
      compileOutput: data.compile_output,
      status: data.status.description,
      timeSeconds: data.time ? Number(data.time) : null,
      memoryKb: data.memory,
    };
  },
};
