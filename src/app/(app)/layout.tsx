import { requireProfile } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import { Logo } from "@/components/Logo";
import Link from "next/link";

const navLinkClass =
  "rounded-full px-3 py-2 text-sm font-medium text-sky/90 hover:bg-white/10 hover:text-cream";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  const gestionItems = [
    { href: "/admin/utilisateurs", label: "Utilisateurs" },
    { href: "/admin/clients", label: "Clients" },
    { href: "/admin/prestataires", label: "Prestataires" },
    { href: "/admin/offres", label: "Offres" },
    { href: "/admin/statuts", label: "Statuts" },
  ];

  const roleLabel: Record<string, string> = {
    admin: "Admin",
    prestataire: "Prestataire",
    client: "Client",
  };

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="flex w-64 flex-col bg-navy px-4 py-6">
        <div className="mb-8 px-2">
          <Logo markColor="#8cc5f4" markClassName="h-8 w-8" wordmarkClassName="text-lg text-sky" />
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          <Link href="/" className={navLinkClass}>
            Tableau de bord
          </Link>
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
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-full px-3 py-2 text-sm font-medium text-sky/90 hover:bg-white/10 hover:text-cream">
                  Gestion
                  <span className="text-sky/50 transition-transform group-open:rotate-90">›</span>
                </summary>
                <div className="mt-1 flex flex-col gap-1 pl-3">
                  {gestionItems.map((item) => (
                    <Link key={item.href} href={item.href} className={navLinkClass}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </details>

              <Link href="/admin/paiements" className={navLinkClass}>
                Paiements
              </Link>
            </>
          )}

          {profile.role === "admin" && profile.super_admin && (
            <>
              <div className="my-2 border-t border-white/10" />
              <Link href="/prod" className={navLinkClass}>
                Diabolo Prod
              </Link>
              <Link href="/prod/finances" className={navLinkClass}>
                Finances
              </Link>
            </>
          )}
        </nav>
        <div className="mt-auto border-t border-white/10 pt-4">
          <p className="px-2 text-xs text-sky/60">{profile.full_name ?? profile.email}</p>
          <p className="px-2 text-xs font-medium text-sand">{roleLabel[profile.role]}</p>
          <form action={signOut}>
            <button
              type="submit"
              className="mt-2 w-full rounded-full px-3 py-2 text-left text-sm text-sky/90 hover:bg-white/10 hover:text-cream"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto bg-cream p-8">{children}</main>
    </div>
  );
}
