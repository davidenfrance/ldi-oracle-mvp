import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "LDI Oracle MVP",
  description:
    "Recorded Controller identity and whether identity cover is in force or available to purchase.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#ffffff" }}>{children}</body>
    </html>
  );
}
