import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  try {
    const { fullName, email, phone, subject, message } = await req.json()

    // 1. Setup the email transporter using Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
    })

    // 2. Format the email going to YOU (The Admin)
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: 'recitaladmin@gmail.com', 
      replyTo: email, // If you hit "Reply", it goes to the user
      subject: `SUPPORT TICKET: ${subject} (From: ${fullName})`,
      html: `
        <h2>New Support Request from the Muwatta Recital Portal</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <hr />
        <h3>Subject: ${subject}</h3>
        <p style="white-space: pre-wrap;">${message}</p>
      `,
    }

    // 3. Format the confirmation email going to the USER
    const userMailOptions = {
      from: `"Muwatta Recital Support" <${process.env.EMAIL_USER}>`,
      to: email, // The user's email address from the form
      subject: `Confirmation: We received your support request`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #630a38;">Support Request Received</h2>
          <p>Dear ${fullName},</p>
          <p>Thank you for reaching out. This is an automated email to confirm that we have successfully received your message.</p>
          <p>Our team will review your request and get back to you as soon as possible.</p>
          
          <div style="background-color: #f9fafb; border-left: 4px solid #dfc063; padding: 15px; margin: 20px 0;">
            <p style="margin-top: 0;"><strong>Your Message Details:</strong></p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p style="white-space: pre-wrap; margin-bottom: 0;">${message}</p>
          </div>

          <p>Best regards,<br/><strong>Muwatta Recital Support Team</strong></p>
        </div>
      `,
    }

    // 4. Send BOTH emails simultaneously using Promise.all
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(userMailOptions)
    ])

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Support Email Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send email. Please try again later.' },
      { status: 500 }
    )
  }
}