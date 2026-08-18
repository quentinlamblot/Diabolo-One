import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Diabolo One",
  description: "Suivi de projets, prestataires et interviewés — Diabolo Agency",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-cream text-zinc-900">{children}</body>
    </html>
  );
}
