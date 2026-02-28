"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRegisterMutation, useLoginMutation } from "@/lib/api/authApi";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/lib/slices/authSlice";
import { AuthLayout } from "./auth-layout";
import { AuthModeTabs } from "./auth-mode-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export function AuthForm() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const initialMode: Mode = modeParam === "signup" ? "signup" : "signin";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Something went wrong");

  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();

  const isLoading = isRegistering || isLoggingIn;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = mode === "signup"
        ? await register({ email, password, first_name: firstName.trim(), last_name: lastName.trim() }).unwrap()
        : await login({ email, password }).unwrap();
      dispatch(setCredentials({ token: res.token, user: res.user }));
      router.push("/");
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "data" in err
        ? (err as { data?: { error?: string } }).data?.error
        : "Something went wrong";
      setErrorMessage(message || "Something went wrong");
      setErrorDialogOpen(true);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-slate-900 dark:text-white text-2xl font-semibold tracking-tight">
            {mode === "signin" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base">
            {mode === "signin"
              ? "Manage your guests with elegance and precision."
              : "Get started with SeatMaster in seconds."}
          </p>
        </div>

        <AuthModeTabs mode={mode} onModeChange={setMode} />

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "signup" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="first_name" className="text-slate-700 dark:text-slate-200 font-bold">
                  First name
                </Label>
                <Input
                  id="first_name"
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="rounded-lg border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="last_name" className="text-slate-700 dark:text-slate-200 font-bold">
                  Last name
                </Label>
                <Input
                  id="last_name"
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="rounded-lg border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-slate-700 dark:text-slate-200 font-bold">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 py-3.5 focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-slate-700 dark:text-slate-200 font-bold">
                Password
              </Label>
              {mode === "signin" && (
                <Link
                  href="#"
                  className="text-xs font-semibold text-[var(--brand-amber)] hover:underline"
                >
                  Forgot Password?
                </Link>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 pr-11 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 py-3.5 focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[var(--brand-amber)] transition-colors"
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 py-3.5 text-base font-semibold shadow-md active:scale-[0.99] transition-all"
            disabled={isLoading}
          >
            {isLoading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        {mode === "signup" && (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="font-semibold text-[var(--brand-amber)] hover:underline">
              Terms of Service
            </Link>
            .
          </p>
        )}
      </div>

      <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Something went wrong</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorDialogOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthLayout>
  );
}