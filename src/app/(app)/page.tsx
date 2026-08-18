import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Dashboard } from "./Dashboard";
import { ClientDashboard } from "./ClientDashboard";

export default async function Home() {
  const profile = await requireProfile();

  if (profile.role === "admin") {
    return <Dashboard />;
  }

  if (profile.role === "client" && profile.client_id) {
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

    if (projets && projets.length > 0) {
      const { data: onboarding } = await supabase
        .from("onboarding_reponses")
        .select("id")
        .eq("projet_id", projets[0].id)
        .maybeSingle();

      if (!onboarding) redirect("/onboarding");
    }

    return <ClientDashboard clientId={profile.client_id} nom={client?.nom ?? profile.full_name ?? ""} />;
  }

  redirect("/projets");
}
