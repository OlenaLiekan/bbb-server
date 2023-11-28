const nodemailer = require('nodemailer');

const sendEmail = async (to, name, surname, orderNumber, address, phone, order, paymentList) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'melioraspero24@gmail.com',
        pass: 'dsocxlxfbqfzorvw',
      },
    });
    const message = {
      to,
      subject: `Detalhes do novo pedido № ${orderNumber}`,
      html: `
          <div style='letter-spacing: 0.5px;'>
			<h2 style='color: #252525;'>
              Olá, ${name}!
            </h2>
            <div>
              <h3 style='color: #AD902B;'>
                  Obrigado pela sua compra!
              </h3>                        
              <p>
                  Começaremos a preparar o seu pedido logo que recebermos a confirmação do pagamento.
              </p>
              <p style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>
                  Estes são os dados de que precisa para concluir a compra num multibanco ou online:
              </p>
              <div style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>
                  ${paymentList}
              </div>
              <p>
                  Tenha presente que terá de realizar o pagamento no máximo <b>de 3 dias</b> corridos. Caso contrário, o seu pedido será cancelado.
              </p>
              <p>
                Após o pagamento deverá enviar um texto de confirmação de pagamento em resposta a esta carta ou para o email <b>bestbuybeauty.pt@gmail.com</b> indicando o número da encomenda.
              </p>
              <p style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>
                  Data de entrega estimada 1-5 dias úteis. Após recebermos o pagamento da compra.   
              </p>
              <h3>
                  Dados do pedido
              </h3>
              <div>
                  <div style='padding-bottom: 15px;'>
                      <div>
                          <b>№ de pedido:</b> ${orderNumber}
                      </div>
                  </div>
                  <div>
                      <div>
                          <b>Envio para o domicílio</b>
                      </div>
                  </div>
                  <p>
                      ${name} ${surname}
                  </p>
                  <p>
                      ${address}
                  </p>
                  <p style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>
                      Tel. ${phone}
                  </p>
                  <div>
                  ${order}
                  </div>                             
              </div>
          </div>
      `,
    };
    const newOrder = {
      to: 'melioraspero24@gmail.com',
      subject: `Novo pedido № ${orderNumber}`,
      html: `			
            <h2 style='color: #252525;'>
                Olá, Svitlana!
            </h2>
            <h3 style='color: #AD902B;'>
                Detalhes do novo pedido № ${orderNumber}
            </h3> 
            <div>
                <div>
                    <b>Envio para o domicílio</b>
                </div>
            </div>
            <p>
                ${name} ${surname}
            </p>
            <p>
                ${address}
            </p>
            <p style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>
                Tel. ${phone}
            </p>
            <div>
            ${order}
            </div>
        `,
    };
    const info = await transporter.sendMail(message);
    const result = await transporter.sendMail(newOrder);
    console.log(('Messages sent', info.messageId, result.messageId));
  } catch (error) {
    console.log(error);
    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;
