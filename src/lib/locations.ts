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

  const attempts: Array<{ q: string; level: string }> = [
    // 1) Adresse complète
    { q: [A, `${CP} ${V}`.trim(), "Belgique"].filter(Boolean).join(", "), level: "adresse complète" },

    // 2) Rue + ville
    { q: [A, V, "Belgique"].filter(Boolean).join(", "), level: "rue + ville" },

    // 3) CP + ville
    { q: [`${CP} ${V}`.trim(), "Belgique"].filter(Boolean).join(", "), level: "code postal" },

    // 4) Ville seule
    { q: [V, "Belgique"].filter(Boolean).join(", "), level: "ville" },
  ].filter(a => a.q.replace(/,/g, "").trim().length >= 5); // évite les requêtes vides

  for (const a of attempts) {
    const res = await callGeocodeApi(a.q);
    if (res?.lat && res?.lng) {
      return { lat: res.lat, lng: res.lng, level: a.level };
    }
  }

  return null;
}
