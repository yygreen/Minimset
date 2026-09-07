# Reconstructed architecture

Taken from the production build manifest of `dpl_Hrcgcxp4eo7Sf3RCD6nZU34gzwHP`
(Next.js 16.3.1, Turbopack). This is the authoritative shape of the app —
28 prerendered pages, 13 server functions, plus middleware.

## Inferred source tree

```
app/
├── layout.tsx                     # Frank Ruhl Libre + Inter, theme #FBF8F1
├── page.tsx                       # ○ /
├── not-found.tsx                  # ○ /_not-found
├── about/page.tsx                 # ○ /about
├── brief/page.tsx                 # ○ /brief          (not in sitemap)
├── faq/page.tsx                   # ○ /faq
├── he/page.tsx                    # ○ /he             (Hebrew, RTL)
├── icon.svg/route.ts              # ○ /icon.svg
├── robots.txt/route.ts            # ○ /robots.txt
├── sitemap.xml/route.ts           # ○ /sitemap.xml
│
├── [site]/                        # ● SSG via generateStaticParams
│   ├── page.tsx                   #   baltimore · lakewood · monsey · five-towns
│   └── order/page.tsx             #   <site>/order  ×4
│
├── sets/[slug]/page.tsx           # ● mehudar-aa · mehudar-a · chinuch
│
├── order/
│   ├── page.tsx                   # ○ /order
│   └── [code]/page.tsx            # ƒ /order/[code]   (order lookup)
│
├── staff/                         # ○ all static, gated at runtime
│   ├── page.tsx                   #   /staff (login)
│   ├── distribution/page.tsx
│   ├── orders/page.tsx
│   ├── paper/page.tsx
│   ├── print/page.tsx
│   └── totals/page.tsx
│
└── api/                           # ƒ 13 server functions
    ├── status/route.ts
    ├── checkout/start/route.ts
    ├── orders/route.ts
    ├── orders/[code]/route.ts
    ├── orders/[code]/pay/route.ts
    ├── webhooks/stripe/route.ts   # Stripe webhook receiver
    └── staff/
        ├── login/route.ts
        ├── demo/route.ts
        ├── orders/route.ts
        ├── orders/[code]/route.ts
        ├── reserve/route.ts
        └── totals/route.ts

middleware.ts                      # ƒ Proxy (Middleware)
public/img/                        # 11 photos — see snapshot/public/img/
```

## Product tiers

Three sets, from the sitemap and set pages: `mehudar-aa`, `mehudar-a`,
`chinuch`. Entry price $40.

## Distribution sites

Four: `baltimore`, `lakewood`, `monsey`, `five-towns`. Each has a landing page
and its own `/order` page. Pickup is at the local Beis Medrash after Yom Kippur.

## Integrations implied

- **Stripe** — `/api/webhooks/stripe`, `/api/checkout/start`, `/api/orders/[code]/pay`
  (currently running with `payments: "demo"`)
- **Some order store** — `/api/orders`, `/api/staff/*` (`store: true`)
- **Staff auth** — `/api/staff/login`, `staffLocked: true`, roles + per-site scoping

## What cannot be recovered from the web

Component source, `next.config.ts`, `package.json`, Tailwind config,
middleware logic, all 13 route handlers, and every environment variable
(Stripe keys, staff credentials, store connection).
