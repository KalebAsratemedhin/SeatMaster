import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f8faf9] dark:bg-[#022c22]">Loading…</div>}>
      <AuthForm />
    </Suspense>
  );
}