"use client";

import { useState } from "react";
import type { Client, Prestataire, Profile } from "@/types/database";
import { AutosaveForm } from "@/components/AutosaveForm";

export function UserEditForm({
  profile,
  clients,
  prestataires,
  action,
}: {
  profile: Profile;
  clients: Client[];
  prestataires: Prestataire[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [role, setRole] = useState<"admin" | "prestataire" | "client">(profile.role);

  return (
    <AutosaveForm action={action} className="flex max-w-lg flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5">
      <Field label="Nom complet">
        <input name="full_name" defaultValue={profile.full_name ?? ""} className="input" />
      </Field>
      <Field label="Email">
        <input value={profile.email} disabled className="input bg-zinc-100 text-zinc-500" />
      </Field>
      <Field label="Rôle">
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
      </Field>
      {role === "client" && (
        <Field label="Lié au client">
          <select name="client_id" defaultValue={profile.client_id ?? ""} required className="input">
            <option value="">Lier au client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </Field>
      )}
      {role === "prestataire" && (
        <Field label="Lié au prestataire">
          <select name="prestataire_id" defaultValue={profile.prestataire_id ?? ""} required className="input">
            <option value="">Lier au prestataire...</option>
            {prestataires.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
        </Field>
      )}
    </AutosaveForm>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}
