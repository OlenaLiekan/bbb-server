const nodemailer = require('nodemailer');
require('dotenv').config();

const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASSWORD;

const sendPromocode = async (to, name, promocode, promocodeValue) => {
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
      subject: `Desconto ${promocodeValue}% no primeiro pedido`,
      html: `
        <div style='background-color: #f6f6f6; padding: 30px 0;'>
            <div style='letter-spacing: 0.5px; text-align: center; padding: 15px; background-color: #fff; width: 280px; margin: auto;'>
                <h2 style='color: #252525;'>
                    Olá, ${name}!
                </h2>
                <div>
                    <h4 style='color: #AD902B;'>
                        Obrigado por se cadastrar em nosso site!
                    </h4>                        
                    <p style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>
                        Seu presente de registro é um código promocional com 5% de desconto no seu primeiro pedido:
                    </p>
                    <h3 style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>
                        ${promocode}
                    </h3>
                    <p>
                        Use-o ao fazer seu pedido.
                    </p>
                    <p>
                        Acesse sua conta para fazer compras:
                    </p>
                    <a href="https://best-buy-beauty.com/#/login">
                        Vá para a página de login
                    </a>
                    <p>
                        O código promocional só pode ser usado uma vez.
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

module.exports = sendPromocode;
