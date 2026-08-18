import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Commentaire, Prestataire, Projet } from "@/types/database";
import { createCommentaire } from "./actions";

export default async function MessageriePage() {
  const profile = await requireProfile();
  if (profile.role !== "admin" && profile.role !== "prestataire") redirect("/projets");

  const supabase = await createClient();

  const [{ data: projets }, { data: commentaires }, { data: assignations }] = await Promise.all([
    supabase.from("projets").select("id, nom").order("nom"),
    supabase
      .from("commentaires")
      .select("*, profiles(*), prestataires(*)")
      .order("created_at", { ascending: true }),
    supabase.from("projet_prestataires").select("projet_id, prestataires(*)"),
  ]);

  const projetList = (projets ?? []) as Pick<Projet, "id" | "nom">[];
  const commentList = (commentaires ?? []) as Commentaire[];

  const byProjet = new Map<string, Commentaire[]>();
  for (const c of commentList) {
    if (!byProjet.has(c.projet_id)) byProjet.set(c.projet_id, []);
    byProjet.get(c.projet_id)!.push(c);
  }

  const prestatairesByProjet = new Map<string, Prestataire[]>();
  for (const a of assignations ?? []) {
    const list = prestatairesByProjet.get(a.projet_id) ?? [];
    if (a.prestataires) list.push(a.prestataires as unknown as Prestataire);
    prestatairesByProjet.set(a.projet_id, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Messagerie</h1>
        <p className="text-sm text-zinc-500">Commentaires liés aux projets et aux affectations de prestataires.</p>
      </div>

      {projetList.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun projet accessible pour le moment.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {projetList.map((p) => (
            <ProjetThread
              key={p.id}
              projet={p}
              commentaires={byProjet.get(p.id) ?? []}
              prestataires={prestatairesByProjet.get(p.id) ?? []}
              isAdmin={profile.role === "admin"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjetThread({
  projet,
  commentaires,
  prestataires,
  isAdmin,
}: {
  projet: Pick<Projet, "id" | "nom">;
  commentaires: Commentaire[];
  prestataires: Prestataire[];
  isAdmin: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">{projet.nom}</h2>

      {commentaires.length === 0 ? (
        <p className="mb-3 text-sm text-zinc-400">Aucun message pour ce projet.</p>
      ) : (
        <div className="mb-4 flex flex-col gap-3">
          {commentaires.map((c) => (
            <div key={c.id} className="rounded-md bg-zinc-50 p-3 text-sm">
              <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
                <span className="font-medium text-zinc-700">
                  {c.profiles?.full_name ?? c.profiles?.email ?? "—"}
                </span>
                {c.prestataires && (
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-zinc-600">
                    Affectation : {c.prestataires.nom}
                  </span>
                )}
                <span>{new Date(c.created_at).toLocaleString("fr-FR")}</span>
              </div>
              <p className="whitespace-pre-wrap text-zinc-800">{c.contenu}</p>
            </div>
          ))}
        </div>
      )}

      <form action={createCommentaire} className="flex flex-col gap-2">
        <input type="hidden" name="projet_id" value={projet.id} />
        {isAdmin && prestataires.length > 0 && (
          <select name="prestataire_id" defaultValue="" className="input">
            <option value="">Message général sur le projet</option>
            {prestataires.map((p) => (
              <option key={p.id} value={p.id}>
                Concernant : {p.nom}
              </option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-2">
          <input name="contenu" placeholder="Écrire un message..." required className="input flex-1" />
          <button
            type="submit"
            className="rounded-full bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-sky-dark"
          >
            Envoyer
          </button>
        </div>
      </form>
    </div>
  );
}
