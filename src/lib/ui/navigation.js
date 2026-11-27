const NAVIGATION = {
  public: [],
  customer: [{ href: "/dashboard", label: "Dashboard" }],
  provider: [
    { href: "/provider/dashboard", label: "Dashboard" },
    { href: "/provider/apply", label: "Application" },
  ],
  admin: [
    { href: "/admin", label: "Overview" },
    { href: "/mfa/verify", label: "Security" },
  ],
};

export function getShellNavigation(area) {
  return NAVIGATION[area] ?? [];
}
