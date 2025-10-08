import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css"; // Note the updated path

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lemma - Achor",
  description: "Free time-travel debugger for JS, Python, Go, Rust, C++ — no install.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className={`${inter.className} bg-tuna`}>
        {children}
      </body>
    </html>
  );
}