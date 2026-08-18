import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Dashboard } from "./Dashboard";

export default async function Home() {
  const profile = await requireProfile();

  if (profile.role === "admin") {
    return <Dashboard />;
  }

  if (profile.role === "client" && profile.client_id) {
    const supabase = await createClient();
    const { data: projets } = await supabase
      .from("projets")
      .select("id")
      .eq("client_id", profile.client_id)
      .order("created_at", { ascending: false })
      .limit(2);

    if (projets && projets.length === 1) {
      redirect(`/projets/${projets[0].id}`);
    }
  }

  redirect("/projets");
}
