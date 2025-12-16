// src/lib/locations.ts

export type Location = {
  code: string;
  designation: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
  contact: string;

  // Géocodage
  addressText?: string;        // (optionnel) concat/legacy
  lat?: number;
  lng?: number;

  // Indication métier
  needsPrecision?: boolean;    // adresse floue / approximation
  geocodeLevel?: string;       // ex: "adresse complète (nominatim)" / "code postal (photon)"
};

export function buildAddressText(address: string, postalCode: string, city: string): string {
  const parts = [
    (address || "").trim(),
    `${(postalCode || "").trim()} ${(city || "").trim()}`.trim(),
    "Belgique",
  ].filter(p => p.length > 0);
  return parts.join(", ");
}

/**
 * Détecte “adresse floue” côté métier (divers, mobile, demander infos, etc.)
 */
export function addressNeedsPrecision(address: string): boolean {
  const s = (address || "").toLowerCase();
  return (
    s.includes("pas d'adresses") ||
    s.includes("divers") ||
    s.includes("plusieurs") ||
    s.includes("demander infos") ||
    s.includes("demander") ||
    s.includes("mobile") ||
    s.includes("voir personne")
  );
}

/**
 * Nettoie une adresse “narrative chantier” pour la rendre géocodable.
 * Exemple: "Base vie : Rue X accès via Avenue Y" => "Rue X"
 */
export function cleanAddressForGeocode(address: string): string {
  let s = (address || "").trim();

  // enlève des préfixes fréquents
  s = s.replace(/^base vie\s*:\s*/i, "");
  s = s.replace(/^poste\s+\d+\s*:\s*/i, "");
  s = s.replace(/^poste\s*:\s*/i, "");
  s = s.replace(/^poste\s+/i, "");

  // coupe ce qui suit des marqueurs typiques “narratifs”
  const cutMarkers = [
    "accès", "acces", "via", "face", "à côté", "a cote",
    "demander", "mobile", "divers", "plusieurs",
    "bk ", "hauteur"
  ];

  const low = s.toLowerCase();
  for (const m of cutMarkers) {
    const idx = low.indexOf(m);
    if (idx > 0) {
      s = s.slice(0, idx).trim();
      break;
    }
  }

  // normalise tirets et espaces
  s = s.replace(/\s*[-–—]\s*/g, " - ").trim();

  return s;
}

/**
 * “Narrative” = texte de chantier type N97, à hauteur, accès via, base vie, etc.
 * Dans ce cas, on préfère géocoder CP+Ville (comme tu faisais à la main).
 */
export function isAddressNarrative(address: string): boolean {
  const s = (address || "").toLowerCase();
  return (
    s.includes("pas d'adresses") ||
    s.includes("divers") ||
    s.includes("plusieurs") ||
    s.includes("demander") ||
    s.includes("mobile") ||
    s.includes("accès") ||
    s.includes("acces") ||
    s.includes("via") ||
    s.includes("hauteur") ||
    s.includes("bk ")
  );
}

/**
 * Appel server-side via Next API route, pour éviter les soucis CORS/rate-limit
 * et pour pouvoir fallback (Nominatim + Photon) côté serveur.
 */
async function callGeocodeApi(q: string): Promise<{ lat: number; lng: number; provider: string } | null> {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
  if (!res.ok) return null;
  const json = await res.json();
  // attendu: { q, result: { lat, lng, provider } }
  return json?.result ?? null;
}

/**
 * Géocode avec fallback progressif:
 * - si adresse narrative -> CP+Ville puis Ville
 * - sinon -> adresse complète -> rue+ville -> CP+Ville -> Ville
 * Retourne aussi un "level" pour tracer l’approximation.
 */
export async function geocodeWithFallback(
  address: string,
  postalCode: string,
  city: string
): Promise<{ lat: number; lng: number; level: string } | null> {

  const Araw = (address || "").trim();
  const Aclean = cleanAddressForGeocode(Araw);
  const CP = (postalCode || "").trim();
  const V = (city || "").trim();

  const narrative = isAddressNarrative(Araw);

  const attempts: Array<{ q: string; level: string }> = narrative
    ? [
        { q: [`${CP} ${V}`.trim(), "Belgique"].filter(Boolean).join(", "), level: "code postal" },
        { q: [V, "Belgique"].filter(Boolean).join(", "), level: "ville" },
      ]
    : [
        { q: [Aclean, `${CP} ${V}`.trim(), "Belgique"].filter(Boolean).join(", "), level: "adresse complète" },
        { q: [Aclean, V, "Belgique"].filter(Boolean).join(", "), level: "rue + ville" },
        { q: [`${CP} ${V}`.trim(), "Belgique"].filter(Boolean).join(", "), level: "code postal" },
        { q: [V, "Belgique"].filter(Boolean).join(", "), level: "ville" },
      ];

  // évite les requêtes vides
  const filtered = attempts.filter(a => a.q.replace(/,/g, "").trim().length >= 5);

  for (const a of filtered) {
    const res = await callGeocodeApi(a.q);
    if (res?.lat && res?.lng) {
      return { lat: res.lat, lng: res.lng, level: `${a.level} (${res.provider})` };
    }
  }

  return null;
}
