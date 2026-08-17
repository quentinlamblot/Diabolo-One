import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { ProjetForm } from "../ProjetForm";
import { createProjet } from "../actions";
import type { Client, Offre, Statut } from "@/types/database";

export default async function NouveauProjetPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: clients }, { data: offres }, { data: statuts }] = await Promise.all([
    supabase.from("clients").select("*").order("nom"),
    supabase.from("offres").select("*").order("nom"),
    supabase.from("statuts").select("*").eq("type", "projet").order("ordre"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Nouveau projet</h1>
      <ProjetForm
        clients={(clients ?? []) as Client[]}
        offres={(offres ?? []) as Offre[]}
        statuts={(statuts ?? []) as Statut[]}
        action={createProjet}
        submitLabel="Créer le projet"
      />
    </div>
  );
}
