import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getUser } from "@/shared/auth";

export default async function FormsLayout({ children }: { children: ReactNode }) {
  if (!(await getUser())) redirect("/sign-in");
  return children;
}
