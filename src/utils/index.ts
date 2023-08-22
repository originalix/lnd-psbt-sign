export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  const value = localStorage.getItem(key);
  if (value !== null) {
    return JSON.parse(value) as T;
  }
  return defaultValue;
}
