"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

export async function createClientEntry(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("clients").insert({
    nom: str(formData, "nom"),
    email: str(formData, "email"),
    telephone: str(formData, "telephone"),
    notes: str(formData, "notes"),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/clients");
}

export async function deleteClientEntry(clientId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/clients");
}
