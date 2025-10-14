"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { initiateEmailSignIn } from "@/firebase/non-blocking-login";
import { useAuth as useFirebaseAuth } from "@/firebase";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const auth = useFirebaseAuth();

  const handleLogin = (role: 'ADMIN' | 'SUPER_ADMIN') => {
    let email, password;
    switch(role) {
      case 'ADMIN':
        email = 'admin@unilag.edu';
        password = 'password';
        break;
      case 'SUPER_ADMIN':
        email = 'super-admin@unilag.edu';
        password = 'password';
        break;
    }
    initiateEmailSignIn(auth, email, password);
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
          <Button variant="secondary" onClick={() => handleLogin("ADMIN")}>
            <LogIn className="mr-2 h-4 w-4" /> Sign In as Admin
          </Button>
          <Button variant="destructive" onClick={() => handleLogin("SUPER_ADMIN")}>
            <LogIn className="mr-2 h-4 w-4" /> Sign In as Super Admin
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
