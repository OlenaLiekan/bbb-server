const nodemailer = require('nodemailer');
require('dotenv').config();

const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASSWORD;

const sendNewPass = async (to, name, newPassword) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user,
        pass,
      },
    });
    const message = {
      to,
      from: `Best Buy Beauty ${user}`,
      subject: `Solicitação de alteração de palavra-passe`,
      html: `
        <div style='background-color: #f6f6f6; padding: 30px 0;'>
            <div style='letter-spacing: 0.5px; text-align: center; padding: 15px; background-color: #fff; width: 280px; margin: auto;'>
                <h2 style='color: #252525;'>
                    Olá, ${name}!
                </h2>
                <div>
                    <h4 style='color: #AD902B;'>
                        Você recebeu este e-mail porque solicitou a alteração da palavra-passe da sua conta.
                    </h4>                        
                    <p style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>
                        Este e-mail fornece uma nova palavra-passe:
                    </p>
                    <h3 style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>
                        ${newPassword}
                    </h3>
                    <p>
                        Use-o para fazer login em sua conta.
                    </p>
                    <a href="https://best-buy-beauty.com/#/login">
                        Vá para a página de login
                    </a>
                    <p>
                        Você sempre pode alterá-lo posteriormente em sua conta pessoal.
                    </p>
                </div>    
            </div>
        </div>
        `,
    };

    const info = await transporter.sendMail(message);

    console.log(('Message sent', info.messageId));
  } catch (error) {
    console.log(error);
    throw new Error('Email could not be sent');
  }
};

module.exports = sendNewPass;
