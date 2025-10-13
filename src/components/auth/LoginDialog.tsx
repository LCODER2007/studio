"use client";

import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UserRole } from "@/lib/types";
import { LogIn } from "lucide-react";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { login } = useAuth();

  const handleLogin = (role: UserRole) => {
    login(role);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            SEES UNILAG Innovation Hub
          </DialogTitle>
          <DialogDescription className="text-center">
            Sign in to submit and vote on suggestions.
            <br />
            (This is a demo. Select a role to continue.)
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button onClick={() => handleLogin("STUDENT")}>
            <LogIn className="mr-2 h-4 w-4" /> Sign In as Student
          </Button>
          <Button variant="secondary" onClick={() => handleLogin("ADMIN")}>
            <LogIn className="mr-2 h-4 w-4" /> Sign In as Admin
          </Button>
          <Button variant="secondary" onClick={() => handleLogin("SUPER_ADMIN")}>
            <LogIn className="mr-2 h-4 w-4" /> Sign In as Super Admin
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
