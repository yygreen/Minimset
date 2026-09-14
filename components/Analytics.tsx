"use client";

import { useEffect } from "react";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { captureAttribution } from "@/lib/attribution";

/**
 * Measurement, in one component, mounted once in the root layout.
 *
 * Two jobs that belong together because they answer the same question from
 * opposite ends:
 *
 *  - Vercel Web Analytics records the traffic: who arrived, on what page, from
 *    which campaign. Cookieless and without an identifier, so no consent banner
 *    is owed and none is shown.
 *  - captureAttribution() remembers the campaign so it can be pinned to the
 *    Shopify order later. Traffic on its own tells you a flyer was read; the
 *    attribution tells you whether it was paid for.
 *
 * The Vercel half is inert until Web Analytics is switched on for the project
 * in the Vercel dashboard -- the script 404s and the component swallows it. The
 * attribution half works regardless, because it is our own code and our own
 * storage. That asymmetry is deliberate: the half that feeds the money question
 * must not depend on a dashboard toggle.
 */
export function Analytics() {
  useEffect(() => {
    captureAttribution();
  }, []);

  return <VercelAnalytics />;
}
