import * as nodemailer from 'nodemailer';
import type {User} from 'better-auth';
import {userVerificationTemplate} from "./userVerificationEmailTemplate";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendSmtpMail({ to, subject, html, from }: MailOptions) {
  await transporter.sendMail({
    from: from || process.env.EMAIL_FROM || 'MEStudio <noreply@mcmevn.com>',
    to,
    subject,
    html,
  });
}

export async function sendUserVerificationEmail(user: User, url: string){
  const email = userVerificationTemplate(user, url);
  await sendSmtpMail({
    to: user.email,
    subject: 'Verify your email',
    html: email,
  });
}

export async function sendUserResetPasswordEmail(user: User, url: string){
  const email = userResetPasswordTemplate(user, url);
  await sendSmtpMail({
    to: user.email,
    subject: 'Reset your password',
    html: email,
  });
}
