import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar, MobileNavigation } from "@/components/layout/app-sidebar";
import { GlobalAudio } from "@/components/player/global-audio";
import { Player } from "@/components/player/player";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <AppSidebar />
      <div className="content-shell">
        <AppHeader />
        <main id="main-content" className="main-scroll" tabIndex={-1}>
          {children}
        </main>
      </div>
      <div className="global-player">
        <Player />
      </div>
      <MobileNavigation />
      <GlobalAudio />
    </div>
  );
}
