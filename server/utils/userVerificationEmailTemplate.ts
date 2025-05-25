import type { User } from 'better-auth';
import mjml2html from "mjml";

export function userVerificationTemplate(user: User, url: string): string{
    return mjml2html(`<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Arial, Helvetica, sans-serif" />
      <mj-section background-color="#e6f0fa" />
      <mj-text color="#003366" font-size="16px" />
      <mj-button background-color="#0074d9" color="#ffffff" border-radius="4px" font-size="18px" padding="20px" />
    </mj-attributes>
  </mj-head>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-image width="100px" src="https://yourdomain.com/logo.png" alt="Logo" align="center" />
      </mj-column>
    </mj-section>
    <mj-section>
      <mj-column>
        <mj-text align="center" font-size="22px" font-weight="bold" color="#0074d9">
          Verify Your Email
        </mj-text>
        <mj-text align="center">
          Hello ${user.name},<br />
          Thank you for registering an account with Net Address.<br />
          Please click the button below to verify your email address:
        </mj-text>
        <mj-button href="${url}" align="center">
          Verify Now
        </mj-button>
        <mj-text align="center" color="#666666" font-size="14px">
          If you did not request this email, please ignore it.
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section>
      <mj-column>
        <mj-divider border-color="#0074d9" border-width="1px" />
        <mj-text align="center" color="#003366" font-size="14px">
          For any questions, please contact: <a href="mailto:support@mcmevn.com" style="color:#0074d9;">support@mcmevn.com</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`, {minify: true}).html;
}