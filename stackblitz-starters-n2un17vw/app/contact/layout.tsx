import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Voskopulence about products, ingredients, formulation or wholesale enquiries.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
