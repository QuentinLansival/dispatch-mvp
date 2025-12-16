import "./globals.css";
import Nav from "@/components/Nav";

export const metadata = {
  title: "Dispatch MVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
