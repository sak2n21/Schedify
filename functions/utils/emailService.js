// // functions/utils/emailService.js
// const nodemailer = require('nodemailer');
// const config = require('../config');

// // Create a transporter object using SMTP
// const transporter = nodemailer.createTransport({
//   service: 'gmail', // or any other email service
//   auth: {
//     user: config.email.user,
//     pass: config.email.password,
//   },
// });

// // Function to send reminder email
// const sendReminderEmail = async (recipient, schedule) => {
//   try {
//     const mailOptions = {
//       from: `"Schedify App" <${config.email.user}>`,
//       to: recipient,
//       subject: `Reminder: ${schedule.title}`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
//           <h2 style="color: #3b82f6; margin-bottom: 20px;">📅 Reminder from Schedify</h2>
//           <p>Hello,</p>
//           <p>This is a reminder for your scheduled task:</p>
//           <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
//             <h3 style="margin-top: 0; color: #1e293b;">${schedule.title}</h3>
//             <p><strong>Category:</strong> ${schedule.category}</p>
//             <p><strong>Priority:</strong> <span style="text-transform: capitalize;">${schedule.priority}</span></p>
//             <p><strong>Date:</strong> ${new Date(schedule.date).toLocaleDateString()}</p>
//             <p><strong>Time:</strong> ${schedule.scheduleTime}</p>
//           </div>
//           <p>Don't forget!</p>
//           <p>Best regards,<br>Schedify Team</p>
//         </div>
//       `,
//     };

//     const info = await transporter.sendMail(mailOptions);
//     console.log('Email sent:', info.messageId);
//     return info;
//   } catch (error) {
//     console.error('Error sending email:', error);
//     throw error;
//   }
// };

// module.exports = {
//   sendReminderEmail,
// };


function sendReminderEmail(userDetails) {
    // Prepare template parameters
    const templateParams = {
      to_name: userDetails.name,
      to_email: userDetails.email,
      appointment_date: userDetails.date,
      appointment_time: userDetails.time,
      service_type: userDetails.service,
      // Add any other parameters needed for your template
    };
  
    // Send the email
    emailjs.send(
      "YOUR_SERVICE_ID",       // e.g., "schedify_reminders"
      "YOUR_TEMPLATE_ID",      // e.g., "appointment-reminder"
      templateParams
    ).then(
      function(response) {
        console.log("Email sent successfully!", response.status, response.text);
      },
      function(error) {
        console.error("Failed to send email:", error);
      }
    );
  }