import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q) {
    return NextResponse.json({ error: "Missing q" }, { status: 400 });
  }

  // On contraint à la Belgique pour fiabiliser
  const url =
    "https://nominatim.openstreetmap.org/search" +
    `?format=json&limit=1&countrycodes=be&q=${encodeURIComponent(q)}`;

  const res = await fetch(url, {
    headers: {
      // Nominatim etiquette : un identifiant d'app (côté serveur c'est possible)
      "User-Agent": "dispatch-mvp/1.0 (internal demo)",
      "Accept": "application/json"
    },
    // évite certains caches agressifs
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Nominatim error ${res.status}` },
      { status: 502 }
    );
  }

  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!data?.length) return NextResponse.json({ result: null });

  return NextResponse.json({
    result: { lat: Number(data[0].lat), lng: Number(data[0].lon) },
  });
}
