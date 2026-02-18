"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
} from "@/lib/api/authApi";
import { uploadAvatar, avatarFileError } from "@/lib/api/uploadApi";
import { setCredentials } from "@/lib/slices/authSlice";
import type { RootState } from "@/lib/store";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitialsFromEmail } from "@/lib/user-display";
import { getErrorMessage } from "@/lib/api/errors";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const storedUser = useSelector((state: RootState) => state.auth.user);

  const { data: profile, isLoading } = useGetProfileQuery(undefined, {
    skip: !token,
  });
  const [updateProfile, { isLoading: isUpdating, error: updateError }] =
    useUpdateProfileMutation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace("/auth?mode=signin");
      return;
    }
  }, [token, router]);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? "");
      setLastName(profile.last_name ?? "");
      setPhone(profile.phone ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
    }
  }, [profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = avatarFileError(file);
    if (err) {
      return;
    }
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalAvatarUrl = avatarUrl;
    if (avatarFile) {
      try {
        finalAvatarUrl = await uploadAvatar(avatarFile);
      } catch (err) {
        return;
      }
    }
    updateProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      avatar_url: finalAvatarUrl,
    })
      .unwrap()
      .then((user) => {
        if (token) {
          dispatch(setCredentials({ token, user }));
        }
        setAvatarFile(null);
        setAvatarPreview(null);
      })
      .catch(() => {});
  };

  if (!token) return null;

  const displayAvatar = avatarPreview ?? avatarUrl;
  const initials =
    firstName.trim() && lastName.trim()
      ? `${firstName.trim()[0]}${lastName.trim()[0]}`.toUpperCase()
      : getInitialsFromEmail(profile?.email ?? storedUser?.email);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf9] dark:bg-[#022c22] text-slate-900 dark:text-slate-100">
      <SiteHeader />
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-8">
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
            <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
            <p className="text-muted-foreground text-sm">
              Update your name, phone, and profile picture.
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-2 border-border">
                      {displayAvatar ? (
                        <AvatarImage
                          src={displayAvatar}
                          alt="Profile"
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90">
                      <Camera className="size-4" />
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="sr-only"
                        onChange={handleAvatarChange}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG, GIF or WebP. Max 5MB.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First name</Label>
                    <Input
                      id="first_name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last name</Label>
                    <Input
                      id="last_name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="rounded-lg"
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  Email: <span className="font-medium text-foreground">{storedUser?.email ?? profile?.email}</span>
                  {" "}(cannot be changed here)
                </p>

                {updateError && (
                  <p className="text-sm text-destructive">
                    {getErrorMessage(updateError)}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full sm:w-auto bg-[#044b36] hover:bg-[#065f46]"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
