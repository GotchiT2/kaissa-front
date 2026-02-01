import { env } from "$env/dynamic/private";

const BREVO_BASE = "https://api.brevo.com/v3";

async function brevoFetch(path: string, init: RequestInit) {
  const res = await fetch(`${BREVO_BASE}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": env.BREVO_API_KEY,
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {}

  if (!res.ok) {
    console.error("Brevo error", res.status, data);
    throw new Error(`Brevo API error (${res.status})`);
  }

  return data;
}

export async function upsertContactToList(opts: {
  email: string;
  firstname?: string;
  lastname?: string;
  listId: number;
}) {
  const { email, firstname, lastname, listId } = opts;

  // Create/update contact + ajoute à listId (idempotent)
  return brevoFetch("/contacts", {
    method: "POST",
    body: JSON.stringify({
      email,
      attributes: {
        FIRSTNAME: firstname ?? "",
        LASTNAME: lastname ?? "",
      },
      listIds: [listId],
      updateEnabled: true,
    }),
  });
}

export async function sendActivationEmail(opts: {
  toEmail: string;
  toName?: string;
  templateId: number;
  params: Record<string, any>;
}) {
  const { toEmail, toName, templateId, params } = opts;

  return brevoFetch("/smtp/email", {
    method: "POST",
    body: JSON.stringify({
      sender: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME },
      to: [{ email: toEmail, name: toName ?? "" }],
      templateId,
      params,
    }),
  });
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getVerificationCodeExpiration(): Date {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 15);
  return now;
}
