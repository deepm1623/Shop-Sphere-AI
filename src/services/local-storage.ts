export function readLocal<T>(key: string, seed: T): T {
  if (typeof window === "undefined") return seed;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : seed;
  } catch {
    return seed;
  }
}

export function writeLocal<T>(key: string, value: T): void {
  if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value));
}
