import type { ReactNode } from "react";
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
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
}

export default Providers;
