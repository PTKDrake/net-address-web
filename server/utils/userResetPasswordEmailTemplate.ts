import type { User } from 'better-auth';
import mjml2html from "mjml";

export function userResetPasswordTemplate(user: User, url: string): string{
    return mjml2html(`<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Arial, Helvetica, sans-serif" />
      <mj-section background-color="#fef2f2" />
      <mj-text color="#7f1d1d" font-size="16px" />
      <mj-button background-color="#dc2626" color="#ffffff" border-radius="4px" font-size="18px" padding="20px" />
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
        <mj-text align="center" font-size="22px" font-weight="bold" color="#dc2626">
          Reset Your Password
        </mj-text>
        <mj-text align="center">
          Hello ${user.name},<br />
          We received a request to reset your password for your Net Address account.<br />
          Please click the button below to reset your password:
        </mj-text>
        <mj-button href="${url}" align="center">
          Reset Password
        </mj-button>
        <mj-text align="center" color="#666666" font-size="14px">
          This link will expire in 1 hour for security reasons.<br />
          If you did not request this password reset, please ignore this email or contact us immediately.
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section>
      <mj-column>
        <mj-divider border-color="#dc2626" border-width="1px" />
        <mj-text align="center" color="#7f1d1d" font-size="14px">
          For any questions, please contact: <a href="mailto:support@mcmevn.com" style="color:#dc2626;">support@mcmevn.com</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`, {minify: true}).html;
}
