import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { ChatAssistant } from "@/components/chat/chat-assistant";
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1 overflow-auto bg-muted/30">
          <div className="mx-auto w-full max-w-7xl p-6">
            {children}
          </div>
        </main>
      </SidebarInset>
      <ChatAssistant />
    </SidebarProvider>
  );
}
