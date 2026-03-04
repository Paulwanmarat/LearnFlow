"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./Navbar";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
    }
  }, [router]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-brand-dark overflow-hidden flex flex-col relative">
        {/* Global ambient background glow for protected routes */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-brand-accent1/5 to-transparent pointer-events-none z-0"></div>
        <div className="flex-1 w-full z-10">
          {children}
        </div>
      </div>
    </>
  );
}