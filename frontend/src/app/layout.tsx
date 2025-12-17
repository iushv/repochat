import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepoChat - Private Code Onboarding",
  description: "Onboard to any codebase in hours, not months. 100% private, enterprise-ready AI code assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
