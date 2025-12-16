"use client";

import { useEffect, useState } from "react";
import { Storage } from "../../lib/storage";
import { parseDelimited } from "../../lib/parseTable";
import {
  Location,
  buildAddressText,
  addressNeedsPrecision,
  geocodeNominatim
} from "../../lib/locations";

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
    if (!rows.length) { setMsg("Rien à importer."); return; }

    const required = ["Code", "Désignation", "Adresse", "Ville", "Région", "Code postal", "Contact"];
    const headers = Object.keys(rows[0]);
    const missing = required.filter(h => !headers.includes(h));
    if (missing.length) {
      setMsg(`Colonnes manquantes: ${missing.join(", ")}`);
      return;
    }

    const mapped: Location[] = rows
      .map(r => {
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
          code, designation, address, city, region, postalCode, contact,
          addressText, needsPrecision
        };
      })
      .filter(Boolean) as Location[];

    // merge by code
    const map = new Map(locations.map(l => [l.code, l]));
    for (const l of mapped) {
      const prev = map.get(l.code);
      map.set(l.code, { ...prev, ...l });
    }

    save(Array.from(map.values()).sort((a,b)=>a.code.localeCompare(b.code)));
    setMsg(`Import OK: ${mapped.length} lignes (fusion).`);
  }

  async function geocodeOne(code: string) {
    const next = [...locations];
    const idx = next.findIndex(l => l.code === code);
    if (idx < 0) return;

    const loc = next[idx];
    if (loc.needsPrecision) {
      alert("Adresse imprécise → précise l’adresse avant géocodage.");
      return;
    }

    const res = await geocodeNominatim(loc.addressText);
    if (!res) {
      alert("Géocodage impossible. Vérifie l’adresse.");
      return;
    }

    next[idx] = { ...loc, lat: res.lat, lng: res.lng };
    save(next);
  }

  async function geocodeAll() {
    setBusy(true);
    try {
      for (const l of locations) {
        if (l.lat && l.lng) continue;
        if (l.needsPrecision) continue;

        await geocodeOne(l.code);
        // Respect Nominatim (éviter de spammer)
        await new Promise(r => setTimeout(r, 900));
      }
      setMsg("Géocodage terminé (tous les lieux possibles).");
    } finally {
      setBusy(false);
    }
  }

  function edit(i: number, key: keyof Location, value: string) {
    const next = [...locations];
    const l = { ...next[i] } as any;
    l[key] = value;

    // si on change l'adresse/ville/cp -> rebuild + reset lat/lng
    if (key === "address" || key === "city" || key === "postalCode") {
      l.addressText = buildAddressText(l.address, l.postalCode, l.city);
      l.needsPrecision = addressNeedsPrecision(l.address);
      l.lat = undefined;
      l.lng = undefined;
    }

    next[i] = l;
    save(next);
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
        onChange={e => setRaw(e.target.value)}
        placeholder="Colle ici ton tableau Lieux..."
      />

      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "12px 0" }}>
        <button onClick={importData}>Importer / Fusionner</button>
        <button onClick={() => setRaw("")}>Vider</button>
        <button onClick={geocodeAll} disabled={busy}>
          {busy ? "Géocodage..." : "Géocoder (tout)"}
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
            <th>OK?</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((l, i) => (
            <tr key={l.code}>
              <td><input value={l.code} onChange={e => edit(i, "code", e.target.value)} /></td>
              <td><input value={l.designation} onChange={e => edit(i, "designation", e.target.value)} /></td>
              <td><input style={{ width: 360 }} value={l.address} onChange={e => edit(i, "address", e.target.value)} /></td>
              <td><input style={{ width: 80 }} value={l.postalCode} onChange={e => edit(i, "postalCode", e.target.value)} /></td>
              <td><input style={{ width: 160 }} value={l.city} onChange={e => edit(i, "city", e.target.value)} /></td>
              <td><input style={{ width: 160 }} value={l.contact} onChange={e => edit(i, "contact", e.target.value)} /></td>
              <td>{l.lat ?? ""}</td>
              <td>{l.lng ?? ""}</td>
              <td>{l.needsPrecision ? "Adresse imprécise" : (l.lat && l.lng ? "OK" : "")}</td>
              <td>
                <button onClick={() => geocodeOne(l.code)} disabled={busy}>Géocoder</button>
              </td>
            </tr>
          ))}
          {!locations.length && (
            <tr><td colSpan={10}>Aucun lieu importé.</td></tr>
          )}
        </tbody>
      </table>

      <p style={{ marginTop: 10 }}>
        ⚠️ Les lignes “divers / plusieurs ponts / mobile / demander infos” sont marquées <b>Adresse imprécise</b> et ne seront pas géocodées.
      </p>
    </div>
  );
}
