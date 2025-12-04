"use client";

import { useAuth } from "@/components/auth/AuthContext";
import type { UserRole } from "@/lib/types";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "./ui/button";

interface RoleGuardProps {
  roles: UserRole[];
  children: React.ReactNode;
}

export default function RoleGuard({ roles, children }: RoleGuardProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect unauthenticated users to login
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    // You can render a loading skeleton here
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-lg">Loading...</div>
        </div>
    );
  }

  // If user is not authenticated, show nothing (redirect will happen)
  if (!user) {
    return null;
  }

  // If user doesn't have the required role, show access denied
  if (!role || !roles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          You do not have the required permissions to view this page.
        </p>
        <Button asChild>
            <Link href="/">Return to Home</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
