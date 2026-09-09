// Interfaccia provider email — cosi' Resend puo' essere sostituito senza
// toccare la logica del job. Push web e' una estensione futura: la stessa
// interfaccia (send) puo' essere implementata da un provider push senza
// cambiare il chiamante.

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<{ ok: boolean; error?: string }>;
}

/** Provider di default quando RESEND_API_KEY non e' configurata: logga soltanto. */
export class NoopEmailProvider implements EmailProvider {
  async send(message: EmailMessage) {
    console.log(`[email:noop] a=${message.to} oggetto="${message.subject}"`);
    return { ok: true };
  }
}

export class ResendEmailProvider implements EmailProvider {
  constructor(
    private readonly apiKey: string,
    private readonly from: string
  ) {}

  async send(message: EmailMessage) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `Resend ${res.status}: ${body}` };
    }
    return { ok: true };
  }
}

export function getEmailProvider(): EmailProvider {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("NOTIFICATIONS_FROM_EMAIL");
  if (!apiKey || !from) return new NoopEmailProvider();
  return new ResendEmailProvider(apiKey, from);
}
