type GeoResult = {
  lat: number;
  lng: number;
  display: string;
};

async function query(q: string): Promise<GeoResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "dispatch-mvp" }
  });
  const data = await res.json();
  if (!data?.length) return null;

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    display: data[0].display_name
  };
}

export async function geocodeOne(loc: {
  adresse?: string;
  cp?: string;
  ville?: string;
}): Promise<GeoResult | null> {

  const tries = [
    `${loc.adresse ?? ""} ${loc.cp ?? ""} ${loc.ville ?? ""}`,
    `${loc.cp ?? ""} ${loc.ville ?? ""}`,
    `${loc.ville ?? ""}`,
    `${loc.cp ?? ""}`
  ].map(s => s.trim()).filter(Boolean);

  for (const t of tries) {
    const r = await query(t);
    if (r) return r;
  }

  return null;
}
