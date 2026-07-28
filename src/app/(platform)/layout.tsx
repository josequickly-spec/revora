import type { ReactNode } from "react";
import AppShell from "@/components/app-shell/AppShell";

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
