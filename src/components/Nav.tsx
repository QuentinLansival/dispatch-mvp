"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Accueil" },
  { href: "/camions", label: "Camions" },
  { href: "/lieux", label: "Lieux" },
  { href: "/demandes", label: "Demandes" },
  { href: "/planning", label: "Planning" }
];

export default function Nav() {
  const path = usePathname();

  return (
    <nav style={{ display: "flex", gap: 12, marginBottom: 20 }}>
      {items.map(i => (
        <Link
          key={i.href}
          href={i.href}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            background: path === i.href ? "#ddd" : "#f2f2f2"
          }}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
