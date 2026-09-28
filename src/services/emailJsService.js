/**
 * CampusHub EmailJS Welcome Email Integration Service
 * Dispatches dynamic welcome emails to newly registered students/members using EmailJS templates.
 * 
 * Setup instructions:
 * 1. Create a free account on https://www.emailjs.com
 * 2. Add an Email Service (Gmail, Outlook, etc.) -> copy Service ID
 * 3. Create an Email Template -> copy Template ID
 * 4. In Account Settings, copy your Public Key
 * 5. Add to your .env file:
 *    VITE_EMAILJS_SERVICE_ID=service_xxxx
 *    VITE_EMAILJS_TEMPLATE_ID=template_xxxx
 *    VITE_EMAILJS_PUBLIC_KEY=your_public_key
 */

import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

/**
 * Send a rich welcome email to a new user
 * @param {Object} userData - { name, username, email, institution, major }
 */
export async function sendWelcomeEmail({ name, username, email, institution = '', major = '' }) {
  const recipientEmail = (email || '').trim();
  const recipientName = (name || username || 'CampusHub Member').trim();
  const handle = (username || '').trim();

  if (!recipientEmail) {
    console.warn('[EmailJS] Cannot send welcome email: recipient email address is missing.');
    return { success: false, reason: 'missing_email' };
  }

  const templateParams = {
    to_name: recipientName,
    to_email: recipientEmail,
    recipient_name: recipientName,
    recipient_email: recipientEmail,
    username: handle,
    user_name: handle,
    institution: institution || 'CampusHub University',
    major: major || 'Campus Collaboration',
    welcome_title: 'Welcome to CampusHub! 🚀',
    welcome_message: `Welcome to CampusHub! Your collaborative engineering, project workspace, and campus community account is ready. Explore active workspaces, share innovative ideas, and collaborate with peers across campus.`,
    app_url: typeof window !== 'undefined' ? window.location.origin : 'https://campushub.vercel.app',
    year: new Date().getFullYear().toString()
  };

  // If EmailJS credentials are not yet configured in .env, run in development simulation mode
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    console.info(
      `%c[EmailJS Dev Simulator] Welcome Email dispatched for ${recipientName} <${recipientEmail}>\n` +
      `To send live emails, configure VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, and VITE_EMAILJS_PUBLIC_KEY in .env`,
      'color: #38bdf8; font-weight: bold;'
    );
    return {
      success: true,
      simulated: true,
      message: `Welcome email simulated for ${recipientEmail}`
    };
  }

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('[EmailJS] Welcome email sent successfully:', response.status, response.text);
    return {
      success: true,
      status: response.status,
      text: response.text
    };
  } catch (error) {
    console.error('[EmailJS] Failed to send welcome email:', error);
    return {
      success: false,
      error: error?.text || error?.message || 'EmailJS sending failed'
    };
  }
}
