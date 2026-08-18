"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/types/database";

export async function createUserEntry(formData: FormData) {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "client") as UserRole;
  const clientId = String(formData.get("client_id") ?? "").trim();
  const prestataireId = String(formData.get("prestataire_id") ?? "").trim();

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) throw new Error(error.message);

  const supabase = await createClient();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      role,
      full_name: fullName || null,
      client_id: role === "client" && clientId ? clientId : null,
      prestataire_id: role === "prestataire" && prestataireId ? prestataireId : null,
    })
    .eq("id", data.user.id);

  if (profileError) throw new Error(profileError.message);

  revalidatePath("/admin/utilisateurs");
}

export async function updateUserEntry(userId: string, formData: FormData) {
  await requireAdmin();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "client") as UserRole;
  const clientId = String(formData.get("client_id") ?? "").trim();
  const prestataireId = String(formData.get("prestataire_id") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      role,
      full_name: fullName || null,
      client_id: role === "client" && clientId ? clientId : null,
      prestataire_id: role === "prestataire" && prestataireId ? prestataireId : null,
    })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/utilisateurs");
}

export async function deleteUserEntry(userId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/utilisateurs");
}
