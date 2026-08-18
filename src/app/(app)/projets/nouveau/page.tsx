import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { ProjetForm } from "../ProjetForm";
import { createProjet } from "../actions";
import type { Client, Offre, Statut, Prestataire } from "@/types/database";

export default async function NouveauProjetPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: clients }, { data: offres }, { data: statuts }, { data: prestataires }] = await Promise.all([
    supabase.from("clients").select("*").order("nom"),
    supabase.from("offres").select("*").order("nom"),
    supabase.from("statuts").select("*").eq("type", "projet").order("ordre"),
    supabase.from("prestataires").select("*").order("nom"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Nouveau projet</h1>
      <ProjetForm
        clients={(clients ?? []) as Client[]}
        offres={(offres ?? []) as Offre[]}
        statuts={(statuts ?? []) as Statut[]}
        prestataires={(prestataires ?? []) as Prestataire[]}
        action={createProjet}
        submitLabel="Créer le projet"
      />
    </div>
  );
}
