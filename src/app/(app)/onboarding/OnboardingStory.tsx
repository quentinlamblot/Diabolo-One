"use client";

import { useState } from "react";
import Link from "next/link";

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />
    </svg>
  );
}

function ContactIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
      <circle cx="10" cy="9" r="3.25" />
      <path d="M4.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M18 8v6M21 11h-6" />
    </svg>
  );
}

function HandshakeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
      <path d="M3 12l4-4 4 3.2 3-3 4 4-3 3-2-2-3 3-3-2" />
      <path d="M14 8.2l2.5-2.5L21 10" />
      <path d="M8 16l2 2M11 13l2.5 2.5" />
    </svg>
  );
}

function ChecklistIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
      <path d="M4 6.5l1.5 1.5L8 5.5" />
      <path d="M11 6.5h9" />
      <path d="M4 12.5l1.5 1.5L8 11.5" />
      <path d="M11 12.5h9" />
      <path d="M4 18.5l1.5 1.5L8 17.5" />
      <path d="M11 18.5h9" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.5" />
      <rect x="13.5" y="10.5" width="7" height="10" rx="1.5" />
      <rect x="3.5" y="13" width="7" height="7.5" rx="1.5" />
    </svg>
  );
}

const SCREENS = [
  {
    icon: SparkIcon,
    badge: "sand" as const,
    title: "C'est parti !",
    text: "Parfait, nous avons maintenant les informations nécessaires pour démarrer votre projet.",
  },
  {
    icon: ContactIcon,
    badge: "sky" as const,
    title: "Ajoutez vos contacts",
    text: "Vous allez maintenant pouvoir ajouter les personnes que vous souhaitez faire interviewer, une par une ou en important un fichier Excel — un modèle est téléchargeable directement depuis cette page.",
  },
  {
    icon: HandshakeIcon,
    badge: "sand" as const,
    title: "Nous prenons le relais",
    text: "Une fois vos contacts ajoutés, notre équipe peut les contacter directement pour organiser les interviews et les tournages.",
  },
  {
    icon: ChecklistIcon,
    badge: "sky" as const,
    title: "Suivez chaque interview",
    text: "Contactée, tournage planifié, tournage réalisé, montage en cours, vidéo terminée : suivez l'avancement de chaque personne depuis votre espace.",
  },
  {
    icon: DashboardIcon,
    badge: "sand" as const,
    title: "Votre tableau de bord",
    text: "Retrouvez à tout moment une vue globale de votre projet depuis le Tableau de bord, accessible dans le menu à gauche.",
  },
];

export function OnboardingStory({ projetId }: { projetId: string }) {
  const [step, setStep] = useState(0);
  const screen = SCREENS[step];
  const Icon = screen.icon;
  const isLast = step === SCREENS.length - 1;

  return (
    <div
      key={step}
      className="onboarding-step mx-auto flex max-w-md flex-col items-center gap-5 rounded-2xl bg-white p-10 text-center shadow-sm"
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full ${
          screen.badge === "sand" ? "bg-sand/40 text-sand-dark" : "bg-sky/30 text-sky-dark"
        }`}
      >
        <Icon />
      </div>

      <h1 className="text-xl text-zinc-900">{screen.title}</h1>
      <p className="text-sm leading-relaxed text-zinc-500">{screen.text}</p>

      <div className="flex items-center gap-1.5">
        {SCREENS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === step ? "w-5 bg-navy" : "w-1.5 bg-zinc-200"
            }`}
          />
        ))}
      </div>

      {isLast ? (
        <Link
          href={`/projets/${projetId}/contacts`}
          className="mt-1 rounded-full bg-navy px-6 py-2.5 text-sm font-medium text-white hover:bg-sky-dark"
        >
          Ajouter mes premiers contacts
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => setStep((s) => s + 1)}
          className="mt-1 rounded-full bg-navy px-6 py-2.5 text-sm font-medium text-white hover:bg-sky-dark"
        >
          Suivant
        </button>
      )}
    </div>
  );
}
