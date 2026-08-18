import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { TachePrestataire, Prestataire, Projet, TarifMonteur } from "@/types/database";
import { createTache, deleteTache, updateTarifsMonteur } from "./actions";
import { TacheForm } from "./TacheForm";
import Link from "next/link";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
}

export default async function PaiementsAdminPage({
  searchParams,
}: PageProps<"/admin/paiements">) {
  await requireAdmin();
  const params = await searchParams;
  const month = typeof params.mois === "string" && /^\d{4}-\d{2}$/.test(params.mois)
    ? params.mois
    : currentMonth();

  const supabase = await createClient();
  const monthStart = `${month}-01`;
  const monthEnd = `${shiftMonth(month, 1)}-01`;

  const [{ data: taches }, { data: prestataires }, { data: projets }, { data: tarifs }] = await Promise.all([
    supabase
      .from("taches_prestataires")
      .select("*, prestataires(*), projets(*)")
      .gte("mois", monthStart)
      .lt("mois", monthEnd)
      .order("date_tache", { ascending: false }),
    supabase.from("prestataires").select("*").order("nom"),
    supabase.from("projets").select("*").order("nom"),
    supabase.from("tarifs_monteur").select("*"),
  ]);

  const list = (taches ?? []) as TachePrestataire[];
  const prestataireList = (prestataires ?? []) as Prestataire[];
  const projetList = (projets ?? []) as Projet[];
  const tarifList = (tarifs ?? []) as TarifMonteur[];
  const tarifPremium = tarifList.find((t) => t.cle === "video_premium");
  const tarifClassique = tarifList.find((t) => t.cle === "video_classique");

  const byPrestataire = new Map<string, { prestataire: Prestataire | undefined; taches: TachePrestataire[]; total: number }>();
  for (const t of list) {
    const key = t.prestataire_id;
    if (!byPrestataire.has(key)) {
      byPrestataire.set(key, { prestataire: t.prestataires, taches: [], total: 0 });
    }
    const entry = byPrestataire.get(key)!;
    entry.taches.push(t);
    entry.total += Number(t.montant);
  }

  const grandTotal = list.reduce((sum, t) => sum + Number(t.montant), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Paiements & tâches</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/paiements?mois=${shiftMonth(month, -1)}`}
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100"
          >
            ← Mois préc.
          </Link>
          <span className="w-40 text-center text-sm font-medium capitalize text-zinc-800">
            {formatMonthLabel(month)}
          </span>
          <Link
            href={`/admin/paiements?mois=${shiftMonth(month, 1)}`}
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100"
          >
            Mois suiv. →
          </Link>
        </div>
      </div>

      <details className="rounded-lg border border-zinc-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
          Tarifs monteur (prix par vidéo)
        </summary>
        <form action={updateTarifsMonteur} className="mt-3 flex items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">Vidéo montée premium (€)</span>
            <input
              name="prix_video_premium"
              type="number"
              step="0.01"
              defaultValue={tarifPremium?.prix ?? 0}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">Vidéo montée classique (€)</span>
            <input
              name="prix_video_classique"
              type="number"
              step="0.01"
              defaultValue={tarifClassique?.prix ?? 0}
              className="input"
            />
          </label>
          <button type="submit" className="rounded-full bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-sky-dark">
            Enregistrer les tarifs
          </button>
        </form>
      </details>

      <TacheForm
        mois={month}
        prestataires={prestataireList}
        projets={projetList}
        tarifsMonteur={tarifList}
        action={createTache}
      />

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <p className="text-sm text-zinc-500">Total dû ce mois-ci</p>
        <p className="text-3xl font-semibold text-zinc-900">
          {grandTotal.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
        </p>
      </div>

      {byPrestataire.size === 0 ? (
        <p className="text-sm text-zinc-500">Aucune tâche enregistrée pour ce mois.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {Array.from(byPrestataire.values()).map((entry) => (
            <div key={entry.prestataire?.id} className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <div className="flex items-center justify-between bg-zinc-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-zinc-900">{entry.prestataire?.nom ?? "—"}</h3>
                <span className="text-sm font-semibold text-zinc-900">
                  {entry.total.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                </span>
              </div>
              <table className="min-w-full divide-y divide-zinc-100 text-sm">
                <tbody className="divide-y divide-zinc-100">
                  {entry.taches.map((t) => (
                    <tr key={t.id} className="hover:bg-zinc-50">
                      <td className="whitespace-nowrap px-4 py-2.5 text-zinc-500">
                        {new Date(t.date_tache).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-zinc-500 capitalize">
                        {t.type_remuneration?.replace("_", " ") ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-800">{t.description}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-zinc-500">{t.projets?.nom ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium text-zinc-900">
                        {Number(t.montant).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right">
                        <DeleteButton id={t.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DeleteButton({ id }: { id: string }) {
  const action = async () => {
    "use server";
    await deleteTache(id);
  };
  return (
    <form action={action}>
      <button type="submit" className="text-xs font-medium text-red-500 hover:underline">
        Supprimer
      </button>
    </form>
  );
}
