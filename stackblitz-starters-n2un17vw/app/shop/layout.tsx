import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Collection",
  description:
    "Explore the first Voskopulence solid shampoo and conditioner bars inspired by Mediterranean botanicals.",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
