"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { submitToFormSubmit } from "./submit";

export type FormStatus = { state: "idle" | "pending" | "success" | "error"; message: string };

const MIN_FILL_MS = 2500;

/** Pending/success/error state plus basic bot protection (honeypot + minimum fill time). */
export function useFormSubmit(subject: string) {
  const [status, setStatus] = useState<FormStatus>({ state: "idle", message: "" });
  const mountedAt = useRef<number | null>(null);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  const submit = useCallback(
    async (fields: Record<string, string>, honeypot: string): Promise<boolean> => {
      const tooFast = mountedAt.current !== null && Date.now() - mountedAt.current < MIN_FILL_MS;
      if (honeypot || tooFast) {
        setStatus({ state: "error", message: "Please take a moment to review your details, then submit again." });
        return false;
      }
      setStatus({ state: "pending", message: "Sending your inquiry…" });
      const result = await submitToFormSubmit(fields, subject);
      setStatus({ state: result.ok ? "success" : "error", message: result.message });
      return result.ok;
    },
    [subject],
  );

  return { status, submit };
}
