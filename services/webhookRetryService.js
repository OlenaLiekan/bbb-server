const { PendingWebhook } = require('../models/models');
const { Op } = require('sequelize');
const { processWebhook } = require('./webhookProcessor');

async function retryPendingWebhooks() {
  try {
    console.log('[webhookRetryService] Starting retry of pending webhooks...');

    const pendingWebhooks = await PendingWebhook.findAll({
      where: { processedAt: null, retryCount: { [Op.lt]: 3 } },
    });

    console.log(`[webhookRetryService] Found ${pendingWebhooks.length} pending webhooks to retry`);

    for (const webhook of pendingWebhooks) {
      try {
        console.log(
          `[webhookRetryService] Processing webhook ${webhook.transactionID}, attempt ${
            webhook.retryCount + 1
          }`
        );

        await processWebhook(JSON.parse(webhook.payload));
        await webhook.destroy(); // Delete if successful

        console.log(
          `[webhookRetryService] Webhook ${webhook.transactionID} processed successfully`
        );
      } catch (error) {
        webhook.retryCount += 1;
        webhook.lastError = error.message;
        await webhook.save();

        console.error(
          `[webhookRetryService] Failed to process webhook ${webhook.transactionID}:`,
          error.message
        );
      }
    }
    console.log('[webhookRetryService] Pending webhooks retry completed');
  } catch (error) {
    console.error('[webhookRetryService] Error in retryPendingWebhooks service:', error);
  }
}

module.exports = { retryPendingWebhooks };
