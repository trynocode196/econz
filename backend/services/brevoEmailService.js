const axios = require('axios');
const User = require('../models/User');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Generate branded HTML email template matching media_1788436156239.png design
 */
function generateEmailHtml({
  badgeText, // e.g. 'QUOTE: #ORD-1001' or 'NDA: #NDA-1001'
  eventHeading, // e.g. '✨ New Quote Created' or '📝 Quote Updated'
  eventSubtitle,
  recipientName,
  introMessage,
  cardTitle = 'DOCUMENT DETAILS',
  details = [], // [{ label: 'Customer Name', value: 'Google India' }, ...]
  primaryButtonText = 'View Document',
  primaryButtonUrl,
  secondaryButtonText = 'Open Orbit Platform',
  secondaryButtonUrl
}) {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const finalPrimaryUrl = primaryButtonUrl || clientUrl;
  const finalSecondaryUrl = secondaryButtonUrl || clientUrl;

  const detailRowsHtml = details
    .map(
      (item, idx) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: ${
          idx === details.length - 1 ? 'none' : '1px solid #e2e8f0'
        }; font-size: 13px; color: #64748b; font-weight: 600; width: 40%; vertical-align: middle;">
          ${item.label}
        </td>
        <td style="padding: 10px 0; border-bottom: ${
          idx === details.length - 1 ? 'none' : '1px solid #e2e8f0'
        }; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right; vertical-align: middle;">
          ${
            item.isBadge
              ? `<span style="background: ${item.badgeBg || '#e0f2fe'}; color: ${
                  item.badgeColor || '#0369a1'
                }; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block;">${item.value}</span>`
              : item.value
          }
        </td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${eventHeading}</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9;">
    <tr>
      <td align="center" style="padding: 12px 16px;">
        <!-- Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
          
          <!-- 1. Header Bar (Dark Navy) -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px 28px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <span style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">econz <span style="color: #38bdf8;">orbit</span></span>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.35); color: #38bdf8; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 5px 12px; border-radius: 9999px; display: inline-block;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 2. Subheader Banner -->
          <tr>
            <td style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 16px 28px;">
              <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0 0 2px 0;">
                ${eventHeading}
              </div>
              <div style="font-size: 12px; color: #64748b; font-weight: 500;">
                ${eventSubtitle || 'Econz Orbit Contract & Document Automation Platform'}
              </div>
            </td>
          </tr>

          <!-- 3. Main Content Body -->
          <tr>
            <td style="padding: 28px 28px 20px 28px;">
              <p style="font-size: 14px; color: #334155; margin: 0 0 14px 0; line-height: 1.5;">
                Hi <strong>${recipientName || 'Team'}</strong>,
              </p>
              <p style="font-size: 14px; color: #334155; margin: 0 0 24px 0; line-height: 1.6;">
                ${introMessage}
              </p>

              <!-- Document Details Table Card -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
                      ${cardTitle}
                    </div>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      ${detailRowsHtml}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Notice info box -->
              <p style="font-size: 12px; color: #64748b; margin: 0 0 24px 0; line-height: 1.5; text-align: center;">
                Please review this document in Orbit to monitor customer signature workflows or make required approvals.
              </p>

              <!-- CTA Buttons -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                      <tr>
                        <!-- Primary Button -->
                        <td align="center" style="padding: 0 6px;">
                          <a href="${finalPrimaryUrl}" target="_blank" style="background: linear-gradient(135deg, #0284c7, #6366f1); color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 26px; border-radius: 9999px; display: inline-block; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);">
                            ${primaryButtonText} &rarr;
                          </a>
                        </td>
                        <!-- Secondary Button -->
                        <td align="center" style="padding: 0 6px;">
                          <a href="${finalSecondaryUrl}" target="_blank" style="background: #ffffff; border: 1px solid #cbd5e1; color: #1e293b; text-decoration: none; font-size: 13px; font-weight: 700; padding: 11px 22px; border-radius: 9999px; display: inline-block;">
                            ${secondaryButtonText}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- 4. Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600;">
                <a href="${clientUrl}" target="_blank" style="color: #0284c7; text-decoration: none;">Open Orbit Platform</a>
                <span style="color: #cbd5e1; margin: 0 8px;">|</span>
                <a href="mailto:support@econz.net" style="color: #64748b; text-decoration: none;">Contact Support</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.4;">
                Sent automatically by <strong>Econz Orbit Platform</strong>.<br>
                This is a system-generated message. Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Resolve recipients: All Admins + Manager of Creator (Deduplicated)
 */
async function resolveNotificationRecipients(creatorId, actorUser) {
  const recipientMap = new Map();

  // 1. All Active Admins
  const admins = await User.find({
    role: 'Admin',
    status: { $ne: 'Inactive' }
  }).select('_id email name');

  admins.forEach(admin => {
    if (admin.email) {
      recipientMap.set(admin.email.toLowerCase().trim(), {
        id: admin._id.toString(),
        name: admin.name || 'Admin',
        email: admin.email.toLowerCase().trim()
      });
    }
  });

  // 2. Manager of the Creator
  const effectiveCreatorId = creatorId || actorUser?._id;
  if (effectiveCreatorId) {
    const creator = await User.findById(effectiveCreatorId);
    if (creator) {
      // Check reportingManagers array
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
            if (m.email) {
              recipientMap.set(m.email.toLowerCase().trim(), {
                id: m._id.toString(),
                name: m.name || 'Manager',
                email: m.email.toLowerCase().trim()
              });
            }
          });
        }
      }

      // Also check managers assigned to creator's entity
      const entityManagers = await User.find({
        role: 'Manager',
        status: { $ne: 'Inactive' },
        $or: [
          { 'reportingManagers.id': String(creator._id) },
          { entity: creator.entity }
        ]
      }).select('_id email name');

      entityManagers.forEach(m => {
        if (m.email) {
          recipientMap.set(m.email.toLowerCase().trim(), {
            id: m._id.toString(),
            name: m.name || 'Manager',
            email: m.email.toLowerCase().trim()
          });
        }
      });
    }
  }

  return Array.from(recipientMap.values());
}

/**
 * Dispatch Brevo Email (REST API v3 with SMTP fallback)
 */
async function sendBrevoEmail({ to, subject, htmlContent }) {
  let apiKey = process.env.BREVO_API_KEY;
  if (apiKey) {
    apiKey = apiKey.replace(/^["']|["']$/g, '').trim();
  }

  if (!apiKey) {
    console.warn('[Brevo Email] BREVO_API_KEY not set in environment. Email simulated.');
    return { simulated: true };
  }

  let senderName = (process.env.BREVO_SENDER_NAME || 'Econz Orbit').replace(/^["']|["']$/g, '').trim();
  let senderEmail = 'srikar.m@econz.net';

  const rawFrom = process.env.BREVO_FROM_EMAIL || process.env.BREVO_SENDER_EMAIL || process.env.BREVO_SMTP_USER;
  if (rawFrom) {
    const cleanedFrom = rawFrom.replace(/^["']|["']$/g, '').trim();
    const match = cleanedFrom.match(/^(?:(.*)<)?([^>]+)>?$/);
    if (match) {
      if (match[1]?.trim()) senderName = match[1].trim();
      if (match[2]?.trim()) senderEmail = match[2].trim();
    } else {
      senderEmail = cleanedFrom;
    }
  }

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: to.map(r => ({ name: r.name, email: r.email })),
    subject: subject,
    htmlContent: htmlContent
  };

  try {
    const response = await axios.post(BREVO_API_URL, payload, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000
    });
    return response.data;
  } catch (apiErr) {
    const errMsg = apiErr.response?.data?.message || apiErr.message;
    console.error('[Brevo REST API Error]:', errMsg);
    throw apiErr;
  }
}

/**
 * Send Quote Notification Email (Created or Updated)
 */
async function sendQuoteEmailNotification({
  action, // 'CREATED' | 'UPDATED'
  quote,
  actorUser
}) {
  try {
    const recipients = await resolveNotificationRecipients(quote.createdBy, actorUser);
    if (!recipients || recipients.length === 0) {
      console.log(`[Brevo Quote Email] No eligible recipients found for Quote ${quote.refId}`);
      return;
    }

    const isCreated = action === 'CREATED';
    const actorName = actorUser?.name || 'A team member';
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const quoteUrl = `${clientUrl}/quotes`;

    const subject = isCreated
      ? `New Quote Created - ${quote.refId}`
      : `Quote Updated - ${quote.refId}`;

    const eventHeading = isCreated ? '✨ New Quote Created' : '📝 Quote Updated';
    const introMessage = isCreated
      ? `A new commercial quote <strong>#${quote.refId}</strong> has been created in Econz Orbit by <strong>${actorName}</strong>.`
      : `Commercial quote <strong>#${quote.refId}</strong> has been updated in Econz Orbit by <strong>${actorName}</strong>.`;

    const curr = quote.currency || 'USD';
    const sym = curr === 'INR' ? '₹' : curr === 'GBP' ? '£' : curr === 'AED' ? 'د.إ' : '$';
    const formattedValue = typeof quote.value === 'number' ? `${sym}${quote.value.toLocaleString()}` : `${quote.value || '-'}`;

    const dateStr = quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) : new Date().toLocaleDateString('en-US');

    // Send personalized email to each recipient
    for (const recipient of recipients) {
      const htmlContent = generateEmailHtml({
        badgeText: `QUOTE: #${quote.refId}`,
        eventHeading,
        eventSubtitle: `${quote.customerName || 'Customer'} · ${quote.title || 'Standard Order'}`,
        recipientName: recipient.name,
        introMessage,
        cardTitle: 'DEAL & QUOTE DETAILS',
        details: [
          { label: 'Quote Number', value: `#${quote.refId}` },
          { label: 'Customer / Client', value: quote.customerName || 'Not specified' },
          { label: 'Created / Updated By', value: actorName },
          {
            label: 'Current Status',
            value: quote.status || 'Draft',
            isBadge: true,
            badgeBg: quote.status === 'Customer Signed' || quote.status === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(14, 165, 233, 0.15)',
            badgeColor: quote.status === 'Customer Signed' || quote.status === 'Completed' ? '#059669' : '#0284c7'
          },
          { label: 'Contract Value', value: formattedValue },
          { label: 'Date', value: dateStr }
        ],
        primaryButtonText: 'Open Quote in Orbit',
        primaryButtonUrl: quoteUrl,
        secondaryButtonText: 'View Dashboard',
        secondaryButtonUrl: `${clientUrl}/dashboard`
      });

      await sendBrevoEmail({
        to: [recipient],
        subject,
        htmlContent
      });
      console.log(`[Brevo Quote Email] Sent to ${recipient.email} for Quote ${quote.refId}`);
    }

  } catch (err) {
    console.error(`[Brevo Quote Email Error] Failed to send email for Quote ${quote.refId}:`, err.response?.data || err.message);
  }
}

/**
 * Send NDA Notification Email (Created or Updated)
 */
async function sendNdaEmailNotification({
  action, // 'CREATED' | 'UPDATED'
  nda,
  actorUser
}) {
  try {
    const recipients = await resolveNotificationRecipients(nda.createdBy, actorUser);
    if (!recipients || recipients.length === 0) {
      console.log(`[Brevo NDA Email] No eligible recipients found for NDA ${nda.refId}`);
      return;
    }

    const isCreated = action === 'CREATED';
    const actorName = actorUser?.name || 'A team member';
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const ndaUrl = `${clientUrl}/nda`;

    const subject = isCreated
      ? `New NDA Created - ${nda.refId}`
      : `NDA Updated - ${nda.refId}`;

    const eventHeading = isCreated ? '🔒 New Mutual NDA Created' : '📝 Mutual NDA Updated';
    const introMessage = isCreated
      ? `A new Mutual Non-Disclosure Agreement <strong>#${nda.refId}</strong> has been generated and sent for signature by <strong>${actorName}</strong>.`
      : `Mutual Non-Disclosure Agreement <strong>#${nda.refId}</strong> has been updated by <strong>${actorName}</strong>.`;

    const dateStr = nda.createdAt ? new Date(nda.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) : new Date().toLocaleDateString('en-US');

    // Send personalized email to each recipient
    for (const recipient of recipients) {
      const htmlContent = generateEmailHtml({
        badgeText: `NDA: #${nda.refId}`,
        eventHeading,
        eventSubtitle: `${nda.companyName || 'Company'} · Mutual Non-Disclosure Agreement`,
        recipientName: recipient.name,
        introMessage,
        cardTitle: 'NDA DOCUMENT DETAILS',
        details: [
          { label: 'NDA Number', value: `#${nda.refId}` },
          { label: 'Company / Client', value: nda.companyName || 'Not specified' },
          { label: 'Authorized Signer', value: `${nda.pocName || ''} (${nda.pocEmail || ''})` },
          { label: 'Created / Updated By', value: actorName },
          {
            label: 'Current Status',
            value: nda.status || 'Sent for Signature',
            isBadge: true,
            badgeBg: nda.status === 'Customer Signed' || nda.status === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(14, 165, 233, 0.15)',
            badgeColor: nda.status === 'Customer Signed' || nda.status === 'Completed' ? '#059669' : '#0284c7'
          },
          { label: 'Industry', value: nda.industry || 'Information Technology (IT)' },
          { label: 'Date', value: dateStr }
        ],
        primaryButtonText: 'Open NDA in Orbit',
        primaryButtonUrl: ndaUrl,
        secondaryButtonText: 'View NDA Repository',
        secondaryButtonUrl: ndaUrl
      });

      await sendBrevoEmail({
        to: [recipient],
        subject,
        htmlContent
      });
      console.log(`[Brevo NDA Email] Sent to ${recipient.email} for NDA ${nda.refId}`);
    }

  } catch (err) {
    console.error(`[Brevo NDA Email Error] Failed to send email for NDA ${nda.refId}:`, err.response?.data || err.message);
  }
}

module.exports = {
  sendBrevoEmail,
  sendQuoteEmailNotification,
  sendNdaEmailNotification,
  generateEmailHtml
};
