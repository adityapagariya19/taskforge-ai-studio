# Email Setup Guide

Real SMTP email delivery for task assignments and join-request notifications — off by default so local development never requires SMTP credentials.

## How it works

`EmailService` (`notification/email/EmailService.java`) wraps Spring's `JavaMailSender`. When `taskforge.email.enabled=false` (the default), every call logs what *would* have been sent and returns — no network call, no fake "sent" confirmation shown to the user either, since the in-app notification system (separate, always-on) is what the UI actually displays.

## Enabling it

Set these environment variables and flip the flag:

| Env var | Required | Example |
|---|---|---|
| `TASKFORGE_EMAIL_ENABLED` | yes | `true` |
| `TASKFORGE_SMTP_HOST` | yes | `smtp.gmail.com` |
| `TASKFORGE_SMTP_PORT` | no (defaults 587) | `587` |
| `TASKFORGE_SMTP_USERNAME` | yes | `you@gmail.com` |
| `TASKFORGE_SMTP_PASSWORD` | yes | (an app password, not your regular password) |
| `TASKFORGE_EMAIL_FROM` | no | `noreply@yourcompany.com` |

### Free-tier-compatible SMTP options

- **Gmail SMTP** — free, requires a Google Account App Password (not your regular password) since Google blocks plain password SMTP auth. Generate one under Google Account → Security → App Passwords.
- **SendGrid** — free tier (100 emails/day), SMTP host `smtp.sendgrid.net`, username is literally `apikey`, password is your SendGrid API key.
- **Mailgun** — free sandbox domain for testing, SMTP credentials from their dashboard.

## What sends an email today

- **Task assignment** (`IssueService.updatePatch`) — the assignee gets a real email when a human (not an AI agent) assigns them an issue, naming who assigned it.
- **Join request submitted** (`JoinRequestService.submitByCode`) — every `ORG_OWNER`/`ORG_ADMIN` gets a real email alongside their in-app notification.
- **Join request decision** (`JoinRequestService.approve` / `reject`) — the requester gets a real email either way.

## Failure behavior

`EmailService.send()` never throws past its own boundary — a down or misconfigured mail server logs a warning and the triggering action (assigning a task, approving a request) still succeeds. Email is treated as a side effect, never a dependency the core product breaks on.

## Extending

Every new email type should follow the same shape as `sendTaskAssigned`/`sendJoinRequestReceived`: a small, purpose-named method on `EmailService` with a plain-text subject/body built inline — no template engine needed at this scale, and it keeps every email's content auditable directly in the Java source.
