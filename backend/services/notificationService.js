const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Send notification for Quote or NDA actions (Created / Updated)
 *
 * Requirements:
 * - Send to all users with Admin role
 * - Send to the Manager of the user who created/updated the document
 * - Deduplicate if the Manager is also an Admin
 * - Store notification type, message, related Quote/NDA ID, recipient, read/unread status, and created date
 * - Safe and asynchronous (does not throw or break the caller request)
 */
async function sendDocumentNotification({
  type, // 'QUOTE_CREATED' | 'QUOTE_UPDATED' | 'NDA_CREATED' | 'NDA_UPDATED'
  title,
  message,
  relatedType, // 'Quote' | 'Nda'
  refId = '',
  relatedDocId = null,
  actorUser = null, // { _id, name, email }
  creatorId = null
}) {
  try {
    const recipientIdSet = new Set();

    // 1. Find all Admin users
    const admins = await User.find({
      role: 'Admin',
      status: { $ne: 'Inactive' }
    }).select('_id email name');

    admins.forEach(admin => {
      recipientIdSet.add(admin._id.toString());
    });

    // 2. Find Manager of the creator
    const effectiveCreatorId = creatorId || actorUser?._id;
    if (effectiveCreatorId) {
      const creator = await User.findById(effectiveCreatorId);
      if (creator) {
        // Check reportingManagers array on creator
        if (Array.isArray(creator.reportingManagers) && creator.reportingManagers.length > 0) {
          const managerQueries = [];
          
          creator.reportingManagers.forEach(rm => {
            if (rm.id) managerQueries.push({ _id: rm.id });
            if (rm.email) managerQueries.push({ email: rm.email.toLowerCase().trim() });
          });

          if (managerQueries.length > 0) {
            const managers = await User.find({
              $or: managerQueries,
              status: { $ne: 'Inactive' }
            }).select('_id email name');

            managers.forEach(m => {
              recipientIdSet.add(m._id.toString());
            });
          }
        }

        // Also check if any User has this creator in their managed subordinates
        const managersReportingTo = await User.find({
          role: 'Manager',
          status: { $ne: 'Inactive' },
          $or: [
            { 'reportingManagers.id': String(creator._id) },
            { entity: creator.entity }
          ]
        }).select('_id email name');

        managersReportingTo.forEach(m => {
          recipientIdSet.add(m._id.toString());
        });
      }
    }

    if (recipientIdSet.size === 0) {
      console.log(`[Notification] No eligible recipients found for ${type}`);
      return [];
    }

    const actorName = actorUser?.name || 'A team member';

    // 3. Build notification records for each unique recipient
    const notificationsToInsert = Array.from(recipientIdSet).map(recipientId => ({
      recipient: recipientId,
      type,
      title,
      message,
      relatedType,
      refId: refId || '',
      relatedDocId: relatedDocId || undefined,
      actor: actorUser?._id || undefined,
      actorName,
      isRead: false
    }));

    const saved = await Notification.insertMany(notificationsToInsert);
    console.log(`[Notification] Dispatched ${saved.length} notifications for ${type} (${refId})`);
    return saved;

  } catch (err) {
    console.error(`[Notification Error] Failed to send document notification:`, err);
    return [];
  }
}

module.exports = {
  sendDocumentNotification
};
