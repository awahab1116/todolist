import nodemailer from "nodemailer";
import * as dotenv from "dotenv";
dotenv.config();

interface MAILDETAILS {
  to: string[] | string;
  subject: string;
  text: string;
}

const sendEmail = async (mailDetails: MAILDETAILS) => {
  console.log("Recipents are ", mailDetails);
  const mailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // This line allows self-signed certificates
    },
  });

  try {
    const data = await mailTransporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      ...mailDetails,
    });
    console.log("Email sent successfully:", data);
  } catch (err) {
    console.error("Error Occurs:", err);
  }
};

export default sendEmail;
