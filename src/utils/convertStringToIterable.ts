export function covertStringToIterable(input: string): Iterable<number> {
  return input
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => !isNaN(n));
}
