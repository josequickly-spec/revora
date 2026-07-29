export type ProviderMessage = {
  to: string;
  from: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

export type ProviderSendResult = {
  provider: "dry-run" | "resend";
  providerMessageId: string | null;
  accepted: boolean;
  status: "dry_run" | "accepted" | "failed" | "unknown";
  requestId: string | null;
  latencyMs: number;
  warnings: string[];
  safeErrorCode: string | null;
  retryable: boolean;
};

export type ProviderDomainStatus = {
  domain: string;
  verified: boolean;
  sendingEnabled: boolean;
  providerStatus: string;
};

export interface OutreachProvider {
  readonly name: "dry-run" | "resend";
  send(message: ProviderMessage): Promise<ProviderSendResult>;
  domainStatus?(domain: string): Promise<ProviderDomainStatus>;
}

type FetchLike = typeof fetch;

function safeProviderCode(value: unknown) {
  if (!value || typeof value !== "string") return null;
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 100) || null;
}

export class DryRunOutreachProvider implements OutreachProvider {
  readonly name = "dry-run" as const;

  async send(message: ProviderMessage): Promise<ProviderSendResult> {
    const started = Date.now();
    void message;
    return {
      provider: "dry-run",
      providerMessageId: `dry-${message.idempotencyKey.slice(0, 16)}`,
      accepted: false,
      status: "dry_run",
      requestId: null,
      latencyMs: Date.now() - started,
      warnings: ["Dry-run mode: no email was transmitted."],
      safeErrorCode: null,
      retryable: false,
    };
  }
}

export class ResendOutreachProvider implements OutreachProvider {
  readonly name = "resend" as const;
  private readonly apiKey: string;
  private readonly request: FetchLike;

  constructor(apiKey: string, request: FetchLike = fetch) {
    this.apiKey=apiKey;
    this.request=request;
  }

  async send(message: ProviderMessage): Promise<ProviderSendResult> {
    const started = Date.now();
    try {
      const response = await this.request("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": message.idempotencyKey,
        },
        body: JSON.stringify({
          from: message.from,
          to: [message.to],
          reply_to: message.replyTo,
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
      });
      const payload = await response.json().catch(() => ({})) as {
        id?: string;
        name?: string;
        code?: string;
      };
      const requestId = response.headers.get("x-request-id");
      if (response.ok && payload.id) {
        return {
          provider: "resend",
          providerMessageId: payload.id,
          accepted: true,
          status: "accepted",
          requestId,
          latencyMs: Date.now() - started,
          warnings: [],
          safeErrorCode: null,
          retryable: false,
        };
      }
      const code = safeProviderCode(payload.name || payload.code)
        || (response.status === 429
          ? "provider_rate_limited"
          : response.status >= 500
            ? "temporary_provider_error"
            : "provider_rejected");
      return {
        provider: "resend",
        providerMessageId: null,
        accepted: false,
        status: "failed",
        requestId,
        latencyMs: Date.now() - started,
        warnings: [],
        safeErrorCode: code,
        retryable: response.status === 429 || response.status >= 500,
      };
    } catch {
      return {
        provider: "resend",
        providerMessageId: null,
        accepted: false,
        status: "unknown",
        requestId: null,
        latencyMs: Date.now() - started,
        warnings: ["Provider acceptance could not be confirmed; automatic retry is disabled."],
        safeErrorCode: "ambiguous_transport",
        retryable: false,
      };
    }
  }

  async domainStatus(domain: string): Promise<ProviderDomainStatus> {
    const response = await this.request("https://api.resend.com/domains?limit=100", {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!response.ok) throw new Error("provider_domain_status_unavailable");
    const payload = await response.json() as {
      data?: Array<{
        name?: string;
        status?: string;
        capabilities?: { sending?: string };
      }>;
    };
    const match = payload.data?.find(item => item.name?.toLowerCase() === domain.toLowerCase());
    const providerStatus = match?.status || "not_found";
    const verified = providerStatus === "verified"
      || (providerStatus === "partially_verified" && match?.capabilities?.sending === "enabled");
    return {
      domain,
      verified,
      sendingEnabled: match?.capabilities?.sending === "enabled",
      providerStatus,
    };
  }
}

export function getOutreachProvider(provider = "dry-run"): OutreachProvider {
  if (provider === "resend") {
    if (!process.env.RESEND_API_KEY) throw new Error("resend_not_configured");
    return new ResendOutreachProvider(process.env.RESEND_API_KEY);
  }
  if (provider === "dry-run") return new DryRunOutreachProvider();
  throw new Error("outreach_provider_not_supported");
}

export function mailboxAddress(value: string | undefined) {
  const match = value?.match(/<([^<>]+)>/);
  return (match?.[1] || value || "").trim().toLowerCase();
}
