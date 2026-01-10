"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { driver, Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { usePathname, useRouter } from "next/navigation";

interface TourContextType {
  startTour: () => void;
  isFirstVisit: boolean;
  setFirstVisitComplete: () => void;
}

const TourContext = createContext<TourContextType | null>(null);

const TOUR_STORAGE_KEY = "termly_tour_completed";
const FIRST_VISIT_KEY = "termly_first_visit";

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [driverObj, setDriverObj] = useState<Driver | null>(null);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Check if this is the user's first visit
  useEffect(() => {
    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    const firstVisit = localStorage.getItem(FIRST_VISIT_KEY);

    if (!firstVisit) {
      localStorage.setItem(FIRST_VISIT_KEY, "true");
      setIsFirstVisit(true);
    }

    if (!tourCompleted && pathname === "/dashboard") {
      // Auto-start tour on first dashboard visit
      const timer = setTimeout(() => {
        startTour();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const startTour = useCallback(() => {
    // Make sure we're on the dashboard
    if (pathname !== "/dashboard") {
      router.push("/dashboard");
      setTimeout(() => initTour(), 500);
    } else {
      initTour();
    }
  }, [pathname, router]);

  const initTour = () => {
    const driverInstance = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayColor: "rgba(0, 0, 0, 0.6)",
      stagePadding: 8,
      stageRadius: 8,
      popoverClass: "termly-tour-popover",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Done",
      onDestroyStarted: () => {
        localStorage.setItem(TOUR_STORAGE_KEY, "true");
        driverInstance.destroy();
      },
      steps: [
        {
          element: '[data-tour="sidebar"]',
          popover: {
            title: "Navigation",
            description: "Use the sidebar to navigate between different sections of the platform. You can collapse it for more space.",
            side: "right",
            align: "start",
          },
        },
        {
          element: '[data-tour="dashboard-stats"]',
          popover: {
            title: "Portfolio Overview",
            description: "See your key metrics at a glance - total loans, outstanding amounts, and compliance status.",
            side: "bottom",
            align: "center",
          },
        },
        {
          element: '[data-tour="covenant-status"]',
          popover: {
            title: "Covenant Status",
            description: "Monitor all your covenants in one place. Green means compliant, yellow is a warning, and red indicates a breach.",
            side: "top",
            align: "center",
          },
        },
        {
          element: '[data-tour="alerts"]',
          popover: {
            title: "Alerts",
            description: "Critical alerts appear here. Click to see details and take action on any compliance issues.",
            side: "left",
            align: "start",
          },
        },
        {
          element: '[data-tour="chat"]',
          popover: {
            title: "AI Assistant",
            description: "Meet Monty! Ask questions about your portfolio, get covenant explanations, or request analysis. Try: 'Show me loans at risk'",
            side: "left",
            align: "center",
          },
        },
        {
          element: '[data-tour="nav-loans"]',
          popover: {
            title: "Loans",
            description: "View and manage all your loans. Click to see individual loan details, covenants, and financial history.",
            side: "right",
            align: "center",
          },
        },
        {
          element: '[data-tour="nav-documents"]',
          popover: {
            title: "Documents",
            description: "Upload credit agreements and compliance certificates. Our AI automatically extracts covenants and key terms.",
            side: "right",
            align: "center",
          },
        },
        {
          element: '[data-tour="nav-analytics"]',
          popover: {
            title: "Analytics",
            description: "Interactive Tableau dashboards for deep portfolio analysis and trend visualization.",
            side: "right",
            align: "center",
          },
        },
        {
          popover: {
            title: "You're Ready! 🎉",
            description: "Start by uploading a document or exploring the demo data. You can replay this tour anytime from Settings.",
          },
        },
      ],
    });

    setDriverObj(driverInstance);
    driverInstance.drive();
  };

  const setFirstVisitComplete = useCallback(() => {
    setIsFirstVisit(false);
  }, []);

  return (
    <TourContext.Provider value={{ startTour, isFirstVisit, setFirstVisitComplete }}>
      {children}
      <style jsx global>{`
        .termly-tour-popover {
          background: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
        }
        .termly-tour-popover .driver-popover-title {
          font-size: 1.1rem !important;
          font-weight: 600 !important;
          color: hsl(var(--foreground)) !important;
        }
        .termly-tour-popover .driver-popover-description {
          color: hsl(var(--muted-foreground)) !important;
          font-size: 0.9rem !important;
          line-height: 1.5 !important;
        }
        .termly-tour-popover .driver-popover-progress-text {
          color: hsl(var(--muted-foreground)) !important;
        }
        .termly-tour-popover button {
          background: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
          border: none !important;
          border-radius: 6px !important;
          padding: 8px 16px !important;
          font-weight: 500 !important;
          transition: opacity 0.2s !important;
        }
        .termly-tour-popover button:hover {
          opacity: 0.9 !important;
        }
        .termly-tour-popover .driver-popover-prev-btn {
          background: hsl(var(--muted)) !important;
          color: hsl(var(--foreground)) !important;
        }
        .driver-overlay {
          background: rgba(0, 0, 0, 0.5) !important;
        }
      `}</style>
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}
