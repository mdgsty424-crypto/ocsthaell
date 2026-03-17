import emailjs from '@emailjs/browser';

// Step 1: Support & Resolution System (support@ocsthael.com)
// Service: service_h3y4bu3, Templates: template_knbs3lw (Support), template_qwsdu8r (Resolve)
// Public Key: VmaJ2hrnGEYVlmGQn

export const sendSupportTicket = async (userData: { name: string; issueSubject: string; userId: string; email: string }) => {
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
        const response = await emailjs.send(
            'service_h3y4bu3',
            'template_knbs3lw',
            templateParams,
            'VmaJ2hrnGEYVlmGQn'
        );
        console.log('SUCCESS!', response.status, response.text);
        return { success: true, ticketNo: templateParams.ticket_no };
    } catch (err) {
        console.log('FAILED...', err);
        return { success: false, error: err };
    }
};

export const sendResolutionMail = async (userData: { name: string; ticketId: string; msg: string; userEmail: string }) => {
    const templateParams = {
        user_name: userData.name,
        ticket_no: userData.ticketId,
        resolution_details: userData.msg,
        feedback_link: "https://ocsthael.com/feedback",
        email: userData.userEmail
    };

    try {
        const response = await emailjs.send(
            'service_h3y4bu3',
            'template_qwsdu8r',
            templateParams,
            'VmaJ2hrnGEYVlmGQn'
        );
        console.log("Success! Resolve mail sent.", response.status);
        return { success: true };
    } catch (err) {
        console.log("Error!", err);
        return { success: false, error: err };
    }
};

// Step 2: Authentication & Security (auth@ocsthael.com)
// Service: service_7joia8l, Templates: template_t1nzyk9 (OTP), template_9wixb5n (Security)
// Public Key: dGeS-888dsuY81CaC

export const sendSecurityAlert = async (userData: { name: string; device: string; city: string; userEmail: string }) => {
    const templateParams = {
        user_name: userData.name,
        device_info: userData.device,
        location: userData.city,
        time_stamp: new Date().toLocaleString(),
        secure_link: "https://ocsthael.com/security/reset-password",
        email: userData.userEmail
    };

    try {
        const response = await emailjs.send(
            'service_7joia8l',
            'template_9wixb5n',
            templateParams,
            'dGeS-888dsuY81CaC'
        );
        console.log("Security Alert Sent!", response.status);
        return { success: true };
    } catch (err) {
        console.log("Error!", err);
        return { success: false, error: err };
    }
};

export const sendAuthOTP = async (userEmail: string, userName: string) => {
    const generatedOTP = Math.floor(100000 + Math.random() * 900000);

    const templateParams = {
        user_name: userName,
        otp: generatedOTP,
        email: userEmail
    };

    try {
        const response = await emailjs.send(
            'service_7joia8l',
            'template_t1nzyk9',
            templateParams,
            'dGeS-888dsuY81CaC'
        );
        console.log('OTP Sent Successfully!', response.status);
        return { success: true, otp: generatedOTP };
    } catch (error) {
        console.log('Failed to send OTP...', error);
        return { success: false, error };
    }
};

// Step 3: General Inquiry & Welcome (info@ocsthael.com)
// Service: service_d6gl2h8, Templates: template_0k24sma (Inquiry), template_7is790g (Welcome)
// Public Key: CASwBIPvE2-h_FQD0

export const sendInquiryMail = async (formData: { senderName: string; topic: string; senderEmail: string }) => {
    const templateParams = {
        from_name: formData.senderName,
        subject: formData.topic,
        about_link: "https://ocsthael.com/about",
        email: formData.senderEmail
    };

    try {
        const response = await emailjs.send(
            'service_d6gl2h8',
            'template_0k24sma',
            templateParams,
            'CASwBIPvE2-h_FQD0'
        );
        console.log('Success! Inquiry received.', response.status);
        return { success: true };
    } catch (error) {
        console.log('Failed...', error);
        return { success: false, error };
    }
};

export const sendWelcomeMail = async (userData: { name: string; userEmail: string }) => {
    const templateParams = {
        user_name: userData.name,
        service_link: "https://ocsthael.com/services",
        email: userData.userEmail
    };

    try {
        const response = await emailjs.send(
            'service_d6gl2h8',
            'template_7is790g',
            templateParams,
            'CASwBIPvE2-h_FQD0'
        );
        console.log("Welcome Email Sent!", response.status);
        return { success: true };
    } catch (err) {
        console.log("Error!", err);
        return { success: false, error: err };
    }
};

// Step 4: Team, Bonus & Finance (teams@ocsthael.com)
// Service: service_82x51hh, Templates: template_pgs759e (Bonus), template_tbwkvrn (Withdraw)
// Public Key: 0Wn4VU_rBy5ve6v9U

export const sendBonusMail = async (memberData: { name: string; amount: string; email: string }) => {
    const templateParams = {
        member_name: memberData.name,
        bonus_amount: memberData.amount,
        wallet_link: "https://ocsthael.com/dashboard/wallet",
        email: memberData.email
    };

    try {
        const response = await emailjs.send(
            'service_82x51hh',
            'template_pgs759e',
            templateParams,
            '0Wn4VU_rBy5ve6v9U'
        );
        console.log("Bonus Email Sent Successfully!", response.status);
        return { success: true };
    } catch (err) {
        console.log("Error sending bonus mail:", err);
        return { success: false, error: err };
    }
};

export const sendWithdrawalSuccessMail = async (withdrawData: { userName: string; amount: string; method: string; transactionId: string; userEmail: string }) => {
    const templateParams = {
        member_name: withdrawData.userName,
        amount: withdrawData.amount,
        payment_method: withdrawData.method,
        txn_id: withdrawData.transactionId,
        history_link: "https://ocsthael.com/account/history",
        email: withdrawData.userEmail
    };

    try {
        const response = await emailjs.send(
            'service_82x51hh',
            'template_tbwkvrn',
            templateParams,
            '0Wn4VU_rBy5ve6v9U'
        );
        console.log("Withdrawal Notification Sent!", response.status);
        return { success: true };
    } catch (err) {
        console.log("Error!", err);
        return { success: false, error: err };
    }
};
