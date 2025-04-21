"use client";

import { Lexend } from "next/font/google";
import { usePathname, useRouter } from "next/navigation";
import "./globals.css";
import Sidebar from "./Components/sidebar";
import { useEffect } from "react";

const lexend = Lexend({
  subsets: ["latin"],
  weight: "400",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    const adminId = localStorage.getItem('adminId');
    const role = localStorage.getItem('role');
    if (!adminId && pathname !== '/login') {
      router.replace('/login');
    }
  }, [pathname, router]);

  return (
    <html lang="en">
      <body className={`${lexend.className} antialiased`}>
        {isLoginPage ? (
          <main className="min-h-screen bg-indigo-100">{children}</main>
        ) : (
          <div className="flex">
            <Sidebar />
            <main className={`${lexend.className} antialiased flex-1 md:ml-60 lg:ml-60 bg-indigo-100 min-h-screen`}>
              {children}
            </main>
          </div>
        )}
      </body>
    </html>
  );
}