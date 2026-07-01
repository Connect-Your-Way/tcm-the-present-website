/**
 * src/lib/resend.ts — Resend client wrapper (§05 §6, ADR-002)
 *
 * The ONLY file in the project that imports the `resend` npm package.
 * Uses resend@4.8.0 (latest stable 4.x at M05 dispatch time — v6.16.0 was available;
 * chose 4.x per the S4-PLAN "pin to latest stable 4.x" decision).
 *
 * Public interface: sendContactEmail(input): Promise<ResendResult>
 * Never throws — returns a typed Result to the caller (§05 §6.2).
 * Timeout: 10 s via Promise.race + AbortController (SDK v4 has no native signal option).
 */

import { Resend } from "resend";
import { env } from "./env.ts";

export type ResendInput = {
  name: string;
  email: string;    // visitor email — used as reply_to; NOT logged (privacy)
  message: string;
};

export type ResendResult =
  | { ok: true; id: string }
  | { ok: false; code: "EMAIL_SERVICE_ERROR"; httpStatus?: number; detail?: string };

/** Timeout in milliseconds per §05 §6.2 */
const TIMEOUT_MS = 10_000;

/**
 * Race a promise against a fixed timeout.
 * Returns the promise result or rejects with a timeout Error.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timerId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_res, rej) => {
    timerId = setTimeout(() => rej(new Error(`Resend call timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timerId));
}

/**
 * Send a contact-form email via Resend.
 * from   = env.RESEND_FROM_ADDRESS (sandbox sender by default)
 * to     = [env.CONTACT_EMAIL] (practitioner inbox; never in any response to caller)
 * reply_to = input.email (visitor can receive a reply)
 */
export async function sendContactEmail(input: ResendInput): Promise<ResendResult> {
  const client = new Resend(env.RESEND_API_KEY);

  const plainText = [
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    "",
    "Message:",
    input.message,
  ].join("\n");

  try {
    const { data, error } = await withTimeout(
      client.emails.send({
        from: env.RESEND_FROM_ADDRESS,
        to: [env.CONTACT_EMAIL],
        reply_to: input.email,
        subject: `Website contact — ${input.name}`,
        text: plainText,
      }),
      TIMEOUT_MS
    );

    if (error) {
      // SDK returned an error object (4xx / 5xx from Resend API)
      console.error(JSON.stringify({
        event: "resend_failure",
        errorName: error.name,
        detailLength: error.message?.length ?? 0,
      }));
      return { ok: false, code: "EMAIL_SERVICE_ERROR", detail: error.name };
    }

    return { ok: true, id: data!.id };
  } catch (err: unknown) {
    // Network failure, timeout, or unexpected throw — never rethrow (§05 §6.2)
    const isTimeout = err instanceof Error && err.message.includes("timed out");
    console.error(JSON.stringify({
      event: "resend_failure",
      errorType: isTimeout ? "timeout" : "network",
      detailLength: err instanceof Error ? err.message.length : 0,
    }));
    return { ok: false, code: "EMAIL_SERVICE_ERROR" };
  }
}
