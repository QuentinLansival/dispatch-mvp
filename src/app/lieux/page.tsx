"use client";

import { useEffect, useState } from "react";
import { Storage } from "../../lib/storage";
import { parseDelimited } from "../../lib/parseTable";
import { Location, geocodeWithFallback, addressNeedsPrecision, buildAddressText } from "../../lib/locations";

export default function LieuxPage() {
  const [raw, setRaw] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [msg, setMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLocations(Storage.getLocations());
  }, []);

  function save(next: Location[]) {
    setLocations(next);
    Storage.setLocations(next);
  }

  function importData() {
    setMsg("");
    const rows = parseDelimited(raw);
    if (!rows.length) {
      setMsg("Rien à importer.");
      return;
    }

    const required = ["Code", "Désignation", "Adresse", "Ville", "Région", "Code postal", "Contact"];
    const headers = Object.keys(rows[0] || {});
    const missing = required.filter((h) => !headers.includes(h));
    if (missing.length) {
      setMsg(`Colonnes manquantes: ${missing.join(", ")}`);
      return;
    }

    const mapped: Location[] = rows
      .map((r) => {
        const code = (r["Code"] || "").trim();
        if (!code) return null;

        const designation = (r["Désignation"] || "").trim();
        const address = (r["Adresse"] || "").trim();
        const city = (r["Ville"] || "").trim();
        const region = (r["Région"] || "").trim();
        const postalCode = (r["Code postal"] || "").trim();
        const contact = (r["Contact"] || "").trim();

        const addressText = buildAddressText(address, postalCode, city);
        const needsPrecision = addressNeedsPrecision(address);

        return {
          code,
          designation,
          address,
          city,
          region,
          postalCode,
          contact,
          addressText,
          needsPrecision,
        };
      })
      .filter(Boolean) as Location[];

    // merge by code
    const map = new Map(locations.map((l) => [l.code, l]));
    for (const l of mapped) {
      const prev = map.get(l.code);
      map.set(l.code, { ...prev, ...l });
    }

    save(Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code)));
    setMsg(`Import OK: ${mapped.length} lignes (fusion).`);
  }

  async function geocodeOne(code: string) {
    const next = [...locations];
    const idx = next.findIndex((l) => l.code === code);
    if (idx < 0) return;

    const l = next[idx];

    const res = await geocodeWithFallback(l.address, l.postalCode, l.city);
    if (!res) {
      alert("Impossible de géocoder (même en approximation).");
      return;
    }

    next[idx] = {
      ...l,
      lat: res.lat,
      lng: res.lng,
      geocodeLevel: res.level,
      // si on n'est pas au niveau "adresse complète", alors c'est une approximation => needsPrecision
      needsPrecision: !res.level.startsWith("adresse complète"),
    };

    save(next);
  }

  async function geocodeAll() {
    setBusy(true);
    setMsg("");
    try {
      for (const l of locations) {
        if (l.lat && l.lng) continue; // déjà OK
        await geocodeOne(l.code);
        // éviter de spammer les services
        await new Promise((r) => setTimeout(r, 700));
      }
      setMsg("Géocodage terminé.");
    } finally {
      setBusy(false);
    }
  }

  function edit(i: number, key: keyof Location, value: string) {
    const next = [...locations];
    const l: Location = { ...next[i], [key]: value } as Location;

    // rebuild adresseText si besoin
    if (key === "address" || key === "city" || key === "postalCode") {
      l.addressText = buildAddressText(l.address, l.postalCode, l.city);
      // on ne reset plus lat/lng automatiquement (sinon ça “disparaît”)
    }

    next[i] = l;
    save(next);
  }

  function deleteRow(i: number) {
    const l = locations[i];
    if (!l) return;
    if (!confirm(`Supprimer le lieu ${l.code} ?`)) return;
    const next = locations.filter((_, idx) => idx !== i);
    save(next);
  }

  function clearAll() {
    if (!confirm("Supprimer TOUS les lieux ?")) return;
    save([]);
    setMsg("Tous les lieux ont été supprimés.");
  }

  return (
    <div>
      <h1>Lieux</h1>
      <p>
        Colle ton tableau Excel (copier/coller) ou CSV. Colonnes attendues :
        <b> Code, Désignation, Adresse, Ville, Région, Code postal, Contact</b>
      </p>

      <textarea
        style={{ width: "100%", minHeight: 180 }}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder="Colle ici ton tableau Lieux..."
      />

      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "12px 0" }}>
        <button onClick={importData}>Importer / Fusionner</button>
        <button onClick={() => setRaw("")}>Vider</button>
        <button onClick={geocodeAll} disabled={busy}>
          {busy ? "Géocodage..." : "Géocoder (tout)"}
        </button>
        <button onClick={clearAll} disabled={busy}>
          Tout effacer
        </button>
        <span>{msg}</span>
      </div>

      <h2>Liste</h2>
      <table border={1} cellPadding={6} style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>Code</th>
            <th>Désignation</th>
            <th>Adresse</th>
            <th>CP</th>
            <th>Ville</th>
            <th>Contact</th>
            <th>Lat</th>
            <th>Lng</th>
            <th>Niveau</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((l, i) => (
            <tr key={l.code}>
              <td>
                <input value={l.code} onChange={(e) => edit(i, "code", e.target.value)} />
              </td>
              <td>
                <input
                  value={l.designation}
                  onChange={(e) => edit(i, "designation", e.target.value)}
                />
              </td>
              <td>
                <input
                  style={{ width: 360 }}
                  value={l.address}
                  onChange={(e) => edit(i, "address", e.target.value)}
                />
              </td>
              <td>
                <input
                  style={{ width: 90 }}
                  value={l.postalCode}
                  onChange={(e) => edit(i, "postalCode", e.target.value)}
                />
              </td>
              <td>
                <input
                  style={{ width: 160 }}
                  value={l.city}
                  onChange={(e) => edit(i, "city", e.target.value)}
                />
              </td>
              <td>
                <input
                  style={{ width: 160 }}
                  value={l.contact}
                  onChange={(e) => edit(i, "contact", e.target.value)}
                />
              </td>
              <td>{l.lat ?? ""}</td>
              <td>{l.lng ?? ""}</td>
              <td>{l.geocodeLevel ?? (l.needsPrecision ? "Approx / à préciser" : "")}</td>
              <td style={{ display: "flex", gap: 6 }}>
                <button onClick={() => geocodeOne(l.code)} disabled={busy}>
                  Géocoder
                </button>
                <button onClick={() => deleteRow(i)} disabled={busy}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}

          {!locations.length && (
            <tr>
              <td colSpan={10}>Aucun lieu importé.</td>
            </tr>
          )}
        </tbody>
      </table>

      <p style={{ marginTop: 10 }}>
        Astuce : si l’adresse est “narrative” (accès via…, à hauteur de…, divers…), le géocodage
        utilisera une approximation CP/Ville.
      </p>
    </div>
  );
}
