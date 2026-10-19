"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { authClient } from "@/shared/auth-client";
import { Button } from "@/shared/ui";

/** Ends the session and goes to the sign-in page. */
export function SignOutButton() {
  const t = useTranslations("auth");
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t("signOut")}
      title={t("signOut")}
      onClick={() => {
        void authClient.signOut().then(() => {
          router.push("/sign-in");
          router.refresh();
        });
      }}
    >
      <LogOut size={16} aria-hidden />
    </Button>
  );
}
