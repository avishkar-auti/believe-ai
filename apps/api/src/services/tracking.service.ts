import { emailLogRepository } from "../repositories/emailLog.repository.js";
import { contactRepository } from "../repositories/contact.repository.js";
import { unsubscribeRepository } from "../repositories/unsubscribe.repository.js";
import { NotFoundError } from "../errors/AppError.js";

/**
 * Open/click tracking is best-effort — many email clients block or proxy
 * pixels — so these calls never fail loudly, they just record what they can.
 */
export const trackingService = {
  async recordOpen(token: string): Promise<void> {
    await emailLogRepository.incrementOpen(token);
  },

  async recordClick(token: string): Promise<void> {
    await emailLogRepository.incrementClick(token);
  },

  async unsubscribeByToken(token: string): Promise<void> {
    const log = await emailLogRepository.findByTrackingToken(token);
    if (!log) throw new NotFoundError("Invalid or expired unsubscribe link");

    const userId = log.userId.toString();
    const contact = await contactRepository.findById(log.contactId.toString(), userId);
    if (!contact) return;

    await contactRepository.update(contact._id.toString(), userId, { subscribed: false });
    await unsubscribeRepository.add(userId, contact.email, "recipient unsubscribed via email link");
  },
};
