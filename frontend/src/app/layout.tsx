import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepoChat - AI Code Assistant",
  description: "Privacy-first AI assistant for understanding codebases",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
