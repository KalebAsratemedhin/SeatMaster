"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useDeleteAccountMutation } from "@/lib/api/authApi";
import { logout } from "@/lib/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api/errors";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DeleteAccountSection() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [deleteAccount, { isLoading }] = useDeleteAccountMutation();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmation.trim().toUpperCase() !== "DELETE") {
      toast.error("Type DELETE to confirm");
      return;
    }
    try {
      await deleteAccount({
        password,
        confirmation: "DELETE",
      }).unwrap();
      dispatch(logout());
      toast.success("Account deleted");
      router.replace("/");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Card id="delete" className="border-destructive/30">
      <CardHeader>
        <h2 className="text-lg font-semibold text-destructive">Delete account</h2>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account and associated data. This cannot be undone.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="delete_password">Password</Label>
            <Input
              id="delete_password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delete_confirm">
              Type <span className="font-semibold text-foreground">DELETE</span> to confirm
            </Label>
            <Input
              id="delete_confirm"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETE"
              required
              className="rounded-lg"
            />
          </div>
          <Button type="submit" variant="destructive" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Deleting…
              </>
            ) : (
              "Delete my account"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
