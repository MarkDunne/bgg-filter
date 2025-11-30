"use client";

import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, useState } from "react";
import posthog from "posthog-js";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [posthogClient, setPosthogClient] = useState<typeof posthog | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

      if (posthogKey && !posthogClient) {
        posthog.init(posthogKey, {
          api_host: posthogHost,
          loaded: (posthog) => {
            if (process.env.NODE_ENV === "development") {
              posthog.debug();
            }
            setPosthogClient(posthog);
          },
          capture_pageview: true,
          capture_pageleave: true,
        });
      }
    }
  }, [posthogClient]);

  if (!posthogClient) {
    return <>{children}</>;
  }

  return <PHProvider client={posthogClient}>{children}</PHProvider>;
}

