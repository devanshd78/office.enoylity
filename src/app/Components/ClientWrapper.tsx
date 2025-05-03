// src/app/Components/ClientWrapper.tsx
'use client';

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./sidebar";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (!role && pathname !== "/login") {
      router.replace("/login");
    }
  }, [pathname, router]);

  if (isLoginPage) {
    return <main className="min-h-screen bg-indigo-100">{children}</main>;
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 md:ml-60 lg:ml-60 bg-indigo-100 min-h-screen">
        {children}
      </main>
    </div>
  );
}
