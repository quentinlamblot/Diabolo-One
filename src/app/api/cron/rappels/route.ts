import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

const JOURS_AVANT_RAPPEL = 2;

function dansNJours(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

interface VideoAEchoir {
  id: string;
  titre: string | null;
  date_tournage: string | null;
  date_livraison: string | null;
  projets: { nom: string } | { nom: string }[] | null;
  prestataires: { nom: string; email: string | null } | { nom: string; email: string | null }[] | null;
  statuts: { label: string } | { label: string }[] | null;
}

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const cible = dansNJours(JOURS_AVANT_RAPPEL);

  const { data: videos, error } = await supabase
    .from("videos")
    .select("id, titre, date_tournage, date_livraison, projets(nom), prestataires(nom, email), statuts(label)")
    .or(`date_tournage.eq.${cible},date_livraison.eq.${cible}`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let envoyes = 0;

  for (const video of (videos ?? []) as VideoAEchoir[]) {
    const statut = one(video.statuts);
    const projet = one(video.projets);
    const prestataire = one(video.prestataires);
    if (!prestataire?.email || !projet) continue;

    const tournageAEcheoir = video.date_tournage === cible && statut?.label === "À tourner";
    const livraisonAEcheoir = video.date_livraison === cible && statut?.label !== "Livré";
    if (!tournageAEcheoir && !livraisonAEcheoir) continue;

    const titreVideo = video.titre || "cette vidéo";
    const echeance = tournageAEcheoir ? "le tournage" : "la livraison";
    const dateEcheance = tournageAEcheoir ? video.date_tournage : video.date_livraison;

    await sendEmail({
      to: prestataire.email,
      subject: `Rappel : ${echeance} de ${titreVideo} approche — ${projet.nom}`,
      html: `
        <p>Bonjour ${prestataire.nom},</p>
        <p>Rappel : ${echeance} de <strong>${titreVideo}</strong> (projet <strong>${projet.nom}</strong>) est prévu(e) le <strong>${dateEcheance}</strong>, dans ${JOURS_AVANT_RAPPEL} jours.</p>
        <p>Connectez-vous à Diabolo One pour voir le détail.</p>
      `,
    });
    envoyes++;
  }

  return NextResponse.json({ ok: true, envoyes });
}
