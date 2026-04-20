"use client";

import { useLayoutEffect } from "react";
import { useRouteTransition } from "@/components/route-transition-provider";

export default function RouteTransitionDone() {
  const { stopNavigation } = useRouteTransition();

  useLayoutEffect(() => {
    stopNavigation();
  }, [stopNavigation]);

  return null;
}
