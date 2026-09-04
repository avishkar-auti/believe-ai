import type { SandboxLanguage } from "./interviewApi.js";

export const LANGUAGES: SandboxLanguage[] = ["python", "javascript", "java", "cpp", "go"];

export const STARTER_CODE: Record<SandboxLanguage, string> = {
  python: 'print("hello, believe.ai")',
  javascript: 'console.log("hello, believe.ai");',
  java: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("hello, believe.ai");\n  }\n}',
  cpp: '#include <iostream>\nint main() {\n  std::cout << "hello, believe.ai";\n  return 0;\n}',
  go: 'package main\nimport "fmt"\nfunc main() {\n  fmt.Println("hello, believe.ai")\n}',
};
