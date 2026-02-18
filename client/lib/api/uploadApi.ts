import { api } from "./axios";

const ACCEPT = "image/jpeg,image/png,image/gif,image/webp";
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export function isAcceptedBannerFile(file: File): boolean {
  const ok =
    file.type === "image/jpeg" ||
    file.type === "image/png" ||
    file.type === "image/gif" ||
    file.type === "image/webp";
  return ok && file.size <= MAX_SIZE_BYTES;
}

export function bannerFileError(file: File): string | null {
  if (
    file.type !== "image/jpeg" &&
    file.type !== "image/png" &&
    file.type !== "image/gif" &&
    file.type !== "image/webp"
  ) {
    return "Please use JPEG, PNG, GIF, or WebP.";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `File must be under ${MAX_SIZE_MB}MB.`;
  }
  return null;
}

/**
 * Uploads a banner image file. Returns the URL to store as banner_url.
 */
export async function uploadBanner(file: File): Promise<string> {
  const err = bannerFileError(file);
  if (err) throw new Error(err);

  const form = new FormData();
  form.append("banner", file);

  const { data } = await api.post<{ url: string }>("/api/v1/upload/banner", form, {
    headers: { "Content-Type": undefined },
  });
  return data.url;
}

const MAX_AVATAR_MB = 5;
const MAX_AVATAR_BYTES = MAX_AVATAR_MB * 1024 * 1024;

export function avatarFileError(file: File): string | null {
  if (
    file.type !== "image/jpeg" &&
    file.type !== "image/png" &&
    file.type !== "image/gif" &&
    file.type !== "image/webp"
  ) {
    return "Please use JPEG, PNG, GIF, or WebP.";
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return `File must be under ${MAX_AVATAR_MB}MB.`;
  }
  return null;
}

/**
 * Uploads an avatar image. Returns the URL to store in profile.
 */
export async function uploadAvatar(file: File): Promise<string> {
  const err = avatarFileError(file);
  if (err) throw new Error(err);

  const form = new FormData();
  form.append("avatar", file);

  const { data } = await api.post<{ url: string }>("/api/v1/upload/avatar", form, {
    headers: { "Content-Type": undefined },
  });
  return data.url;
}
