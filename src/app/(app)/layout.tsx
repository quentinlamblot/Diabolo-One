import { requireProfile } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import Link from "next/link";

const navLinkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  const gestionItems = [
    { href: "/admin/utilisateurs", label: "Utilisateurs" },
    { href: "/admin/clients", label: "Clients" },
    { href: "/admin/prestataires", label: "Prestataires" },
    { href: "/admin/offres", label: "Offres" },
  ];

  const roleLabel: Record<string, string> = {
    admin: "Admin",
    prestataire: "Prestataire",
    client: "Client",
  };

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="flex w-60 flex-col border-r border-zinc-200 bg-white px-4 py-6">
        <div className="mb-8 px-2">
          <h1 className="text-lg font-semibold text-zinc-900">Gestion Projet</h1>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          <Link href="/projets" className={navLinkClass}>
            Projets
          </Link>

          {(profile.role === "admin" || profile.role === "prestataire") && (
            <Link href="/messagerie" className={navLinkClass}>
              Messagerie
            </Link>
          )}

          {profile.role === "admin" && (
            <>
              <details className="group" open>
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900">
                  Gestion
                  <span className="text-zinc-400 transition-transform group-open:rotate-90">›</span>
                </summary>
                <div className="mt-1 flex flex-col gap-1 pl-3">
                  {gestionItems.map((item) => (
                    <Link key={item.href} href={item.href} className={navLinkClass}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </details>

              <Link href="/admin/statuts" className={navLinkClass}>
                Statuts
              </Link>
              <Link href="/admin/paiements" className={navLinkClass}>
                Paiements
              </Link>
            </>
          )}
        </nav>
        <div className="mt-auto border-t border-zinc-200 pt-4">
          <p className="px-2 text-xs text-zinc-400">
            {profile.full_name ?? profile.email}
          </p>
          <p className="px-2 text-xs font-medium text-zinc-500">
            {roleLabel[profile.role]}
          </p>
          <form action={signOut}>
            <button
              type="submit"
              className="mt-2 w-full rounded-md px-3 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-100"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto p-8">{children}</main>
    </div>
  );
}
