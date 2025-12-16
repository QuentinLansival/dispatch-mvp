export type Truck = {
  id: string;                 // TR01
  internalExternal: "INT" | "EXT";
  label: string;              // Fabrice
  hasCrane: boolean;          // true/false
  mlMax: number;              // 13
};

const KEY_TRUCKS = "dispatch.trucks.v1";

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export const Storage = {
  getTrucks(): Truck[] {
    if (!isBrowser()) return [];
    try {
      return JSON.parse(localStorage.getItem(KEY_TRUCKS) || "[]") as Truck[];
    } catch {
      return [];
    }
  },
  setTrucks(trucks: Truck[]) {
    if (!isBrowser()) return;
    localStorage.setItem(KEY_TRUCKS, JSON.stringify(trucks));
  },
};
