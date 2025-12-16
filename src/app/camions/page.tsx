"use client";

import { useEffect, useState } from "react";
import { Storage, Truck } from "../../lib/storage";
import { parseDelimited, toBoolOuiNon, toNumberSmart } from "../../lib/parseTable";

export default function CamionsPage() {
  const [raw, setRaw] = useState("");
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    setTrucks(Storage.getTrucks());
  }, []);

  function save(next: Truck[]) {
    setTrucks(next);
    Storage.setTrucks(next);
  }

  function importData() {
    setMsg("");
    const rows = parseDelimited(raw);
    if (!rows.length) {
      setMsg("Rien à importer.");
      return;
    }

    const required = ["ID", "Interne/Externe", "Label", "Grue", "Ml max"];
    const headers = Object.keys(rows[0] || {});
    const missing = required.filter((h) => !headers.includes(h));
    if (missing.length) {
      setMsg(`Colonnes manquantes: ${missing.join(", ")}`);
      return;
    }

    const mapped: Truck[] = rows
      .map((r) => {
        const id = (r["ID"] || "").trim();
        if (!id) return null;

        const ie =
          (r["Interne/Externe"] || "").trim().toUpperCase() === "EXT" ? "EXT" : "INT";
        const label = (r["Label"] || "").trim() || id;
        const hasCrane = toBoolOuiNon(r["Grue"] || "");
        const mlMax = toNumberSmart(r["Ml max"] || "") ?? 0;

        return { id, internalExternal: ie, label, hasCrane, mlMax };
      })
      .filter(Boolean) as Truck[];

    const map = new Map(trucks.map((t) => [t.id, t]));
    for (const t of mapped) map.set(t.id, t);

    save(Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id)));
    setMsg(`Import OK: ${mapped.length} lignes (fusion).`);
  }

  function edit(i: number, key: keyof Truck, value: string) {
    const next = [...trucks];
    const t = { ...next[i] };

    if (key === "mlMax") t.mlMax = Number((value || "").replace(",", "."));
    else if (key === "hasCrane") {
      const s = (value || "").trim().toLowerCase();
      t.hasCrane = s === "oui" || s === "true" || s === "1" || s === "yes";
    } else if (key === "internalExternal") {
      t.internalExternal = value.trim().toUpperCase() === "EXT" ? "EXT" : "INT";
    } else {
      (t as any)[key] = value;
    }

    next[i] = t;
    save(next);
  }

  function deleteRow(i: number) {
    const t = trucks[i];
    if (!t) return;
    if (!confirm(`Supprimer le camion ${t.id} ?`)) return;
    const next = trucks.filter((_, idx) => idx !== i);
    save(next);
  }

  function clearAll() {
    if (!confirm("Supprimer TOUS les camions ?")) return;
    save([]);
    setMsg("Tous les camions ont été supprimés.");
  }

  return (
    <div>
      <h1>Camions</h1>
      <p>
        Colle ton tableau Excel (copier/coller) ou un CSV. Colonnes attendues :{" "}
        <b>ID, Interne/Externe, Label, Grue, Ml max</b>
      </p>

      <textarea
        style={{ width: "100%", minHeight: 180 }}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder="Colle ici ton tableau..."
      />

      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "12px 0" }}>
        <button onClick={importData}>Importer / Fusionner</button>
        <button onClick={() => setRaw("")}>Vider</button>
        <button onClick={clearAll}>Tout effacer</button>
        <span>{msg}</span>
      </div>

      <h2>Liste</h2>
      <table border={1} cellPadding={6} style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>INT/EXT</th>
            <th>Label</th>
            <th>Grue</th>
            <th>ML max</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {trucks.map((t, i) => (
            <tr key={t.id}>
              <td>
                <input value={t.id} onChange={(e) => edit(i, "id", e.target.value)} />
              </td>
              <td>
                <input
                  value={t.internalExternal}
                  onChange={(e) => edit(i, "internalExternal", e.target.value)}
                />
              </td>
              <td>
                <input value={t.label} onChange={(e) => edit(i, "label", e.target.value)} />
              </td>
              <td>
                <input
                  value={String(t.hasCrane)}
                  onChange={(e) => edit(i, "hasCrane", e.target.value)}
                />
              </td>
              <td>
                <input value={String(t.mlMax)} onChange={(e) => edit(i, "mlMax", e.target.value)} />
              </td>
              <td>
                <button onClick={() => deleteRow(i)}>Supprimer</button>
              </td>
            </tr>
          ))}

          {!trucks.length && (
            <tr>
              <td colSpan={6}>Aucun camion importé.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
