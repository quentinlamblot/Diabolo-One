"use client";

export function isUrl(value: string | null | undefined): boolean {
  return !!value && /^https?:\/\//i.test(value.trim());
}

// Petite icône de lien affichée à côté d'un champ éditable (ou d'une valeur
// affichée) quand son contenu ressemble à une URL (LinkedIn, Riverside,
// Drive...), pour l'ouvrir sans avoir à copier-coller.
export function LinkOpener({ value }: { value: string | null | undefined }) {
  if (!isUrl(value)) return null;
  return (
    <a
      href={value!.trim()}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="shrink-0 text-zinc-400 hover:text-blue-600"
      title="Ouvrir le lien"
    >
      ↗
    </a>
  );
}
