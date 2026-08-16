// Cloudflare Pages Function — handles POST /api/contact
// Receives the website contact form and relays it as an email via Resend.
//
// Environment variables (Cloudflare Pages → Settings → Environment variables):
//   RESEND_API_KEY  (required, mark as "Secret")  Your Resend API key.
//   CONTACT_TO      (optional)  Inbox that receives enquiries.
//                               Default: tcmclinicthepresent@gmail.com
//   CONTACT_FROM    (optional)  Verified Resend sender address.
//                               Default: onboarding@resend.dev (test sender —
//                               only delivers to the Resend account owner's
//                               email until you verify your own domain).

export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  try {
    data = await request.json();
  } catch (e) {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  const name = (data.name || "").toString().trim();
  const email = (data.email || "").toString().trim();
  const message = (data.message || "").toString().trim();
  const honeypot = (data.company || "").toString().trim(); // hidden spam trap

  // A filled honeypot means a bot. Accept silently so it stops retrying.
  if (honeypot) return json({ ok: true });

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!name || name.length > 100) return json({ ok: false, error: "name" }, 422);
  if (!emailOk) return json({ ok: false, error: "email" }, 422);
  if (!message || message.length > 2000) return json({ ok: false, error: "message" }, 422);

  if (!env.RESEND_API_KEY) {
    return json({ ok: false, error: "not_configured" }, 500);
  }

  const to = env.CONTACT_TO || "zacckim@gmail.com";
  const from = env.CONTACT_FROM || "TCM Clinic The Present <noreply@tcmclinicthepresent.com.au>";

  const text =
    "New enquiry from the TCM Clinic The Present website\n\n" +
    "Name:    " + name + "\n" +
    "Email:   " + email + "\n\n" +
    "Message:\n" + message + "\n";

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env.RESEND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: from,
      to: [to],
      reply_to: email,
      subject: "Website enquiry — " + name,
      text: text,
    }),
  });

  if (!resp.ok) {
    // Fail loud in the Cloudflare logs; stay generic to the visitor.
    const detail = await resp.text();
    console.error("Resend error", resp.status, detail);
    return json({ ok: false, error: "send_failed" }, 502);
  }

  return json({ ok: true });
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json" },
  });
}
