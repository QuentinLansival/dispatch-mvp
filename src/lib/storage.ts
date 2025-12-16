// src/lib/storage.ts

import type { Location } from "./locations";

export type Truck = {
  id: string;                 // TR01
  internalExternal: "INT" | "EXT";
  label: string;              // Fabrice
  hasCrane: boolean;          // true / false
  mlMax: number;              // mètres linéaires max
};

const KEY_TRUCKS = "dispatch.trucks.v1";
const KEY_LOCATIONS = "dispatch.locations.v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export const Storage = {
  // =========================
  // CAMIONS
  // =========================
  getTrucks(): Truck[] {
    if (!isBrowser()) return [];
    try {
      return JSON.parse(
        localStorage.getItem(KEY_TRUCKS) || "[]"
      ) as Truck[];
    } catch {
      return [];
    }
  },

  setTrucks(trucks: Truck[]) {
    if (!isBrowser()) return;
    localStorage.setItem(KEY_TRUCKS, JSON.stringify(trucks));
  },

  // =========================
  // LIEUX
  // =========================
  getLocations(): Location[] {
    if (!isBrowser()) return [];
    try {
      return JSON.parse(
        localStorage.getItem(KEY_LOCATIONS) || "[]"
      ) as Location[];
    } catch {
      return [];
    }
  },

  setLocations(locations: Location[]) {
    if (!isBrowser()) return;
    localStorage.setItem(KEY_LOCATIONS, JSON.stringify(locations));
  }
};
