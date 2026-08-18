"use client";

import { useState } from "react";
import type { Client, Prestataire } from "@/types/database";

export function UserForm({
  clients,
  prestataires,
  action,
}: {
  clients: Client[];
  prestataires: Prestataire[];
  action: (formData: FormData) => void;
}) {
  const [role, setRole] = useState<"admin" | "prestataire" | "client">("client");

  return (
    <form action={action} className="grid grid-cols-6 gap-3 rounded-lg border border-zinc-200 bg-white p-4">
      <input name="full_name" placeholder="Nom complet" className="input" />
      <input name="email" type="email" placeholder="Email" required className="input" />
      <input name="password" type="password" placeholder="Mot de passe" required minLength={6} className="input" />
      <select
        name="role"
        value={role}
        onChange={(e) => setRole(e.target.value as typeof role)}
        className="input"
      >
        <option value="client">Client</option>
        <option value="prestataire">Prestataire</option>
        <option value="admin">Admin</option>
      </select>
      {role === "client" && (
        <select name="client_id" required className="input">
          <option value="">Lier au client...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
      )}
      {role === "prestataire" && (
        <select name="prestataire_id" required className="input">
          <option value="">Lier au prestataire...</option>
          {prestataires.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom}
            </option>
          ))}
        </select>
      )}
      <button
        type="submit"
        className="rounded-full bg-navy px-3 py-2 text-sm font-medium text-white hover:bg-sky-dark"
      >
        Créer le compte
      </button>
    </form>
  );
}
