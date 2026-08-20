import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { ProdProjet, ProdProjetPrestataire, Prestataire } from "@/types/database";
import { ProdProjetForm } from "../ProdProjetForm";
import { updateProdProjet, deleteProdProjet, assignPrestataireProd, updatePrestataireProd, removePrestataireProd } from "../actions";
import { ProdPrestataires } from "./ProdPrestataires";

export default async function ProdProjetDetailPage({ params }: PageProps<"/prod/[id]">) {
  await requireSuperAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: projet }, { data: assignations }, { data: prestataires }] = await Promise.all([
    supabase.from("prod_projets").select("*").eq("id", id).single(),
    supabase.from("prod_projet_prestataires").select("*, prestataires(*)").eq("prod_projet_id", id).order("created_at"),
    supabase.from("prestataires").select("*").order("nom"),
  ]);

  if (!projet) notFound();

  const boundUpdate = updateProdProjet.bind(null, id);
  const boundDelete = deleteProdProjet.bind(null, id);
  const boundAssign = async (formData: FormData) => {
    "use server";
    await assignPrestataireProd(id, formData);
  };
  const boundUpdatePresta = async (rowId: string, formData: FormData) => {
    "use server";
    await updatePrestataireProd(id, rowId, formData);
  };
  const boundRemovePresta = async (rowId: string) => {
    "use server";
    await removePrestataireProd(id, rowId);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/prod" className="text-sm text-zinc-500 hover:underline">
            ← Diabolo Prod
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{(projet as ProdProjet).nom}</h1>
        </div>
        <DeleteButton action={boundDelete} />
      </div>

      <ProdProjetForm projet={projet as ProdProjet} action={boundUpdate} autosave />

      <ProdPrestataires
        assignations={(assignations ?? []) as ProdProjetPrestataire[]}
        prestataires={(prestataires ?? []) as Prestataire[]}
        assignAction={boundAssign}
        updateAction={boundUpdatePresta}
        removeAction={boundRemovePresta}
      />
    </div>
  );
}

function DeleteButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <button type="submit" className="rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100">
        Supprimer
      </button>
    </form>
  );
}
