export const authProviders = [
  {
    id: "google",
    name: "Google",
    enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  },
  {
    id: "discord",
    name: "Discord",
    enabled: Boolean(
      process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
    )
  },
  {
    id: "github",
    name: "GitHub",
    enabled: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)
  }
];

export function isAuthConfigured() {
  return authProviders.some((provider) => provider.enabled);
}
