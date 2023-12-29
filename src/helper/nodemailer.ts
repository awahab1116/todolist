import nodemailer from "nodemailer";
import * as dotenv from "dotenv";
import logger from "../Logger";
dotenv.config();

interface MAILDETAILS {
  to: string[] | string;
  subject: string;
  text: string;
}

//Function to send emails using nodemailer
const sendEmail = async (mailDetails: MAILDETAILS) => {
  //Initializing transport for nodemailer which uses email service and auth credentials
  const mailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASSWORD,
    },
    //using this tls because getting a error of certificates when trying to send email
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
    logger!.error("Error in email sending service", err);
  }
};

export default sendEmail;
