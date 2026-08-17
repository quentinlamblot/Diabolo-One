import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Client, Prestataire, Profile } from "@/types/database";
import { UserEditForm } from "../UserEditForm";
import { updateUserEntry } from "../actions";

export default async function EditUserPage({ params }: PageProps<"/admin/utilisateurs/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: profile }, { data: clients }, { data: prestataires }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase.from("clients").select("*").order("nom"),
    supabase.from("prestataires").select("*").order("nom"),
  ]);

  if (!profile) notFound();

  const boundUpdate = updateUserEntry.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/utilisateurs" className="text-sm text-zinc-500 hover:underline">
          ← Utilisateurs
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Modifier l&apos;utilisateur</h1>
      </div>

      <UserEditForm
        profile={profile as Profile}
        clients={(clients ?? []) as Client[]}
        prestataires={(prestataires ?? []) as Prestataire[]}
        action={boundUpdate}
      />
    </div>
  );
}
