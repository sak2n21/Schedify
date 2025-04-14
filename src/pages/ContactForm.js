// ContactForm.js
import React, { useRef } from "react";
import emailjs from "@emailjs/browser";

const ContactForm = () => {
  const form = useRef();

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs.sendForm(
      "service_bg6rz7h",     // Replace with your Service ID
      "template_qivxbyh",    // Replace with your Template ID
      form.current,
      "wcwEuLp9fqmUlhoXd"      // Replace with your Public Key
    ).then(
      (result) => {
        console.log("Email sent:", result.text);
        alert("Message sent successfully!");
        form.current.reset(); // Clear form
      },
      (error) => {
        console.error("Error:", error.text);
        alert("Oops! Something went wrong.");
      }
    );
  };

  return (
    <form ref={form} onSubmit={sendEmail}>
      <label>Name</label>
      <input type="text" name="user_name" required />

      <label>Email</label>
      <input type="email" name="user_email" required />

      <label>Message</label>
      <textarea name="message" required />

      <button type="submit">Send</button>
    </form>
  );
};

export default ContactForm;
