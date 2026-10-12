import { Resend } from 'resend';

// Check if RESEND_API_KEY is actually configured (not placeholder)
const apiKey = process.env.RESEND_API_KEY;
const isRealKey = apiKey && apiKey.startsWith('re_') && !apiKey.includes('your_resend_api_key_here');
const resend = isRealKey ? new Resend(apiKey) : null;

export async function sendStaffInvitation(email: string, name: string, role: string) {
  const signUpUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sign-up`;

  // If Resend is configured with a real API key, send actual email
  if (resend) {
    console.log('📧 Sending invitation email via Resend to:', email);
    try {
      const result = await resend.emails.send({
        from: 'Shanvi Hospitality <onboarding@resend.dev>', // Use resend.dev domain for testing
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
      console.log('✅ Email sent successfully:', result);
      return { success: true, method: 'email' };
    } catch (error: any) {
      console.error('❌ Email send failed:', error);
      console.error('Error details:', error.message);
      return { success: false, method: 'email', error: error.message };
    }
  }

  // Fallback: return sign-up link for manual sharing
  console.log('⚠️ RESEND_API_KEY not configured or invalid. Get a free key from https://resend.com');
  console.log('💡 For now, share this link manually with', name, ':', signUpUrl);

  return {
    success: true,
    method: 'manual',
    message: `Email service not configured. Share this link with ${name}: ${signUpUrl}`,
  };
}
