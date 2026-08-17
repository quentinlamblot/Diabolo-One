import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-zinc-900">Gestion Projet</h1>
        <p className="mb-6 text-sm text-zinc-500">Connectez-vous à votre espace.</p>
        <LoginForm />
      </div>
    </div>
  );
}
