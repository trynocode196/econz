const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const Nda = require('../models/Nda');
const Customer = require('../models/Customer');
const { downloadBoldSignSignedPdf, saveSignedPdfToDisk, getBoldSignDocumentProperties } = require('../services/boldSignService');

/**
 * @route POST /api/webhooks/boldsign
 * BoldSign Webhook Endpoint for Document Signing Events
 */
router.post('/boldsign', async (req, res) => {
  try {
    const payload = req.body;
    console.log('[BoldSign Webhook] Received Event:', JSON.stringify(payload));

    const documentId = payload.event?.documentId || payload.document?.documentId || payload.documentId;
    const eventType = payload.event?.eventType || payload.eventType || payload.status;

    if (!documentId) {
      return res.status(200).json({ message: 'No documentId in webhook payload' });
    }

    // 1. Check if Event is for an NDA document
    const nda = await Nda.findOne({ boldsignDocumentId: documentId });
    if (nda) {
      console.log(`[BoldSign Webhook NDA] Processing event "${eventType}" for NDA #${nda.refId}`);
      
      const docProperties = await getBoldSignDocumentProperties(documentId);
      const signers = docProperties?.signerDetails || [];
      const clientSigner = signers.find(s => s.signerOrder === 1) || signers[0];
      const adminSigner = signers.find(s => s.signerOrder === 2) || signers[1];

      const isClientSigned = clientSigner?.status === 'Completed' || clientSigner?.status === 'Signed';
      const isAdminSigned = adminSigner?.status === 'Completed' || adminSigner?.status === 'Signed';
      const isDocCompleted = eventType === 'Completed' || docProperties?.status === 'Completed' || (isClientSigned && isAdminSigned);

      if (isDocCompleted) {
        nda.status = 'Completed';
        console.log(`[BoldSign Webhook NDA] Both parties signed! Marking NDA #${nda.refId} as Completed.`);
        
        // Download completed signed PDF
        const pdfBuffer = await downloadBoldSignSignedPdf(documentId);
        if (pdfBuffer) {
          const localPdfPath = saveSignedPdfToDisk(nda.refId, pdfBuffer);
          if (localPdfPath) {
            const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
            nda.pdfUrl = `${baseUrl}${localPdfPath}`;
            console.log(`[BoldSign Webhook NDA] Stored completed signed PDF at ${nda.pdfUrl}`);
          }
        }
      } else if (isClientSigned || eventType === 'Signed' || eventType === 'SignerSigned') {
        nda.status = 'Customer Signed';
        console.log(`[BoldSign Webhook NDA] Customer signed! Marking NDA #${nda.refId} as Customer Signed.`);
      } else if (eventType === 'Declined' || eventType === 'Rejected') {
        nda.status = 'Rejected';
      }

      await nda.save();
      return res.status(200).json({ success: true, message: 'BoldSign NDA webhook processed successfully', status: nda.status });
    }

    // 2. Otherwise check if Event is for a Quote
    const quote = await Quote.findOne({ boldSignDocumentId: documentId });
    if (!quote) {
      console.warn('[BoldSign Webhook] Document not found for document ID:', documentId);
      return res.status(200).json({ message: 'Document not found for documentId' });
    }

    // Determine new status based on event
    if (eventType === 'Completed' || eventType === 'Signed') {
      quote.status = 'Customer Signed';
      quote.isSigned = true;

      // Download the signed PDF from BoldSign
      console.log('[BoldSign Webhook] Downloading signed PDF from BoldSign for quote:', quote.refId);
      const pdfBuffer = await downloadBoldSignSignedPdf(documentId);
      if (pdfBuffer) {
        const localPdfPath = saveSignedPdfToDisk(quote.refId, pdfBuffer);
        if (localPdfPath) {
          const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
          quote.pdfUrl = `${baseUrl}${localPdfPath}`;
          quote.signedPdfUrl = `${baseUrl}${localPdfPath}`;
          console.log('[BoldSign Webhook] Replaced PDF file with signed PDF:', quote.pdfUrl);
        }
      }
    } else if (eventType === 'Declined' || eventType === 'Rejected') {
      quote.status = 'Declined';
    } else if (eventType === 'Revoked') {
      quote.status = 'Draft';
    }

    await quote.save();

    if (quote.customer) {
      await Customer.updateOne(
        { _id: quote.customer, 'quotes.quoteId': quote._id },
        {
          $set: {
            'quotes.$.status': quote.status,
            'quotes.$.pdfUrl': quote.pdfUrl,
            'quotes.$.signedPdfUrl': quote.signedPdfUrl
          }
        }
      );
    }

    res.status(200).json({ success: true, message: 'BoldSign webhook processed successfully' });
  } catch (err) {
    console.error('[BoldSign Webhook] Error processing webhook:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
