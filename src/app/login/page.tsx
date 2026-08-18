import { LoginForm } from "./LoginForm";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-navy px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl bg-cream p-8 shadow-xl">
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
