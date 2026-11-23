const NAVIGATION = {
  public: [],
  customer: [{ href: "/dashboard", label: "Dashboard" }],
  provider: [{ href: "/provider/dashboard", label: "Dashboard" }],
  admin: [{ href: "/admin", label: "Overview" }],
};

export function getShellNavigation(area) {
  return NAVIGATION[area] ?? [];
}
