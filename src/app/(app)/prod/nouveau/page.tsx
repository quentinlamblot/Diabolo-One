import { requireSuperAdmin } from "@/lib/auth";
import { ProdProjetForm } from "../ProdProjetForm";
import { createProdProjet } from "../actions";

export default async function NouveauProdProjetPage() {
  await requireSuperAdmin();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Nouveau projet Diabolo Prod</h1>
      <ProdProjetForm action={createProdProjet} submitLabel="Créer le projet" />
    </div>
  );
}
