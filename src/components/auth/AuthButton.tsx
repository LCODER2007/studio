"use client";

import { useState } from "react";
import {
  ChevronDown,
  LogIn,
  LogOut,
  Shield,
  User,
  UserCheck,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoginDialog } from "./LoginDialog";
import type { UserRole } from "@/lib/types";

export function AuthButton() {
  const { user, role, logout, setUserRole, loading } = useAuth();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

  if (loading) {
    return <Button variant="ghost" size="sm">Loading...</Button>;
  }

  if (!user) {
    return (
      <>
        <Button onClick={() => setIsLoginDialogOpen(true)}>
          <LogIn className="mr-2 h-4 w-4" />
          Sign In
        </Button>
        <LoginDialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen} />
      </>
    );
  }

  const handleRoleChange = (newRole: UserRole) => {
    setUserRole(newRole);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL ?? ""} alt={user.displayName ?? ""} />
            <AvatarFallback>
              {user.displayName?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium">{user.displayName}</span>
            <span className="text-xs text-muted-foreground">{role}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>{user.displayName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
            <DropdownMenuItem asChild>
                <Link href="/admin">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                </Link>
            </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Switch Role (Demo)</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleRoleChange("STUDENT")} disabled={role === 'STUDENT'}>
            <User className="mr-2 h-4 w-4" />
            <span>Student</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleRoleChange("ADMIN")} disabled={role === 'ADMIN'}>
            <UserCheck className="mr-2 h-4 w-4" />
            <span>Admin</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleRoleChange("SUPER_ADMIN")} disabled={role === 'SUPER_ADMIN'}>
            <UserCog className="mr-2 h-4 w-4" />
            <span>Super Admin</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
