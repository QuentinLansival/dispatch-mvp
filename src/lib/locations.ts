export type Location = {
  code: string;
  designation: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
  contact: string;

  addressText: string;       // concat pour géocodage
  lat?: number;
  lng?: number;
  needsPrecision?: boolean;  // adresse floue
};

export function buildAddressText(address: string, postalCode: string, city: string): string {
  const parts = [
    (address || "").trim(),
    `${(postalCode || "").trim()} ${(city || "").trim()}`.trim(),
    "Belgique"
  ].filter(p => p.length > 0);
  return parts.join(", ");
}

export function addressNeedsPrecision(address: string): boolean {
  const s = (address || "").toLowerCase();
  return (
    s.includes("pas d'adresses") ||
    s.includes("divers") ||
    s.includes("plusieurs") ||
    s.includes("demander infos") ||
    s.includes("mobile") ||
    s.includes("voir personne")
  );
}

export async function geocodeNominatim(addressText: string): Promise<{ lat: number; lng: number } | null> {
  const q = encodeURIComponent(addressText);
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`;

  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!data?.length) return null;

  return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
}
