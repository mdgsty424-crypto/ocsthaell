import emailjs from '@emailjs/browser';

// These should ideally be in environment variables
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'default_service';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'default_public_key';

// Define templates for different departments
export const EMAIL_TEMPLATES = {
  auth: import.meta.env.VITE_EMAILJS_TEMPLATE_AUTH || 'template_auth', // For OTPs
  support: import.meta.env.VITE_EMAILJS_TEMPLATE_SUPPORT || 'template_support', // For tickets
  teams: import.meta.env.VITE_EMAILJS_TEMPLATE_TEAMS || 'template_teams',
  ocshoping: import.meta.env.VITE_EMAILJS_TEMPLATE_SHOPPING || 'template_shopping',
  info: import.meta.env.VITE_EMAILJS_TEMPLATE_INFO || 'template_info', // General updates
};

export const sendEmail = async (
  templateId: string,
  templateParams: Record<string, unknown>
) => {
  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      templateId,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );
    return response;
  } catch (error) {
    console.error('EmailJS Error:', error);
    throw error;
  }
};

export const sendOTP = async (email: string, otp: string) => {
  return sendEmail(EMAIL_TEMPLATES.auth, {
    to_email: email,
    otp_code: otp,
    reply_to: 'auth@ocsthael.com',
  });
};

export const sendSupportTicket = async (name: string, email: string, subject: string, message: string) => {
  return sendEmail(EMAIL_TEMPLATES.support, {
    from_name: name,
    reply_to: email,
    subject: subject,
    message: message,
    to_email: 'support@ocsthael.com',
  });
};

export const sendGeneralInfo = async (name: string, email: string, message: string) => {
  return sendEmail(EMAIL_TEMPLATES.info, {
    from_name: name,
    reply_to: email,
    message: message,
    to_email: 'info@ocsthael.com',
  });
};

export const sendWithdrawalRequest = async (userName: string, userEmail: string, phone: string, amount: number, operator: string) => {
  return sendEmail(EMAIL_TEMPLATES.info, {
    from_name: userName,
    reply_to: userEmail,
    subject: `Withdrawal Request: ${amount} TK via ${operator}`,
    message: `User ${userName} (${userEmail}) has requested a withdrawal of ${amount} TK via ${operator}. Phone Number: ${phone}. Please process this within 12 hours.`,
    to_email: 'admin@ocsthael.com',
  });
};
