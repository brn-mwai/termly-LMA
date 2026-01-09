import type { Metadata } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Termly - AI-Powered Loan Covenant Monitoring",
  description:
    "Automate covenant monitoring with AI document extraction, real-time compliance tracking, and interactive dashboards.",
  keywords: [
    "loan covenant",
    "covenant monitoring",
    "credit analysis",
    "EBITDA",
    "financial compliance",
    "AI document extraction",
  ],
  icons: {
    icon: "/logo/favicon-termly.png",
    apple: "/logo/favicon-termly.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css"
        />
      </head>
      <body className={`${inter.variable} ${dmSerifDisplay.variable} antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
