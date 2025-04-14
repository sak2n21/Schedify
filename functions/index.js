const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const cors = require('cors')({origin: true});

admin.initializeApp();

// 🔐 Configure Gmail (set these in Firebase config)
const gmailConfig = {
  user: "kokshaoai@gmail.com",
  pass: "nqbe ywms qupj ctda"
};

// ⏰ Scheduled Reminder (Runs every minute)
exports.checkReminders = functions.pubsub
  .schedule("* * * * *")  // Every minute
  .timeZone("Asia/Singapore")  // This only affects when the function runs, not Date calculations
  .onRun(async (context) => {
    // Get UTC time
    const now = new Date();
    
    // Apply Singapore timezone offset (UTC+8)
    const singaporeOffset = 8; // Hours ahead of UTC
    
    // Get hours and minutes in Singapore time
    const utcHours = now.getUTCHours();
    const singaporeHours = (utcHours + singaporeOffset) % 24;
    const minutes = now.getUTCMinutes();
    
    // Format time with leading zeros
    const currentTime = `${String(singaporeHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    
    // Get date components in Singapore time
    // Need to handle day rollover if UTC time + 8 hours crosses midnight
    let singaporeDate = new Date(now);
    // If adding 8 hours crosses midnight, we need to add a day
    if (utcHours + singaporeOffset >= 24) {
      singaporeDate.setUTCDate(singaporeDate.getUTCDate() + 1);
    }
    
    const year = singaporeDate.getUTCFullYear();
    const month = String(singaporeDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(singaporeDate.getUTCDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`;
    
    console.log(`Current date/time in Singapore: ${currentDate} ${currentTime}`);
    
    const db = admin.firestore();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailConfig.user,
        pass: gmailConfig.pass,
      },
    });

    // Debug the exact query parameters
    console.log(`Searching for reminders with: date=${currentDate}, time=${currentTime}`);

    const reminders = await db
      .collection("schedules")
      .where("date", "==", currentDate)
      .where("reminderTime", "==", currentTime)
      .where("reminder", "==", true)
      .get();

    console.log(`Found ${reminders.docs.length} reminders to process`);

    const promises = reminders.docs.map(async (doc) => {
      const schedule = doc.data();
      console.log(`Processing reminder: ${JSON.stringify(schedule)}`);
      
      try {
        const userSnap = await db.collection("users").doc(schedule.userId).get();
        if (!userSnap.exists) {
          console.warn(`User ${schedule.userId} not found`);
          return;
        }

        await transporter.sendMail({
          from: `"Appointment App" <${gmailConfig.user}>`,
          to: userSnap.data().email,
          subject: `Reminder: ${schedule.title}`,
          html: `<p>Your appointment <strong>${schedule.title}</strong> is at ${schedule.scheduleTime}.</p>`,
        });

        await doc.ref.update({ reminded: true });
        console.log(`✅ Sent reminder for ${schedule.title}`);
      } catch (error) {
        console.error(`❌ Failed to send reminder:`, error);
      }
    });

    await Promise.all(promises);
    return null;
  });

// 📨 Manual Reminder HTTP Endpoint
exports.sendReminderNow = functions.https.onRequest(async (req, res) => {
  // Validate request
  if (req.method !== "POST") {
    return res.status(405).send("Use POST method");
  }

  const { to, title, scheduleTime } = req.body;
  if (!to || !title || !scheduleTime) {
    return res.status(400).json({
      error: "Missing fields",
      required: ["to", "title", "scheduleTime"],
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailConfig.user,
        pass: gmailConfig.pass,
      },
    });

    await transporter.sendMail({
      from: `"Appointment App" <${gmailConfig.user}>`,
      to,
      subject: `Reminder: ${title}`,
      html: `<p>Your manual reminder for <strong>${title}</strong> at ${scheduleTime}.</p>`,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Manual send failed:", error);
    res.status(500).json({ error: error.message });
  }
});