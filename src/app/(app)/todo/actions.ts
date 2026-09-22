"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

export async function createTodo(formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("Non autorisé");

  const supabase = await createClient();
  const { error } = await supabase.from("todos").insert({
    titre: str(formData, "titre"),
    date: str(formData, "date"),
    prestataire_id: str(formData, "prestataire_id"),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/");
}

// L'admin gère toutes les tâches ; un prestataire ne peut cocher/décocher
// que les siennes (créer et réassigner restent admin-only).
export async function toggleTodoFait(todoId: string, fait: boolean) {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (profile.role !== "admin") {
    const { data: todo } = await supabase.from("todos").select("prestataire_id").eq("id", todoId).single();
    if (!todo || todo.prestataire_id !== profile.prestataire_id) throw new Error("Non autorisé");
  }

  const { error } = await supabase.from("todos").update({ fait }).eq("id", todoId);
  if (error) throw new Error(error.message);

  revalidatePath("/");
}

export async function deleteTodo(todoId: string) {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("Non autorisé");

  const supabase = await createClient();
  const { error } = await supabase.from("todos").delete().eq("id", todoId);
  if (error) throw new Error(error.message);

  revalidatePath("/");
}
