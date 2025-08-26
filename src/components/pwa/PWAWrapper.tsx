"use client";

import { useEffect } from "react";

export function PWAWrapper() {
  useEffect(() => {
    // Let Chrome handle PWA install prompts automatically
    // No custom prompt interference - Chrome will show the install banner
    // when it meets the criteria (service worker, manifest, engagement heuristics)
    console.log('PWA ready - Chrome will show install prompt automatically when criteria are met');
  }, []);

  // Return null - let Chrome handle the install prompt natively
  return null;
}