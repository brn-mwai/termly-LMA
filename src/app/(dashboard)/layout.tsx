import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ChatProvider } from "@/components/chat/chat-context";
import { OnboardingCheck } from "@/components/onboarding/onboarding-check";
import { TourProvider } from "@/components/tour/tour-provider";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingCheck>
      <TourProvider>
        <SidebarProvider>
          <ChatProvider>
            <AppSidebar />
            <SidebarInset className="flex flex-col h-screen overflow-hidden">
              <DashboardHeader />
              <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto bg-muted/30">
                  <div className="mx-auto w-full max-w-7xl p-6">
                    {children}
                  </div>
                </main>
                <ChatPanel />
              </div>
            </SidebarInset>
          </ChatProvider>
        </SidebarProvider>
      </TourProvider>
    </OnboardingCheck>
  );
}
