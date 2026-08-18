import { LoginForm } from "./LoginForm";
import { Logo } from "@/components/Logo";
import { BrandSunburst } from "@/components/BrandSunburst";

export default function LoginPage() {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-navy px-4 py-12">
      <BrandSunburst
        color="#8cc5f4"
        className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 opacity-[0.08]"
      />
      <BrandSunburst
        color="#f9c8a7"
        className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 opacity-[0.1]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-1/4 top-1/4 h-40 w-40 rounded-full bg-sky/10 blur-3xl"
      />
      <div className="relative w-full max-w-sm rounded-3xl bg-cream p-8 shadow-xl">
        <Logo markColor="#10263d" markClassName="h-9 w-9" wordmarkClassName="text-xl text-zinc-900" className="mb-6" />
        <h1 className="mb-1 flex items-center gap-2 text-xl text-zinc-900">
          Connexion
          <span className="h-2 w-2 rounded-full bg-sand" />
        </h1>
        <p className="mb-6 text-sm text-zinc-500">Connectez-vous à votre espace.</p>
        <LoginForm />
      </div>
    </div>
  );
}
