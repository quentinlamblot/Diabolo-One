import type { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Le chef de projet (un prestataire désigné sur la fiche projet) est prévenu
// par email quand le client fait avancer le dossier de son côté (brief
// rempli, contacts ajoutés), pour ne pas avoir à vérifier manuellement.
export async function notifierChefDeProjet(
  supabase: SupabaseServerClient,
  projetId: string,
  subject: string,
  bodyLines: string[]
) {
  const { data: projet } = await supabase
    .from("projets")
    .select("nom, chef_de_projet:chef_de_projet_id(nom, email)")
    .eq("id", projetId)
    .single();
  if (!projet) return;

  const chef = Array.isArray(projet.chef_de_projet) ? projet.chef_de_projet[0] : projet.chef_de_projet;
  if (!chef?.email) return;

  await sendEmail({
    to: chef.email,
    subject: `${subject} — ${projet.nom}`,
    html: `
      <p>Bonjour ${chef.nom},</p>
      ${bodyLines.map((l) => `<p>${l}</p>`).join("\n")}
      <p>Connectez-vous à Gestion Projet pour voir le détail.</p>
    `,
  });
}
