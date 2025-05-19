import type { User } from 'better-auth';
import mjml2html from "mjml";

export function userResetPasswordTemplate(user: User, url: string): string{
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
          Đặt lại mật khẩu của bạn
        </mj-text>
        <mj-text align="center">
          Chào ${user.name},<br />
          Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại Net Address.<br />
          Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu:
        </mj-text>
        <mj-button href="${url}" align="center">
          Đặt lại mật khẩu
        </mj-button>
        <mj-text align="center" color="#666666" font-size="14px">
          Nếu bạn không yêu cầu đặt lại mật khẩu này, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi ngay lập tức.
        </mj-text>
        <mj-text align="center" color="#666666" font-size="14px">
          Lưu ý: Liên kết này sẽ hết hạn sau 24 giờ.
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section>
      <mj-column>
        <mj-divider border-color="#0074d9" border-width="1px" />
        <mj-text align="center" color="#003366" font-size="14px">
          Mọi thắc mắc vui lòng liên hệ: <a href="mailto:support@mcmevn.com" style="color:#0074d9;">support@mcmevn.com</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`, {minify: true}).html;
}
