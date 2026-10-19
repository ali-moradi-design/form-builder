"use client";

import { Lock, Mail, Sparkles, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { authClient } from "@/shared/auth-client";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui";
import { signInDemo } from "../api/demo";

type Mode = "signIn" | "signUp";

function Input({
  icon,
  label,
  ...props
}: { icon: ReactNode; label: string } & React.ComponentProps<"input">) {
  return (
    <label className="grid gap-1.5 text-[13px] font-medium">
      {label}
      <span className="flex h-11 items-center gap-2 rounded-[10px] border border-line-strong bg-surface px-3 text-ink-3 shadow-xs focus-within:border-primary focus-within:outline-3 focus-within:outline-primary-soft">
        {icon}
        <input
          {...props}
          className="min-w-0 grow bg-transparent text-sm font-normal text-ink outline-none"
        />
      </span>
    </label>
  );
}

/**
 * Email and password sign-in, sign-up when it is open, plus the demo account.
 */
export function SignInForm({ signUp = false }: { signUp?: boolean }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signIn");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (data: FormData) => {
    const text = (key: string): string => {
      const value = data.get(key);
      return typeof value === "string" ? value : "";
    };
    const email = text("email");
    const password = text("password");
    const name = text("name") || email.split("@")[0] || "User";
    setError(null);
    start(async () => {
      const result =
        mode === "signIn"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({ email, password, name });
      if (result.error) {
        setError(result.error.message ?? t("failed"));
        return;
      }
      router.push("/forms");
      router.refresh();
    });
  };

  return (
    <div className="grid w-full max-w-[400px] gap-4">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">
          {t(mode === "signIn" ? "welcome" : "create")}
        </h1>
        <p className="text-ink-2">{t("subtitle")}</p>
      </div>
      {signUp && (
        <div
          role="tablist"
          className="grid grid-cols-2 rounded-[11px] border border-line bg-surface-2 p-1"
        >
          {(["signIn", "signUp"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className="rounded-lg py-1.5 text-[13px] text-ink-2 aria-selected:bg-surface aria-selected:font-medium aria-selected:text-ink aria-selected:shadow-xs"
            >
              {t(m)}
            </button>
          ))}
        </div>
      )}
      <form action={submit} className="grid gap-3.5">
        {mode === "signUp" && (
          <Input
            icon={<User size={15} aria-hidden />}
            label={t("name")}
            name="name"
            autoComplete="name"
          />
        )}
        <Input
          icon={<Mail size={15} aria-hidden />}
          label={t("email")}
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <Input
          icon={<Lock size={15} aria-hidden />}
          label={t("password")}
          name="password"
          type="password"
          minLength={8}
          autoComplete={mode === "signIn" ? "current-password" : "new-password"}
          required
        />
        {error && (
          <p role="alert" className="text-[13px] text-carmine dark:text-[#e2566b]">
            {error}
          </p>
        )}
        <Button variant="primary" size="lg" type="submit" disabled={pending} className="w-full">
          {t(mode)}
        </Button>
      </form>
      <div className="flex items-center gap-3 text-xs text-ink-3">
        <span className="h-px grow bg-line" />
        {t("or")}
        <span className="h-px grow bg-line" />
      </div>
      <form action={signInDemo}>
        <Button size="lg" type="submit" className={cn("w-full")}>
          <Sparkles size={15} aria-hidden />
          {t("demo")}
        </Button>
      </form>
      <p className="text-center text-[12.5px] text-ink-2">{t("demoNote")}</p>
    </div>
  );
}
