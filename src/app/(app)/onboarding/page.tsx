import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./OnboardingWizard";
import { submitOnboarding } from "./actions";

export default async function OnboardingPage() {
  const profile = await requireProfile();
  if (profile.role !== "client" || !profile.client_id) redirect("/");

  const supabase = await createClient();

  const [{ data: projets }, { data: client }] = await Promise.all([
    supabase
      .from("projets")
      .select("id")
      .eq("client_id", profile.client_id)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase.from("clients").select("nom").eq("id", profile.client_id).single(),
  ]);

  if (!projets || projets.length === 0) redirect("/projets");
  const projetId = projets[0].id;

  const { data: existing } = await supabase
    .from("onboarding_reponses")
    .select("id")
    .eq("projet_id", projetId)
    .maybeSingle();
  if (existing) redirect("/");

  const boundSubmit = async (formData: FormData) => {
    "use server";
    await submitOnboarding(projetId, formData);
  };

  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <OnboardingWizard clientNom={client?.nom ?? profile.full_name ?? ""} projetId={projetId} action={boundSubmit} />
    </div>
  );
}
