/**
 * Pluggable Email Provider Interface
 * Switch between Brevo and Resend with a single env variable change.
 * No code changes required to swap providers.
 */

import { prisma } from '@/lib/prisma'

interface EmailAttachment {
  filename: string
  content: Buffer | string
  contentType?: string
}

interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  text?: string
  attachments?: EmailAttachment[]
}

interface EmailProvider {
  send(params: SendEmailParams): Promise<void>
}

// ─── Brevo Provider (via SMTP/API) ────────────────────────────────────────────

class BrevoProvider implements EmailProvider {
  private apiKey: string
  private fromEmail: string
  private fromName: string

  constructor(apiKey: string, fromEmail: string, fromName: string) {
    this.apiKey = apiKey
    this.fromEmail = fromEmail
    this.fromName = fromName
  }

  async send(params: SendEmailParams): Promise<void> {
    const recipients = Array.isArray(params.to) ? params.to : [params.to]

    const body: Record<string, unknown> = {
      sender: { email: this.fromEmail, name: this.fromName },
      to: recipients.map((email) => ({ email })),
      subject: params.subject,
      htmlContent: params.html,
      textContent: params.text,
    }

    if (params.attachments?.length) {
      body.attachment = params.attachments.map((a) => ({
        name: a.filename,
        content:
          typeof a.content === 'string'
            ? a.content
            : Buffer.from(a.content).toString('base64'),
      }))
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Brevo email failed: ${error}`)
    }
  }
}

// ─── Resend Provider ──────────────────────────────────────────────────────────

class ResendProvider implements EmailProvider {
  private apiKey: string
  private fromEmail: string
  private fromName: string

  constructor(apiKey: string, fromEmail: string, fromName: string) {
    this.apiKey = apiKey
    this.fromEmail = fromEmail
    this.fromName = fromName
  }

  async send(params: SendEmailParams): Promise<void> {
    const recipients = Array.isArray(params.to) ? params.to : [params.to]

    const body: Record<string, unknown> = {
      from: `${this.fromName} <${this.fromEmail}>`,
      to: recipients,
      subject: params.subject,
      html: params.html,
      text: params.text,
    }

    if (params.attachments?.length) {
      body.attachments = params.attachments.map((a) => ({
        filename: a.filename,
        content:
          typeof a.content === 'string'
            ? a.content
            : Buffer.from(a.content).toString('base64'),
      }))
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Resend email failed: ${error}`)
    }
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export async function getEmailProvider(): Promise<EmailProvider> {
  const settingsList = await prisma.orgSetting.findMany({
    where: {
      key: {
        in: ['email_provider', 'email_api_key', 'email_from', 'email_from_name']
      }
    }
  })

  const settings = settingsList.reduce((acc, s) => {
    acc[s.key] = s.value
    return acc
  }, {} as Record<string, string>)

  const provider = settings['email_provider'] || process.env.EMAIL_PROVIDER || 'brevo'
  const apiKey = settings['email_api_key'] || process.env.EMAIL_API_KEY || ''
  const fromEmail = settings['email_from'] || process.env.EMAIL_FROM || 'no-reply@freemindfoundation.org.in'
  const fromName = settings['email_from_name'] || process.env.EMAIL_FROM_NAME || 'Free Mind Foundation'

  switch (provider.toLowerCase()) {
    case 'resend':
      return new ResendProvider(apiKey, fromEmail, fromName)
    case 'brevo':
    default:
      return new BrevoProvider(apiKey, fromEmail, fromName)
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

export function volunteerInviteTemplate(params: {
  name: string
  inviteUrl: string
  orgName: string
}) {
  return {
    subject: `Welcome to ${params.orgName} — Set Up Your Volunteer Account`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #00897B; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">${params.orgName}</h1>
        </div>
        <div style="padding: 32px; background: #ffffff;">
          <h2 style="color: #1a1a1a;">Welcome, ${params.name}!</h2>
          <p style="color: #444; line-height: 1.6;">
            Congratulations! You have been approved as a volunteer with ${params.orgName}.
            Please click the button below to set up your account password.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${params.inviteUrl}"
               style="background: #00897B; color: white; padding: 14px 28px;
                      text-decoration: none; border-radius: 6px; font-weight: bold;
                      display: inline-block;">
              Set Up My Account
            </a>
          </div>
          <p style="color: #888; font-size: 13px;">
            This link expires in 48 hours. If you did not expect this email, please ignore it.
          </p>
        </div>
        <div style="padding: 16px; background: #f5f5f5; text-align: center;">
          <p style="color: #aaa; font-size: 12px; margin: 0;">${params.orgName}</p>
        </div>
      </div>
    `,
    text: `Welcome ${params.name}! Set up your volunteer account: ${params.inviteUrl}`,
  }
}

export function donationReceiptTemplate(params: {
  donorName: string
  receiptNumber: string
  amount: string
  date: string
  orgName: string
}) {
  return {
    subject: `Donation Receipt ${params.receiptNumber} — ${params.orgName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #00897B; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">${params.orgName}</h1>
        </div>
        <div style="padding: 32px; background: #ffffff;">
          <h2 style="color: #1a1a1a;">Thank You, ${params.donorName}!</h2>
          <p style="color: #444; line-height: 1.6;">
            We have received your donation of <strong>${params.amount}</strong> on ${params.date}.
            Please find your 80G receipt attached to this email.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 24px;">
            <tr style="background: #f5f5f5;">
              <td style="padding: 10px; font-weight: bold; color: #555;">Receipt Number</td>
              <td style="padding: 10px; color: #333;">${params.receiptNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; color: #555;">Amount</td>
              <td style="padding: 10px; color: #333;">${params.amount}</td>
            </tr>
            <tr style="background: #f5f5f5;">
              <td style="padding: 10px; font-weight: bold; color: #555;">Date</td>
              <td style="padding: 10px; color: #333;">${params.date}</td>
            </tr>
          </table>
          <p style="color: #888; font-size: 13px; margin-top: 24px;">
            This receipt is valid for 80G tax deduction purposes.
          </p>
        </div>
        <div style="padding: 16px; background: #f5f5f5; text-align: center;">
          <p style="color: #aaa; font-size: 12px; margin: 0;">${params.orgName}</p>
        </div>
      </div>
    `,
    text: `Thank you ${params.donorName} for your donation of ${params.amount}. Receipt: ${params.receiptNumber}`,
  }
}
