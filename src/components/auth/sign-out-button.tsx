"use client";

import * as React from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [busy, setBusy] = React.useState(false);
  return (
    <Button variant="outline" size="sm" disabled={busy} onClick={async () => {
      setBusy(true);
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
      // A full page load (not router.push) drops the client-side cache of this learner's pages.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    }}>
      <LogOut aria-hidden="true" /> Sign out
    </Button>
  );
}
