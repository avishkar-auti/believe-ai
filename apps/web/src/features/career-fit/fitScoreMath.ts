export function matchLabel(percent: number): string {
  if (percent >= 85) return "Excellent Match";
  if (percent >= 70) return "Strong Match";
  if (percent >= 50) return "Moderate Match";
  return "Developing Match";
}
