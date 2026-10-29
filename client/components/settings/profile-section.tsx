"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  type UserResponse,
} from "@/lib/api/authApi";
import { uploadAvatar, avatarFileError } from "@/lib/api/uploadApi";
import { setCredentials } from "@/lib/slices/authSlice";
import type { RootState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitialsFromEmail } from "@/lib/user-display";
import { getErrorMessage } from "@/lib/api/errors";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

function ProfileForm({
  profile,
  token,
}: {
  profile: UserResponse;
  token: string;
}) {
  const dispatch = useDispatch();
  const [updateProfile, { isLoading: isUpdating, error: updateError }] =
    useUpdateProfileMutation();

  const [firstName, setFirstName] = useState(profile.first_name ?? "");
  const [lastName, setLastName] = useState(profile.last_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || avatarFileError(file)) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalAvatarUrl = avatarUrl;
    if (avatarFile) {
      try {
        finalAvatarUrl = await uploadAvatar(avatarFile);
      } catch {
        toast.error("Could not upload avatar");
        return;
      }
    }
    try {
      const user = await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        avatar_url: finalAvatarUrl,
      }).unwrap();
      dispatch(setCredentials({ token, user }));
      setAvatarUrl(user.avatar_url ?? finalAvatarUrl);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success("Profile saved");
    } catch {
      /* inline error */
    }
  };

  const displayAvatar = avatarPreview ?? avatarUrl;
  const initials =
    firstName.trim() && lastName.trim()
      ? `${firstName.trim()[0]}${lastName.trim()[0]}`.toUpperCase()
      : getInitialsFromEmail(profile.email);

  return (
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
            <AvatarFallback className="bg-primary/10 text-2xl text-primary">
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
        Email:{" "}
        <span className="font-medium text-foreground">{profile.email}</span>{" "}
        (cannot be changed here)
      </p>
      {updateError && (
        <p className="text-sm text-destructive">{getErrorMessage(updateError)}</p>
      )}
      <Button type="submit" disabled={isUpdating}>
        {isUpdating ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Saving…
          </>
        ) : (
          "Save profile"
        )}
      </Button>
    </form>
  );
}

export function ProfileSection() {
  const token = useSelector((s: RootState) => s.auth.token);
  const { data: profile, isLoading } = useGetProfileQuery(undefined, {
    skip: !token,
  });

  return (
    <Card id="profile">
      <CardHeader>
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Name, phone, and profile picture.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading || !profile || !token ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <ProfileForm
            key={`${profile.id}:${profile.avatar_url}:${profile.first_name}:${profile.last_name}:${profile.phone}`}
            profile={profile}
            token={token}
          />
        )}
      </CardContent>
    </Card>
  );
}
