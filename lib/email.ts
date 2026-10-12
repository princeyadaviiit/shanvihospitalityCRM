import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendStaffInvitation(email: string, name: string, role: string) {
  const signUpUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sign-up`;

  // If Resend is configured, send actual email
  if (resend) {
    try {
      await resend.emails.send({
        from: 'Shanvi Hospitality <noreply@shanvihospitality.com>',
        to: email,
        subject: 'You\'ve been invited to Shanvi CRM',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Shanvi Hospitality CRM</h2>
            <p>Hi ${name},</p>
            <p>You've been invited to join Shanvi Hospitality CRM as a <strong>${role}</strong>.</p>
            <p>To get started, please sign up using your email address:</p>
            <a href="${signUpUrl}" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
              Sign Up Now
            </a>
            <p style="color: #666; font-size: 14px;">
              Email: ${email}<br>
              Role: ${role}
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 40px;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        `,
      });
      return { success: true, method: 'email' };
    } catch (error: any) {
      console.error('Email send failed:', error);
      return { success: false, method: 'email', error: error.message };
    }
  }

  // Fallback: return sign-up link for manual sharing
  return {
    success: true,
    method: 'manual',
    message: `Email not configured. Share this link with ${name}: ${signUpUrl}`,
  };
}
