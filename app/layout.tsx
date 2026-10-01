import type { Metadata } from "next";
import localFont from "next/font/local";
import Header from "@/components/Header";
import "./globals.css";

const familjen = localFont({
  src: [
    {
      path: "../public/fonts/FamiljenGrotesk-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/FamiljenGrotesk-Medium.ttf",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-familjen",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nimi Desai",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${familjen.variable} m-0 bg-white text-[#555252] antialiased`}
      >
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}