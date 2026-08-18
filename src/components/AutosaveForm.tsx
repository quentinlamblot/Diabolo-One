"use client";

import { useRef, useState } from "react";

export function AutosaveForm({
  action,
  children,
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  function submit() {
    const form = formRef.current;
    if (!form) return;
    setStatus("saving");
    Promise.resolve(action(new FormData(form))).finally(() => {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    });
  }

  return (
    <form
      ref={formRef}
      onBlur={submit}
      onChange={(e) => {
        const target = e.target as unknown as HTMLInputElement;
        if (target.tagName === "SELECT" || ["checkbox", "color", "date", "radio"].includes(target.type)) {
          submit();
        }
      }}
      className={className}
    >
      {children}
      <div className="h-4 text-xs text-zinc-400">
        {status === "saving" ? "Enregistrement…" : status === "saved" ? "Enregistré ✓" : ""}
      </div>
    </form>
  );
}
