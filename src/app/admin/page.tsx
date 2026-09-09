"use client";

import { useEffect, useState } from "react";
import { subscribeAdminSession } from "@/lib/adminAuth";
import AdminLogin from "@/components/AdminLogin";
import AdminDashboard from "@/components/AdminDashboard";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => subscribeAdminSession(setIsAdmin), []);

  if (isAdmin === null) {
    return <div className="min-h-screen bg-neutral-950" />;
  }

  return isAdmin ? <AdminDashboard /> : <AdminLogin />;
}
