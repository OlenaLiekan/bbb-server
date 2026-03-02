const nodemailer = require('nodemailer');
const { PaymentInformation } = require('./models/models');
require('dotenv').config();

const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASSWORD;

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
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
  orderHTML,
  paymentList
) => {
  console.log('[sendEmail] sendEmailToClient called for order:', orderNumber);

  let refOptions = {
    where: {
      orderID: orderNumber,
      paymentMethod: 'REFERENCE',
      paymentStatus: 'Pending',
    },
  };

  let options = {
    where: {
      orderID: orderNumber,
      paymentStatus: 'Success',
    },
  };

  const resultRefOrder = await PaymentInformation.findOne(refOptions);
  const resultOrder = await PaymentInformation.findOne(options);
  const comfirmedOrder = resultOrder ? resultOrder : resultRefOrder;
  const duplicate = comfirmedOrder ? comfirmedOrder.sentToClient : null;

  if (!to || !name || !orderNumber) {
    const error = new Error('[sendEmail] sendEmailToClient missing required fields');
    console.error(error.message);
    if (comfirmedOrder) {
      let props = {};
      props = { ...props, sentToClient: 'Failed', sentToShop: 'Failed' };
      await PaymentInformation.update(props, options);
    } else {
      console.log(
        `[sendEmail] There is no order ${orderNumber} with a pending or successful status. Unable to update the status Failed for sentToClient and sentToShop columns.`
      );
    }
    throw error;
  }

  if (duplicate !== 'Success') {
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
                        <p style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>Data estimada de entrega: 1 a 2 dias úteis após o recebimento do pagamento da sua compra.</p>
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
                              ${orderHTML}
                            </div>                             
                        </div>
                    </div>
                </div>
            </div>
        `,
      };

      const info = await transporter.sendMail(message);
      console.log('E-mail enviado ao cliente:', info.messageId);

      if (comfirmedOrder) {
        let props = {};
        props = { ...props, sentToClient: 'Success' };
        await PaymentInformation.update(props, options);
      } else {
        console.log(
          `[sendEmail] There is no order ${orderNumber} with a pending or successful status. Unable to update the status Success for sentToClient column.`
        );
      }

      await sendEmailToStore(
        to,
        name,
        surname,
        orderNumber,
        company,
        address,
        comment,
        phone,
        orderHTML
      );
      return info;
    } catch (error) {
      console.error('Erro ao enviar e-mail para o cliente:', error);
      if (comfirmedOrder) {
        let props = {};
        props = { ...props, sentToClient: 'Failed' };
        await PaymentInformation.update(props, options);
      } else {
        console.log(
          `[sendEmailToClient] There is no order ${orderNumber} with a pending or successful status. Unable to update the status Failed for sentToClient column.`
        );
      }
      throw new Error('Email could not be sent to client');
    }
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
  console.log('[sendEmail] sendEmailToStore called for order:', orderNumber);

  let options = {
    where: {
      orderID: orderNumber,
      paymentStatus: 'Success',
    },
  };

  const successfulOrder = await PaymentInformation.findOne(options);
  const duplicate = successfulOrder ? successfulOrder.sentToShop : null;

  if (!to || !name || !orderNumber) {
    const error = new Error('[sendEmail] Store email missing required fields');
    console.error(error.message);
    if (successfulOrder) {
      let props = {};
      props = { ...props, sentToShop: 'Failed' };
      await PaymentInformation.update(props, options);
    } else {
      console.log(
        `[sendEmailToStore] There is no order ${orderNumber} with a successful status. Unable to update the status Failed for sentToShop column.`
      );
    }
    throw error;
  }

  if (duplicate !== 'Success') {
    try {
      const newOrder = {
        to: user,
        from: `Best Buy Beauty ${user}`,
        subject: `Novo pedido № ${orderNumber}`,
        html: `	<div style='background-color: #f6f6f6; padding: 30px;'>
                  <div style='letter-spacing: 0.5px; text-align: left; padding: 15px; background-color: #fff; width: 280px;'>
                    <h2 style='color: #252525;'>Olá, Svitlana!</h2>
                    <div>
                      <h3 style='color: #AD902B; border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>
                        Detalhes do novo pedido № ${orderNumber}
                      </h3> 
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
                    </div>
                  </div>
                </div>
            `,
      };
      const result = await transporter.sendMail(newOrder);
      console.log('E-mail enviado para a loja:', result.messageId);
      if (successfulOrder) {
        let props = {};
        props = { ...props, sentToShop: 'Success' };
        await PaymentInformation.update(props, options);
      } else {
        console.log(
          `[sendEmail] There is no order ${orderNumber} with a successful status. Unable to update the status Success for sentToShop column.`
        );
      }
    } catch (error) {
      console.error('Erro ao enviar e-mail para a loja:', error);
      if (successfulOrder) {
        let props = {};
        props = { ...props, sentToShop: 'Failed' };
        await PaymentInformation.update(props, options);
      } else {
        console.log(
          `[sendEmail] There is no order ${orderNumber} with a successful status. Unable to update the status Failed for sentToShop column.`
        );
      }
      throw new Error('Email could not be sent to store');
    }
  } else {
    console.log(
      `[sendEmail] A completed confirmation email for order ${orderNumber} has already been sent to the shop. The resend has been cancelled.`
    );
    return;
  }
};

function formatOrderToHTML(
  orderItems,
  totalCount,
  deliveryPrice,
  totalPrice,
  promocodeName,
  promocodeValue,
  promocodeBrandId
) {
  const formattedOrder = orderItems
    .map((item, index) => {
      let detailsHTML = '';

      const productImage = `<img style="width: 100%; height: 100%; border-radius: 10px; object-fit: cover;" src='https://res.cloudinary.com/bbbptcloud/image/upload/v1699129130/static/${item.img}' alt='product'/>`;

      const promoLine = `<div style="display: flex; align-items: center; gap: 5px; margin-top: 5px;">
                    <svg
                      style="width: 10px; height: 10px; transform: scaleX(-1); fill: #9e9e9eff;"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 512 512"
                    >
                      <path d="M0 252.118V48C0 21.49 21.49 0 48 0h204.118a48 48 0 0 1 33.941 14.059l211.882 211.882c18.745 18.745 18.745 49.137 0 67.882L293.823 497.941c-18.745 18.745-49.137 18.745-67.882 0L14.059 286.059A48 48 0 0 1 0 252.118zM112 64c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48z" />
                    </svg>
                    <span style="color: #5c5c5cff; font-size: 14px;">
                      ${promocodeName || ''}
                    </span>
                    <span style="color: #5c5c5cff; font-size: 14px;">
                      (-${(item.prevPrice * item.count - item.price * item.count).toFixed(2)} €)
                    </span>
                  </div>`;

      const discountPriceLine = `<div style="display: flex; align-items: center; gap: 5px; margin-top: 5px;">
                    <div style="display: flex; align-items: center; color: #AD902B; border: 1.2px solid #AD902B; font-size: 14px; padding: 3px 5px; border-radius: 5px; margin-right: 5px;">
                      -${(100 - (item.price / item.prevPrice) * 100).toFixed(0)}%
                    </div>
                    <span style="color: #5c5c5cff; font-size: 14px;">
                      (-${(item.prevPrice * item.count - item.price * item.count).toFixed(2)} €)
                    </span>
                  </div>`;

      if (item.isLashes && !item.kitId) {
        detailsHTML += `<span style="color: #666666; font-size: 12px; line-height: 1.4;">
        ${item.curlArr || ''}${item.curlArr && (item.thicknessArr || item.lengthArr) ? ' / ' : ''}
        ${item.thicknessArr ? item.thicknessArr + ' mm' : ''}${
          item.thicknessArr && item.lengthArr ? ' / ' : ''
        }
        ${item.lengthArr ? item.lengthArr + ' mm' : ''}
        </span><br>`;
      }

      if (item.info && Object.keys(item.info).length > 0) {
        let values = [];
        Object.entries(item.info).forEach(([key, value]) => {
          values.push(value);
        });
        detailsHTML = values ? values.join(' / ') : '';
      }

      const productHTML = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif;">
        <tr>
          <td width="10%" style="vertical-align: top; padding-top: 5px;">
            <div style="position: relative; width: 45px; height: 45px; border-radius: 10px; background-color: #ffffff; margin-right: 10px; overflow: hidden;">
              ${item.img ? productImage : ''}            
            </div>
          </td>
          <td width="58%" style="vertical-align: top; padding: 5px 0;">
            <div style="font-size: 14px; color: #252525; margin-bottom: 4px; text-align: left;">
              <b>${item.name} ${item.company}</b>
              <b style="white-space: nowrap;"> (${item.code}) x ${item.count}</b>
            </div>
            <div style="color: #666666; font-size: 12px; line-height: 1.4; text-align: left;">
              ${detailsHTML || ''}
            </div>
            ${
              item.prevPrice - item.price > 0 &&
              item.promocodeAllowed &&
              promocodeValue &&
              promocodeName &&
              (promocodeBrandId > 0 ? item.brandId == promocodeBrandId : promocodeBrandId == 0)
                ? promoLine
                : item.prevPrice - item.price > 0
                  ? discountPriceLine
                  : ''
            }
          </td>
          <td width="32%" style="vertical-align: top; text-align: right;">
            <div style="padding-top: 5px;">
              <div style="font-size: 16px; color: #252525; margin-bottom: 4px;">
                <b>${(item.price * item.count).toFixed(2)} €</b>
              </div>
              <div style="font-size: 14px; color: #939393; text-decoration: line-through;">
                <b>
                  ${
                    item.prevPrice - item.price > 0
                      ? (Number(item.prevPrice) * item.count).toFixed(2) + ' €'
                      : ''
                  }
                </b>
              </div>
            </div>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 15px 0;">
        <tr>
          <td height="1" bgcolor="#eeeeee" style="font-size: 1.5px; line-height: 1px;">&nbsp;</td>
        </tr>
      </table>`;

      return productHTML;
    })
    .join('');

  const orderSummary = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; margin-top: 20px;">
      <tr>
        <td style="padding-bottom: 10px;">
          <b style="font-size: 110%;">
            <span style="padding-right: 10px;">Quantidade total:</span>
            ${totalCount}
          </b>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 10px;">
          <b style="font-size: 110%;">
            <span style="padding-right: 10px;">Custo de entrega:</span>
            ${deliveryPrice} €
          </b>
        </td>
      </tr>
      ${
        promocodeName && promocodeValue
          ? `
      <tr>
        <td style="padding-bottom: 10px;">
          <b style="font-size: 110%; color: #AD902B;">
            <span style="padding-right: 10px;">Desconto:</span>
            - ${promocodeValue}% ${promocodeName}
          </b>
        </td>
      </tr>
      `
          : ''
      }
      <tr>
        <td style="padding-top: 10px; border-top: 1px solid #eeeeee;">
          <b style="font-size: 125%; color: #AD902B;">
            <span style="padding-right: 10px;">Valor total:</span>
            ${totalPrice} €
          </b>
        </td>
      </tr>
    </table>`;

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
  console.log('[sendEmail] sendCompletedEmail called for order:', orderNumber);

  let refOptions = {
    where: {
      orderID: orderNumber,
      paymentMethod: 'REFERENCE',
      paymentStatus: 'Pending',
    },
  };

  let options = {
    where: {
      orderID: orderNumber,
      paymentStatus: 'Success',
    },
  };

  const completedResult = await PaymentInformation.findOne(options);
  const completedRefResult = await PaymentInformation.findOne(refOptions);
  const existingOrder = completedResult ? completedResult : completedRefResult;
  const duplicate = existingOrder ? existingOrder.sentToClient : null;

  if (!to || !name || !orderNumber || !paymentStatus) {
    const error = new Error('[sendEmail] Completed email missing required fields');
    console.error(error.message);
    if (existingOrder) {
      let props = {};
      props = { ...props, sentToClient: 'Failed', sentToShop: 'Failed' };
      await PaymentInformation.update(props, options);
    } else {
      console.log(
        `[sendCompletedEmail] There is no order ${orderNumber} with a pending or successful status. Unable to update the status Failed for sentToClient column.`
      );
    }
    throw error;
  }

  if (duplicate !== 'Success') {
    let paymentList;

    if (paymentStatus.paymentMethod === 'CARD') {
      paymentList = `Cartão de multibanco. Valor total: ${paymentStatus.amount.value} €`;
    } else if (paymentStatus.paymentMethod === 'MBWAY') {
      paymentList = `MBWay. Número de telefone: ${paymentStatus.token.value}. Valor total: ${paymentStatus.amount.value} €`;
    } else if (paymentStatus.paymentMethod === 'REFERENCE') {
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
                            <p style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>Data estimada de entrega: 1 a 2 dias úteis após o recebimento do pagamento da sua compra.</p>
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
      console.log('E-mail enviado ao cliente:', info.messageId);

      if (existingOrder) {
        let props = {};
        props = { ...props, sentToClient: 'Success' };
        await PaymentInformation.update(props, options);
      } else {
        console.log(
          `[sendEmail] There is no order ${orderNumber}. Unable to update the status Success for sentToClient column.`
        );
      }

      if (paymentStatus.paymentStatus === 'Success') {
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
      console.error('Erro ao enviar e-mail para o cliente:', error);
      if (existingOrder) {
        let props = {};
        props = { ...props, sentToClient: 'Failed' };
        await PaymentInformation.update(props, options);
      } else {
        console.log(
          `[sendEmail] There is no order ${orderNumber}. Unable to update the status Failed for sentToClient column.`
        );
      }
      throw new Error('Email could not be sent to client');
    }
  } else {
    console.log(
      `[sendEmail] A completed confirmation email for order ${orderNumber} has already been sent to the client. The resend has been cancelled.`
    );
    return;
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
  paymentStatus,
  orderHTML
) => {
  console.log('[sendEmail] referencePaidEmail called for order:', orderNumber);

  let options = {
    where: {
      orderID: orderNumber,
      paymentStatus: 'Success',
    },
  };

  const successfulReference = await PaymentInformation.findOne(options);
  const duplicate = successfulReference ? successfulReference.sentReferencePaid : null;

  if (!to || !name || !orderNumber) {
    const error = new Error('[sendEmail] Reference paid email missing required fields');
    console.error(error.message);
    if (successfulReference) {
      let props = {};
      props = { ...props, sentReferencePaid: 'Failed' };
      await PaymentInformation.update(props, options);
    } else {
      console.log(
        `[referencePaidEmail] There is no order ${orderNumber} with a successful status. Unable to update the status Failed for sentReferencePaid column.`
      );
    }
    throw error;
  }

  if (duplicate !== 'Success') {
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
                      <p>${company ? company : ''}</p>
                      <p>${address}</p>
                      <p>Tel. ${phone}</p>
                      <p>E-mail: ${to}</p>
                      <p style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>Um comentário: ${
                        comment ? comment : 'Sem comentários'
                      }</p>
                      <div style='border-bottom: 2px solid #f6f6f6; padding: 0 0 20px 0;'>
                        ${orderHTML}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `,
      };

      const info = await transporter.sendMail(message);
      console.log('E-mail enviado ao cliente:', info.messageId);
      if (successfulReference) {
        let props = {};
        props = { ...props, sentReferencePaid: 'Success' };
        await PaymentInformation.update(props, options);
      } else {
        console.log(
          `[sendEmail] There is no order ${orderNumber} with a successful status. Unable to update the status Success for sentReferencePaid column.`
        );
      }
    } catch (error) {
      console.error('Erro ao enviar e-mail para o cliente:', error);
      if (successfulReference) {
        let props = {};
        props = { ...props, sentReferencePaid: 'Failed' };
        await PaymentInformation.update(props, options);
      } else {
        console.log(
          `[sendEmail] There is no order ${orderNumber} with a successful status. Unable to update the status Failed for sentReferencePaid column.`
        );
      }
      throw new Error('Email could not be sent to client');
    }
  } else {
    console.log(
      `[sendEmail] A successful reference payment confirmation email for order ${orderNumber} has already been sent to the client. The resend has been cancelled.`
    );
    return;
  }
};

module.exports = {
  sendEmailToClient,
  sendCompletedEmail,
  sendEmailToStore,
  formatOrderToHTML,
  referencePaidEmail,
};
