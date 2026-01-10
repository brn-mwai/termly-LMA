"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react";

interface OnboardingCheckProps {
  children: React.ReactNode;
}

export function OnboardingCheck({ children }: OnboardingCheckProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const res = await fetch("/api/onboarding/status");
        if (res.ok) {
          const { data } = await res.json();
          if (!data?.onboarding_completed) {
            // User hasn't completed onboarding, redirect
            router.replace("/onboarding");
            return;
          }
          setIsComplete(true);
        } else {
          // API error, assume not complete for new users
          router.replace("/onboarding");
        }
      } catch (error) {
        console.error("Failed to check onboarding:", error);
        // On error, let them through to avoid blocking
        setIsComplete(true);
      } finally {
        setIsChecking(false);
      }
    }

    // Don't check if we're already on onboarding page
    if (pathname?.startsWith("/onboarding")) {
      setIsChecking(false);
      setIsComplete(true);
      return;
    }

    checkOnboarding();
  }, [router, pathname]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <CircleNotch className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isComplete) {
    return null; // Redirecting...
  }

  return <>{children}</>;
}
