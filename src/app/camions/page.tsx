"use client";

import { useEffect, useState } from "react";
import { load, save, removeItemByIndex } from "@/lib/storage";
import { parseTable } from "@/lib/parseTable";

const KEY = "camions";

export default function CamionsPage() {
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

  function remove(i: number) {
    removeItemByIndex(KEY, i);
    setList(load(KEY, []));
  }

  return (
    <>
      <h1>Camions</h1>

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
            <th>ID</th>
            <th>INT/EXT</th>
            <th>Label</th>
            <th>Grue</th>
            <th>ML max</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {list.map((c, i) => (
            <tr key={i}>
              <td>{c.ID}</td>
              <td>{c["Interne/Externe"]}</td>
              <td>{c.Label}</td>
              <td>{String(c.Grue)}</td>
              <td>{c["Ml max"]}</td>
              <td>
                <button onClick={() => remove(i)}>❌</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
