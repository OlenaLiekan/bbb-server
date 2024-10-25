const nodemailer = require("nodemailer");
require("dotenv").config();

const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASSWORD;

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user,
    pass,
  },
});

const sendEmailToClient = async (
  to,
  name,
  surname,
  orderNumber,
  company,
  address,
  postalCode,
  comment,
  phone,
  order,
  paymentList
) => {
  try {
    const message = {
      to,
      from: `Best Buy Beauty ${user}`,
      subject: `Detalhes do novo pedido № ${orderNumber}`,
      html: `
            <div style='background-color: #f6f6f6; padding: 30px 0;'>
                <div style='letter-spacing: 0.5px; text-align: center; padding: 15px; background-color: #fff; width: 280px; margin: auto;'>
                    <h2 style='color: #252525;'>Olá, ${name}!</h2>
                    <div>
                        <h3 style='color: #AD902B;'>Obrigado pela sua compra!</h3>                        
                        <p>Começaremos a preparar o seu pedido logo que recebermos a confirmação do pagamento.</p>
                        <p>Estes são os dados de que precisa para concluir a compra num multibanco ou online.</p>
                        <p style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>Método de pagamento na sua escolha:</p>
                        <div style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>
                            ${paymentList}
                        </div>
                        <p>Tenha presente que terá de realizar o pagamento no máximo <b>de 3 dias</b> corridos.</p>
                        <p>Após o pagamento deverá enviar um <b>comprovativo de pagamento</b> em resposta a esta carta ou para o email <b>bestbuybeauty.pt@gmail.com</b> indicando o número de pedido.</p>
                        <p style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>Data de entrega estimada 1 dia útil. Após recebermos o pagamento da compra.</p>
                        <h3 style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>Dados do pedido</h3>
                        <div>
                            <div style='padding-bottom: 15px; font-size: 120%;'>
                                <b><span style='padding-right: 10px;'>№ de pedido:</span> ${orderNumber}</b>
                            </div>
                            <div>
                                <b>Envio para o domicílio</b>
                            </div>
                            <p>${name} ${surname}</p>
                            <p>${company}</p>
                            <p>${address}</p>
                            <p>${postalCode}</p>
                            <p>Tel. ${phone}</p>
                            <p>E-mail ${to}</p>
                            <p style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>Um comentário: ${comment}</p>
                            <div style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>
                                ${order}
                            </div>                             
                        </div>
                    </div>
                </div>
            </div>
        `,
    };

    const info = await transporter.sendMail(message);
    console.log("E-mail enviado ao cliente:", info.messageId);

    await sendEmailToStore(
      to,
      name,
      surname,
      orderNumber,
      company,
      address,
      comment,
      phone,
      order
    );
  } catch (error) {
    console.error("Erro ao enviar e-mail para o cliente:", error);
    throw new Error("Email could not be sent to client");
  }
};

const sendEmailToStore = async (
  to,
  name,
  surname,
  orderNumber,
  company,
  address,
  comment,
  phone,
  order
) => {
  try {
    const newOrder = {
      to: user,
      from: `Best Buy Beauty ${user}`,
      subject: `Novo pedido № ${orderNumber}`,
      html: `			
            <h2 style='color: #252525;'>Olá, Svitlana!</h2>
            <h3 style='color: #AD902B; border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>Detalhes do novo pedido № ${orderNumber}</h3> 
            <div>
                <b>Envio para o domicílio</b>
            </div>
            <p>${name} ${surname}</p>
            <p>${company}</p>
            <p>${address}</p>
            <p>Tel. ${phone}</p>
            <p>E-mail ${to}</p>
            <p style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>Um comentário: ${comment}</p>
            <div style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>${order}</div>
        `,
    };
    const result = await transporter.sendMail(newOrder);
    console.log("E-mail enviado para a loja:", result.messageId);
  } catch (error) {
    console.error("Erro ao enviar e-mail para a loja:", error);
    throw new Error("Email could not be sent to store");
  }
};

function formatOrderToHTML(orderItems, totalCount, deliveryPrice, totalPrice) {
  const formattedOrder = orderItems
    .map((item, index) => {
      return (
        (index > 0 ? "<br><br>" : "") +
        "<b>" +
        (index + 1) +
        ". " +
        item.name +
        "</b><br>Marca: " +
        item.company +
        "<br>Código: " +
        item.code +
        "<br>" +
        (item.curlArr ? "Curvatura: " + item.curlArr + "<br>" : "") +
        (item.thicknessArr
          ? "Grossura: " + item.thicknessArr + " mm<br>"
          : "") +
        (item.lengthArr ? "Tamanho: " + item.lengthArr + " mm<br>" : "") +
        (!item.isLashes && item.info && Array.isArray(item.info)
          ? item.info
              .map((obj) => obj.title + ": " + obj.description + "<br>")
              .join("")
          : "") +
        "Preço: " +
        item.price +
        " €<br>" +
        "Quantidade: " +
        item.count
      );
    })
    .join("");

  const orderSummary =
    '<br><br><b style="font-size: 110%; padding-bottom: 20px;"><span style="padding-right: 10px;">Quantidade total: </span>' +
    totalCount +
    '</b><br><b style="font-size: 110%; padding-bottom: 20px;"><span style="padding-right: 10px;">Custo de entrega: </span>' +
    deliveryPrice +
    " €</b>" +
    '<br><br><b style="font-size: 125%; color: #AD902B; padding-bottom: 20px;"><span style="padding-right: 10px;">Valor total: </span>' +
    (parseFloat(totalPrice) + parseFloat(deliveryPrice)).toFixed(2) +
    " €</b>";

  return formattedOrder + orderSummary;
}

const sendCompletedEmail = async (
  to,
  name,
  surname,
  orderNumber,
  company,
  address,
  comment,
  phone,
  order,
  paymentStatus
) => {
  let paymentList;

  if (paymentStatus.paymentMethod === "CARD") {
    paymentList = `Cartão de multibanco. Valor total: ${paymentStatus.amount.value} €`;
  } else if (paymentStatus.paymentMethod === "MBWAY") {
    paymentList = `MBWay. Número de telefone: ${paymentStatus.token.value}. Valor total: ${paymentStatus.amount.value} €`;
  } else if (paymentStatus.paymentMethod === "REFERENCE") {
    paymentList = `
        <p>Referência de multibanco: </p>
        <p>Entidade: ${paymentStatus.paymentReference.entity} </p>
        <p>Referência: ${paymentStatus.paymentReference.reference} </p>
        <p>Valor: ${paymentStatus.amount.value} € </p>
        <p>Começaremos a preparar o seu pedido logo que recebermos a confirmação do pagamento.</p>
        <p>Você no maximo, 3 dias para poder efetuar o pagamento</p>`;
  } else {
    paymentList = `Método de pagamento não especificado. Valor total: ${paymentStatus.amount.value} €`;
  }

  try {
    const message = {
      to,
      from: `Best Buy Beauty ${user}`,
      subject: `Detalhes do novo pedido № ${orderNumber}`,
      html: `
            <div style='background-color: #f6f6f6; padding: 30px 0;'>
                <div style='letter-spacing: 0.5px; text-align: center; padding: 15px; background-color: #fff; width: 280px; margin: auto;'>
                    <h2 style='color: #252525;'>Olá, ${name}!</h2>
                    <div>
                        <h3 style='color: #AD902B;'>Obrigado pela sua compra!</h3>                        
                        <p style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>Dados de pagamento:</p>
                        <div style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>
                            ${paymentList}
                        </div>
                        <p style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>Data de entrega estimada 1 dia útil.</p>
                        <h3 style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>Dados do pedido</h3>
                        <div>
                            <div style='padding-bottom: 15px; font-size: 120%;'>
                                <b><span style='padding-right: 10px;'>№ de pedido:</span> ${orderNumber}</b>
                            </div>
                            <div>
                                <b>Envio para o domicílio</b>
                            </div>
                            <p>${name} ${surname}</p>
                            <p>${company}</p>
                            <p>${address}</p>
                            <p>Tel. ${phone}</p>
                            <p>E-mail ${to}</p>
                            <p style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>Um comentário: ${comment}</p>
                            <div style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>
                                ${order}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
    };

    const info = await transporter.sendMail(message);
    console.log("E-mail enviado ao cliente:", info.messageId);

    if (paymentStatus.paymentStatus === "Success") {
      await sendEmailToStore(
        to,
        name,
        surname,
        orderNumber,
        company,
        address,
        comment,
        phone,
        order
      );
    }
  } catch (error) {
    console.error("Erro ao enviar e-mail para o cliente:", error);
    throw new Error("Email could not be sent to client");
  }
};

const referencePaidEmail = async (
  to,
  name,
  surname,
  orderNumber,
  company,
  address,
  comment,
  phone,
  paymentStatus
) => {
  let paymentList = `
      <p><b>Status do pagamento:</b> ${paymentStatus}</p>
      <p><b>Método de pagamento:</b> Referência</p>
    `;

  try {
    const message = {
      to,
      from: `Best Buy Beauty <no-reply@bestbuybeauty.com>`,
      subject: `Pagamento efetuado com sucesso`,
      html: `
          <div style='background-color: #f6f6f6; padding: 30px 0;'>
            <div style='letter-spacing: 0.5px; text-align: center; padding: 15px; background-color: #fff; width: 280px; margin: auto;'>
              <h2 style='color: #252525;'>Olá, ${name}!</h2>
              <div>
                <h3 style='color: #AD902B;'>O pagamento foi efetuado com sucesso!</h3>
                <p style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>O pagamento do seu pedido foi confirmado:</p>
                <div style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>
                  ${paymentList}
                </div>
                <h3 style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>Dados do pedido</h3>
                <div>
                  <div style='padding-bottom: 15px; font-size: 120%;'>
                    <b><span style='padding-right: 10px;'>№ de pedido:</span> ${orderNumber}</b>
                  </div>
                  <div>
                    <b>Envio para o domicílio</b>
                  </div>
                  <p>${name} ${surname}</p>
                  <p>${company ? company : ""}</p>
                  <p>${address}</p>
                  <p>Tel. ${phone}</p>
                  <p>E-mail: ${to}</p>
                  <p style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>Um comentário: ${
                    comment ? comment : "Sem comentários"
                  }</p>
                </div>
              </div>
            </div>
          </div>
        `,
    };

    const info = await transporter.sendMail(message);
    console.log("E-mail enviado ao cliente:", info.messageId);
  } catch (error) {
    console.error("Erro ao enviar e-mail para o cliente:", error);
    throw new Error("Email could not be sent to client");
  }
};

module.exports = { sendEmailToClient, sendCompletedEmail, sendEmailToStore, formatOrderToHTML, referencePaidEmail };