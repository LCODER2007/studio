"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, Lightbulb } from 'lucide-react';
import React, { useEffect } from 'react';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import RoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/components/auth/AuthContext';
import { AuthButton } from '@/components/auth/AuthButton';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
    const { loading, user } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [loading, user, router]);

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg animate-pulse">Loading Dashboard...</div>
            </div>
        );
    }
  
  return (
    <RoleGuard roles={['ADMIN', 'SUPER_ADMIN']}>
      <SidebarProvider>
        <div className="flex min-h-screen">
            <Sidebar collapsible="icon">
            <SidebarHeader className="p-4">
                <Link href="/" className="flex items-center gap-2">
                    <Lightbulb className="w-6 h-6 text-primary" />
                    <span className="font-bold text-lg">SEES Hub</span>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/admin'} tooltip="Suggestions">
                        <Link href="/admin">
                            <FileText />
                            <span>Suggestions</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
            </Sidebar>
            <SidebarInset>
                <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
                    <SidebarTrigger className="md:hidden" />
                    <div className="flex-1">
                        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
                    </div>
                    <AuthButton />
                </header>
                <main className="flex-1 p-4 md:p-6">
                    {children}
                </main>
            </SidebarInset>
        </div>
      </SidebarProvider>
    </RoleGuard>
  );
}
