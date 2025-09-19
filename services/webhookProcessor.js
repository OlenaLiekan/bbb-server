const { processPaymentWebhook } = require('./paymentService');

async function processWebhook(webhookModel) {
  try {
    console.log(`[webhookProcessor] Processing webhook from retry: ${webhookModel.transactionID}`);

    await processPaymentWebhook(webhookModel);

    console.log(`[webhookProcessor] Webhook processed successfully: ${webhookModel.transactionID}`);
    return { success: true };
  } catch (error) {
    console.error(
      `[webhookProcessor] Error processing webhook ${webhookModel.transactionID}:`,
      error.message
    );

    throw error;
  }
}

module.exports = { processWebhook };
