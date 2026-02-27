"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    if (!token) {
      router.replace("/auth?mode=signin");
    }
  }, [token, router]);

  if (!token) return null;

  return (
    <div className="container max-w-2xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Events
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm">
            Manage your account and preferences.
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Settings options will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
