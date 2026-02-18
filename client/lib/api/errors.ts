/**
 * Extract a user-facing error message from API/RTK Query errors.
 */
export function getErrorMessage(error: unknown): string {
  if (error == null) return "Something went wrong";
  if (typeof error === "string") return error;
  if (typeof error === "object" && "data" in error) {
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === "object" && "message" in data && typeof (data as { message: string }).message === "string") {
      return (data as { message: string }).message;
    }
    if (data && typeof data === "object" && "error" in data && typeof (data as { error: string }).error === "string") {
      return (data as { error: string }).error;
    }
  }
  if (typeof error === "object" && "message" in error && typeof (error as { message: string }).message === "string") {
    return (error as { message: string }).message;
  }
  return "Something went wrong";
}
