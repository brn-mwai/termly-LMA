"use client";

import { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

export function Providers({ children }: { children: ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
