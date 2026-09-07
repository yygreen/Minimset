import Link from "next/link";
import type { LevelKey } from "@/lib/data";
import { isExternal, orderHref } from "@/lib/shopify";

/**
 * Every "start an order" button on the site.
 *
 * Where it points depends on whether the Shopify store is configured: a cart
 * permalink when it is, the on-site order flow when it is not. Routing all of
 * them through one component means the switch happens in lib/shopify.ts and
 * nowhere else, and that a page never has to know which of the two it is
 * rendering.
 *
 * next/link is for internal navigation, so an off-site href gets a plain
 * anchor. Same tab on purpose: a checkout that opens in a new tab loses the
 * customer's place and their back button.
 */
export function OrderLink({
  level,
  className,
  children,
  ...rest
}: {
  level?: LevelKey;
  className?: string;
  children: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const href = orderHref(level);
  if (isExternal(href)) {
    return (
      <a href={href} rel="noopener" className={className} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} {...rest}>
      {children}
    </Link>
  );
}
