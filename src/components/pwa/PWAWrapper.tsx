"use client";

import { useEffect, useState } from "react";
import { InstallPrompt } from "./InstallPrompt";

export function PWAWrapper() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <InstallPrompt />;
}