export function getAppBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL must be configured in production.");
  }

  return "http://localhost:3000";
}
