import { FORM_SUBMIT_ENDPOINT } from "@/lib/site-config";

export type SubmitResult = { ok: boolean; message: string };

/**
 * Sends an inquiry to FormSubmit's AJAX endpoint. Reports success ONLY when FormSubmit's JSON
 * response confirms it. The first-ever submission to a new address makes FormSubmit email an
 * activation link instead of delivering, and that is reported as a failure, never as success.
 */
export async function submitToFormSubmit(fields: Record<string, string>, subject: string): Promise<SubmitResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(FORM_SUBMIT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...fields, _subject: subject, _template: "table", _captcha: "false" }),
      signal: controller.signal,
    });
    let data: { success?: unknown; message?: unknown } = {};
    try {
      data = (await res.json()) as typeof data;
    } catch {
      /* non-JSON response: handled below */
    }
    const message = typeof data.message === "string" ? data.message : "";
    const confirmed = res.ok && (data.success === true || data.success === "true");
    if (confirmed && /activat/i.test(message)) {
      return {
        ok: false,
        message: "Our inquiry form is still being activated, so your message was not delivered yet. Please email or call us directly for now.",
      };
    }
    if (confirmed) return { ok: true, message: "Thank you! Your inquiry has been sent. We’ll be in touch soon." };
    return { ok: false, message: "We couldn’t send your inquiry. Please check your details and try again, or contact us directly." };
  } catch {
    return { ok: false, message: "We couldn’t reach the form service. Please check your connection and try again." };
  } finally {
    window.clearTimeout(timeout);
  }
}

/** Collects a <form>'s text fields, skipping the honeypot and empty values. */
export function formToFields(form: HTMLFormElement): Record<string, string> {
  const out: Record<string, string> = {};
  new FormData(form).forEach((value, key) => {
    if (typeof value !== "string" || key.startsWith("_") || key === "website") return;
    const trimmed = value.trim();
    if (trimmed) out[key] = trimmed;
  });
  return out;
}
