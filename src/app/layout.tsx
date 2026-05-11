import type { Metadata } from "next";
import { Geist, Geist_Mono, Stylish } from "next/font/google";
import { Toaster } from "sonner";
import "@/styles/globals.css";
import { AppProvider } from "@/shared/context/AppContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const stylish = Stylish({
  weight: "400",
  variable: "--font-avatar",
});

export const metadata: Metadata = {
  title: "HighPass",
  description: "자격증 합격을 위한 스터디 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} ${stylish.variable} min-h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AppProvider>
          {children}
          <Toaster richColors position="bottom-right" />
        </AppProvider>
      </body>
    </html>
  );
}
