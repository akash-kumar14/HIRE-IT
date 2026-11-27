import { describe, expect, it } from "vitest";
import { ProviderOnboardingCard } from "@/components/dashboard/provider-onboarding-card.jsx";

function findLinks(node, links = []) {
  if (!node || typeof node !== "object") return links;

  if (Array.isArray(node)) {
    node.forEach((child) => findLinks(child, links));
    return links;
  }

  if (node.props?.href) {
    links.push(node);
  }

  if (node.props?.children) {
    findLinks(node.props.children, links);
  }

  return links;
}

describe("ProviderOnboardingCard", () => {
  it("links to the provider application form", () => {
    const links = findLinks(ProviderOnboardingCard());

    expect(links.map((link) => link.props.href)).toContain("/provider/apply");
  });
});
