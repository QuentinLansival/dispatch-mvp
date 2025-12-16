"use client";

import { useEffect, useState } from "react";
import { load, save, removeItemByIndex } from "@/lib/storage";
import { parseTable } from "@/lib/parseTable";
import { geocodeOne } from "@/lib/locations";

const KEY = "lieux";

export default function LieuxPage() {
  const [raw, setRaw] = useState("");
  const [list, setList] = useState<any[]>([]);

  useEffect(() => {
    setList(load(KEY, []));
  }, []);

  function importer() {
    const rows = parseTable(raw);
    const merged = [...list, ...rows];
    save(KEY, merged);
    setList(merged);
    setRaw("");
  }

  async function geocode(i: number) {
    const l = list[i];
    const r = await geocodeOne({
      adresse: l.Adresse,
      cp: l["Code postal"],
      ville: l.Ville
    });

    if (!r) {
      alert("Adresse introuvable");
      return;
    }

    const updated = [...list];
    updated[i] = { ...l, Lat: r.lat, Lng: r.lng };
    save(KEY, updated);
    setList(updated);
  }

  function remove(i: number) {
    removeItemByIndex(KEY, i);
    setList(load(KEY, []));
  }

  return (
    <>
      <h1>Lieux</h1>

      <textarea
        value={raw}
        onChange={e => setRaw(e.target.value)}
        rows={6}
        style={{ width: "100%" }}
      />

      <button onClick={importer}>Importer / Fusionner</button>

      <table border={1} cellPadding={4}>
        <thead>
          <tr>
            <th>Code</th>
            <th>Adresse</th>
            <th>CP</th>
            <th>Ville</th>
            <th>Lat</th>
            <th>Lng</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {list.map((l, i) => (
            <tr key={i}>
              <td>{l.Code}</td>
              <td>{l.Adresse}</td>
              <td>{l["Code postal"]}</td>
              <td>{l.Ville}</td>
              <td>{l.Lat ?? ""}</td>
              <td>{l.Lng ?? ""}</td>
              <td><button onClick={() => geocode(i)}>📍</button></td>
              <td><button onClick={() => remove(i)}>❌</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
