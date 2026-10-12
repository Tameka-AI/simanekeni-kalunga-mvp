import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simanekeni Kalunga — Interactive Hymn Demo",
  description: "Private MVP of the Oshiwambo Catholic hymn book with synchronized lyrics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
