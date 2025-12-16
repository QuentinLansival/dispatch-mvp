export function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeItemByIndex<T>(key: string, index: number) {
  const arr = load<T[]>(key, []);
  arr.splice(index, 1);
  save(key, arr);
}

export function clear(key: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}
