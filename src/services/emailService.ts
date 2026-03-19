import emailjs from '@emailjs/browser';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

// Default configurations (fallback)
const DEFAULTS = {
    support: {
        serviceId: 'service_h3y4bu3',
        templateSupport: 'template_knbs3lw',
        templateResolve: 'template_qwsdu8r',
        publicKey: 'VmaJ2hrnGEYVlmGQn'
    },
    auth: {
        serviceId: 'service_7joia8l',
        templateOTP: 'template_t1nzyk9',
        templateSecurity: 'template_9wixb5n',
        publicKey: 'dGeS-888dsuY81CaC'
    },
    info: {
        serviceId: 'service_d6gl2h8',
        templateInquiry: 'template_0k24sma',
        templateWelcome: 'template_7is790g',
        publicKey: 'CASwBIPvE2-h_FQD0'
    },
    teams: {
        serviceId: 'service_82x51hh',
        templateBonus: 'template_pgs759e',
        templateWithdraw: 'template_tbwkvrn',
        publicKey: '0Wn4VU_rBy5ve6v9U'
    }
};

const getEmailConfig = async (category: string) => {
    try {
        const q = query(collection(db, 'emailSettings'), where('category', '==', category));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return snapshot.docs[0].data();
        }
    } catch (err) {
        console.error(`Error fetching email config for ${category}:`, err);
    }
    return null;
};

// Step 1: Support & Resolution System (support@ocsthael.com)
export const sendSupportTicket = async (userData: { name: string; issueSubject: string; userId: string; email: string }) => {
    if (!userData.email) return { success: false, error: "Recipient email is empty" };

    const config = await getEmailConfig('support');
    const serviceId = config?.serviceId || DEFAULTS.support.serviceId;
    const templateId = config?.templateId || DEFAULTS.support.templateSupport;
    const publicKey = config?.publicKey || DEFAULTS.support.publicKey;

    const templateParams = {
        to_name: userData.name,
        user_name: userData.name,
        subject: userData.issueSubject,
        ticket_no: "OC-" + Math.floor(1000 + Math.random() * 9000),
        role_header: "Support Request Received",
        role_message: "We have received your report. Our executive team is reviewing the issue and will provide a solution shortly.",
        ticket_link: `https://ocsthael.com/support/status/${userData.userId}`,
        email: userData.email
    };

    try {
        const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
        console.log('SUCCESS!', response.status, response.text);
        return { success: true, ticketNo: templateParams.ticket_no };
    } catch (err) {
        console.log('FAILED...', err);
        return { success: false, error: err };
    }
};

export const sendResolutionMail = async (userData: { name: string; ticketId: string; msg: string; userEmail: string }) => {
    if (!userData.userEmail) return { success: false, error: "Recipient email is empty" };

    const config = await getEmailConfig('support');
    const serviceId = config?.serviceId || DEFAULTS.support.serviceId;
    const templateId = config?.templateSecondaryId || DEFAULTS.support.templateResolve;
    const publicKey = config?.publicKey || DEFAULTS.support.publicKey;

    const templateParams = {
        user_name: userData.name,
        ticket_no: userData.ticketId,
        resolution_details: userData.msg,
        feedback_link: "https://ocsthael.com/feedback",
        email: userData.userEmail
    };

    try {
        const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
        console.log("Success! Resolve mail sent.", response.status);
        return { success: true };
    } catch (err) {
        console.log("Error!", err);
        return { success: false, error: err };
    }
};

// Step 2: Authentication & Security (auth@ocsthael.com)
export const sendSecurityAlert = async (userData: { name: string; device: string; city: string; userEmail: string }) => {
    if (!userData.userEmail) return { success: false, error: "Recipient email is empty" };

    const config = await getEmailConfig('auth');
    const serviceId = config?.serviceId || DEFAULTS.auth.serviceId;
    const templateId = config?.templateSecondaryId || DEFAULTS.auth.templateSecurity;
    const publicKey = config?.publicKey || DEFAULTS.auth.publicKey;

    const templateParams = {
        user_name: userData.name,
        device_info: userData.device,
        location: userData.city,
        time_stamp: new Date().toLocaleString(),
        secure_link: "https://ocsthael.com/security/reset-password",
        email: userData.userEmail
    };

    try {
        const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
        console.log("Security Alert Sent!", response.status);
        return { success: true };
    } catch (err) {
        console.log("Error!", err);
        return { success: false, error: err };
    }
};

export const sendAuthOTP = async (userEmail: string, userName: string) => {
    if (!userEmail) return { success: false, error: "Recipient email is empty" };

    const config = await getEmailConfig('auth');
    const serviceId = config?.serviceId || DEFAULTS.auth.serviceId;
    const templateId = config?.templateId || DEFAULTS.auth.templateOTP;
    const publicKey = config?.publicKey || DEFAULTS.auth.publicKey;

    const generatedOTP = Math.floor(100000 + Math.random() * 900000);

    const templateParams = {
        user_name: userName,
        otp: generatedOTP,
        email: userEmail
    };

    try {
        const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
        console.log('OTP Sent Successfully!', response.status);
        return { success: true, otp: generatedOTP };
    } catch (error) {
        console.log('Failed to send OTP...', error);
        return { success: false, error };
    }
};

// Step 3: General Inquiry & Welcome (info@ocsthael.com)
export const sendInquiryMail = async (formData: { senderName: string; topic: string; senderEmail: string }) => {
    if (!formData.senderEmail) return { success: false, error: "Recipient email is empty" };

    const config = await getEmailConfig('info');
    const serviceId = config?.serviceId || DEFAULTS.info.serviceId;
    const templateId = config?.templateSecondaryId || DEFAULTS.info.templateInquiry;
    const publicKey = config?.publicKey || DEFAULTS.info.publicKey;

    const templateParams = {
        from_name: formData.senderName,
        subject: formData.topic,
        about_link: "https://ocsthael.com/about",
        email: formData.senderEmail
    };

    try {
        const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
        console.log('Success! Inquiry received.', response.status);
        return { success: true };
    } catch (error) {
        console.log('Failed...', error);
        return { success: false, error };
    }
};

export const sendWelcomeMail = async (userData: { name: string; userEmail: string }) => {
    if (!userData.userEmail) return { success: false, error: "Recipient email is empty" };

    const config = await getEmailConfig('info');
    const serviceId = config?.serviceId || DEFAULTS.info.serviceId;
    const templateId = config?.templateId || DEFAULTS.info.templateWelcome;
    const publicKey = config?.publicKey || DEFAULTS.info.publicKey;

    const templateParams = {
        user_name: userData.name,
        service_link: "https://ocsthael.com/services",
        email: userData.userEmail
    };

    try {
        const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
        console.log("Welcome Email Sent!", response.status);
        return { success: true };
    } catch (err) {
        console.log("Error!", err);
        return { success: false, error: err };
    }
};

// Step 4: Team, Bonus & Finance (teams@ocsthael.com)
export const sendBonusMail = async (memberData: { name: string; amount: string; email: string }) => {
    if (!memberData.email) return { success: false, error: "Recipient email is empty" };

    const config = await getEmailConfig('teams');
    const serviceId = config?.serviceId || DEFAULTS.teams.serviceId;
    const templateId = config?.templateSecondaryId || DEFAULTS.teams.templateBonus;
    const publicKey = config?.publicKey || DEFAULTS.teams.publicKey;

    const templateParams = {
        member_name: memberData.name,
        bonus_amount: memberData.amount,
        wallet_link: "https://ocsthael.com/dashboard/wallet",
        email: memberData.email
    };

    try {
        const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
        console.log("Bonus Email Sent Successfully!", response.status);
        return { success: true };
    } catch (err) {
        console.log("Error sending bonus mail:", err);
        return { success: false, error: err };
    }
};

export const sendWithdrawalSuccessMail = async (withdrawData: { userName: string; amount: string; method: string; transactionId: string; userEmail: string }) => {
    if (!withdrawData.userEmail) return { success: false, error: "Recipient email is empty" };

    const config = await getEmailConfig('teams');
    const serviceId = config?.serviceId || DEFAULTS.teams.serviceId;
    const templateId = config?.templateId || DEFAULTS.teams.templateWithdraw;
    const publicKey = config?.publicKey || DEFAULTS.teams.publicKey;

    const templateParams = {
        member_name: withdrawData.userName,
        amount: withdrawData.amount,
        payment_method: withdrawData.method,
        txn_id: withdrawData.transactionId,
        history_link: "https://ocsthael.com/account/history",
        email: withdrawData.userEmail
    };

    try {
        const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
        console.log("Withdrawal Notification Sent!", response.status);
        return { success: true };
    } catch (err) {
        console.log("Error!", err);
        return { success: false, error: err };
    }
};

export const sendTestEmail = async (userEmail: string) => {
    if (!userEmail) return { success: false, error: "Recipient email is empty" };

    const config = await getEmailConfig('teams');
    const serviceId = config?.serviceId || DEFAULTS.teams.serviceId;
    const templateId = config?.templateId || DEFAULTS.teams.templateWithdraw;
    const publicKey = config?.publicKey || DEFAULTS.teams.publicKey;

    console.log("EmailService: sendTestEmail called", userEmail);
    try {
        const result = await emailjs.send(
            serviceId,
            templateId,
            {
                member_name: 'Test User',
                amount: '0.00',
                payment_method: 'Test Method',
                txn_id: 'TEST-123',
                email: userEmail
            },
            publicKey
        );
        console.log("EmailService: Test email sent!", result.status, result.text);
        return { success: true, result };
    } catch (error) {
        console.error("EmailService: Failed to send test email:", error);
        return { success: false, error };
    }
};

