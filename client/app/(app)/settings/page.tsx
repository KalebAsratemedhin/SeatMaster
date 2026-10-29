"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ProfileSection } from "@/components/settings/profile-section";
import { PasswordSection } from "@/components/settings/password-section";
import { DeleteAccountSection } from "@/components/settings/delete-account-section";
import { ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const token = useSelector((s: RootState) => s.auth.token);

  useEffect(() => {
    if (!token) router.replace("/auth?mode=signin");
  }, [token, router]);

  if (!token) return null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Profile, password, and account.
        </p>
      </div>

      <ProfileSection />
      <PasswordSection />
      <DeleteAccountSection />
    </div>
  );
}
