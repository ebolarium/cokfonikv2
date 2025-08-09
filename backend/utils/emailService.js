const nodemailer = require('nodemailer');

// Email transporter configuration
const createTransporter = () => {
  // Gmail için örnek konfigürasyon
  // Diğer email sağlayıcıları için farklı ayarlar kullanılabilir
  return nodemailer.createTransport({
    service: 'gmail', // Gmail kullanıyoruz
    auth: {
      user: process.env.EMAIL_USER, // Gmail adresi
      pass: process.env.EMAIL_PASSWORD // Gmail app password
    }
  });
};

// Alternatif olarak SMTP konfigürasyonu
const createSMTPTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Şifre sıfırlama maili gönder
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    const transporter = createTransporter();
    
    const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: {
        name: 'Çokfonik Koro',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Şifre Sıfırlama Talebi - Çokfonik',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center;">
            <h1>Çokfonik Koro</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2>Merhaba ${userName},</h2>
            
            <p>Hesabınız için şifre sıfırlama talebinde bulundunuz. Aşağıdaki bağlantıya tıklayarak şifrenizi sıfırlayabilirsiniz:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetURL}" 
                 style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Şifremi Sıfırla
              </a>
            </div>
            
            <p><strong>Önemli:</strong> Bu bağlantı güvenlik sebebiyle sadece 1 saat geçerlidir.</p>
            
            <p>Eğer şifre sıfırlama talebinde bulunmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
            
            <hr style="margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px;">
              Bu otomatik bir e-postadır, lütfen yanıtlamayın.<br>
              Sorunlarınız için: <a href="mailto:${process.env.EMAIL_USER}">${process.env.EMAIL_USER}</a>
            </p>
          </div>
        </div>
      `,
      text: `
        Merhaba ${userName},
        
        Hesabınız için şifre sıfırlama talebinde bulundunuz.
        
        Şifrenizi sıfırlamak için aşağıdaki bağlantıyı kullanın:
        ${resetURL}
        
        Bu bağlantı 1 saat geçerlidir.
        
        Eğer bu talebi yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
        
        --
        Çokfonik Koro
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Test email gönderimi
const sendTestEmail = async (email) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Çokfonik - Email Test',
      html: '<h1>Email sistemi çalışıyor!</h1><p>Bu bir test e-postasıdır.</p>',
      text: 'Email sistemi çalışıyor! Bu bir test e-postasıdır.'
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Test email error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendTestEmail
};