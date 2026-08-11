# Incident Response

Severity:

- SEV-1: confirmed data exposure, destructive corruption or full production outage.
- SEV-2: major tenant impact, authentication failure or sustained processing outage.
- SEV-3: limited degradation with workaround.

Process: detect, assign incident commander, establish secure channel, record timeline, contain, preserve evidence, eradicate, recover, notify according to policy and complete a blameless review.

Never place credentials, personal email, raw provider payloads or customer content in incident chat/tickets. Use immutable references and approved secure storage.

Security incidents require session/key revocation assessment, tenant-boundary analysis, audit-log preservation and legal/privacy escalation. Recovery ends only after metrics stabilize, reconciliation completes and owners approve closure.
