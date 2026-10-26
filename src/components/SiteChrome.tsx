"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import ScrollAnimations from "@/components/ScrollAnimations";

/** Hides the public header and footer on /admin so the dashboard has its own chrome. */
export default function SiteChrome({ header, footer, children }: { header: ReactNode; footer: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return <>{children}</>;
  return (
    <>
      <ScrollAnimations />
      {header}
      {children}
      {footer}
    </>
  );
}
