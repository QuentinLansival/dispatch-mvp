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
async function callGeocodeApi(q: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json?.result ?? null;
}

export async function geocodeWithFallback(
  address: string,
  postalCode: string,
  city: string
): Promise<{ lat: number; lng: number; level: string } | null> {

  const A = (address || "").trim();
  const CP = (postalCode || "").trim();
  const V = (city || "").trim();

  const attempts = [
    { parts: [A, `${CP
