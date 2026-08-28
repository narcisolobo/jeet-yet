import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthProvider from "./auth-provider";
import ThemeProvider from "./theme-provider";

function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>{children}</TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default Providers;
