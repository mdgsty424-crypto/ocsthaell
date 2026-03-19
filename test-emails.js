const emails = [
  {
    name: "Support Request",
    payload: {
      service_id: 'service_h3y4bu3',
      template_id: 'template_knbs3lw',
      user_id: 'VmaJ2hrnGEYVlmGQn',
      template_params: { user_name: "Test User", to_name: "Test User", subject: "Test Support Ticket", ticket_no: "OC-1234", role_header: "Support Request Received", role_message: "This is a test message.", ticket_link: "https://ocsthael.com", email: "mdgsty424@gmail.com" }
    }
  },
  {
    name: "Support Resolved",
    payload: {
      service_id: 'service_h3y4bu3',
      template_id: 'template_qwsdu8r',
      user_id: 'VmaJ2hrnGEYVlmGQn',
      template_params: { user_name: "Test User", ticket_no: "OC-1234", resolution_details: "Your issue has been resolved.", feedback_link: "https://ocsthael.com", email: "mdgsty424@gmail.com" }
    }
  },
  {
    name: "Auth OTP",
    payload: {
      service_id: 'service_7joia8l',
      template_id: 'template_t1nzyk9',
      user_id: 'dGeS-888dsuY81CaC',
      template_params: { user_name: "Test User", otp: "12345678", email: "mdgsty424@gmail.com" }
    }
  },
  {
    name: "Security Alert",
    payload: {
      service_id: 'service_7joia8l',
      template_id: 'template_9wixb5n',
      user_id: 'dGeS-888dsuY81CaC',
      template_params: { user_name: "Test User", device_info: "Test Device", location: "Test City", time_stamp: new Date().toLocaleString(), secure_link: "https://ocsthael.com", email: "mdgsty424@gmail.com" }
    }
  },
  {
    name: "Withdrawal Success",
    payload: {
      service_id: 'service_82x51hh',
      template_id: 'template_pgs759e',
      user_id: '0Wn4VU_rBy5ve6v9U',
      template_params: { member_name: "Test User", amount: "500", payment_method: "bKash", txn_id: "TXN12345678", history_link: "https://ocsthael.com", email: "mdgsty424@gmail.com" }
    }
  },
  {
    name: "Bonus Credit",
    payload: {
      service_id: 'service_82x51hh',
      template_id: 'template_tbwkvrn',
      user_id: '0Wn4VU_rBy5ve6v9U',
      template_params: { member_name: "Test User", bonus_amount: "100", wallet_link: "https://ocsthael.com", email: "mdgsty424@gmail.com" }
    }
  },
  {
    name: "Welcome Mail",
    payload: {
      service_id: 'service_d6gl2h8',
      template_id: 'template_7is790g',
      user_id: 'CASwBIPvE2-h_FQD0',
      template_params: { user_name: "Test User", service_link: "https://ocsthael.com", email: "mdgsty424@gmail.com" }
    }
  },
  {
    name: "General Inquiry",
    payload: {
      service_id: 'service_d6gl2h8',
      template_id: 'template_0k24sma',
      user_id: 'CASwBIPvE2-h_FQD0',
      template_params: { from_name: "Test User", subject: "Test Inquiry", about_link: "https://ocsthael.com", email: "mdgsty424@gmail.com" }
    }
  }
];

async function sendEmails() {
  for (const email of emails) {
    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(email.payload)
      });
      if (response.ok) {
        console.log(`✅ Successfully sent: ${email.name}`);
      } else {
        const text = await response.text();
        console.error(`❌ Failed to send: ${email.name} - ${text}`);
      }
    } catch (err) {
      console.error(`❌ Error sending ${email.name}:`, err.message);
    }
    // Small delay to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

sendEmails();
