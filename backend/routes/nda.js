const express = require('express');
const router = express.Router();
const Nda = require('../models/Nda');
const Customer = require('../models/Customer');
const { protect } = require('../middleware/auth');
const { generateNdaGoogleDoc, sendNdaToBoldSign } = require('../services/ndaService');
const { getBoldSignDocumentProperties, downloadBoldSignSignedPdf, saveSignedPdfToDisk } = require('../services/boldSignService');
const { sendDocumentNotification } = require('../services/notificationService');

/**
 * @route   GET /api/nda
 * @desc    Get all Non-Disclosure Agreements with live BoldSign status sync
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const ndas = await Nda.find().populate('customer').populate('createdBy', 'name email').sort({ createdAt: -1 });

    // Live sync pending BoldSign statuses in background
    Promise.all(ndas.filter(n => n.boldsignDocumentId && ['Sent for Signature', 'Customer Signed', 'Draft'].includes(n.status)).map(async (n) => {
      try {
        const docProps = await getBoldSignDocumentProperties(n.boldsignDocumentId);
        if (!docProps) return;

        const signers = docProps.signerDetails || [];
        const clientSigner = signers.find(s => s.signerOrder === 1) || signers[0];
        const adminSigner = signers.find(s => s.signerOrder === 2) || signers[1];

        const isClientSigned = clientSigner?.status === 'Completed' || clientSigner?.status === 'Signed';
        const isAdminSigned = adminSigner?.status === 'Completed' || adminSigner?.status === 'Signed';
        const isDocCompleted = docProps.status === 'Completed' || (isClientSigned && isAdminSigned);

        let statusChanged = false;
        if (isDocCompleted && n.status !== 'Completed') {
          n.status = 'Completed';
          statusChanged = true;

          const pdfBuffer = await downloadBoldSignSignedPdf(n.boldsignDocumentId);
          if (pdfBuffer) {
            const localPdfPath = saveSignedPdfToDisk(n.refId, pdfBuffer);
            if (localPdfPath) {
              const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
              n.pdfUrl = `${baseUrl}${localPdfPath}`;
            }
          }
        } else if (isClientSigned && n.status !== 'Customer Signed' && n.status !== 'Completed') {
          n.status = 'Customer Signed';
          statusChanged = true;
        }

        if (statusChanged) {
          await n.save();
        }
      } catch (err) {
        // Silent background check error
      }
    })).catch(() => {});

    res.json(ndas);
  } catch (err) {
    console.error('Error fetching NDAs:', err);
    res.status(500).json({ message: 'Server error fetching NDAs' });
  }
});

/**
 * @route   GET /api/nda/:id
 * @desc    Get single NDA by ID or refId
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const nda = await Nda.findOne({
      $or: [{ _id: req.params.id }, { refId: req.params.id }]
    }).populate('customer').populate('createdBy', 'name email');

    if (!nda) {
      return res.status(404).json({ message: 'NDA not found' });
    }
    res.json(nda);
  } catch (err) {
    console.error('Error fetching NDA:', err);
    res.status(500).json({ message: 'Server error fetching NDA' });
  }
});

/**
 * @route   POST /api/nda
 * @desc    Create Customer (if not exists or update) & Generate NDA (Google Docs + BoldSign)
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const {
      entity = 'India',
      currency = 'INR',
      companyName,
      companyShortName,
      vat,
      gstOrPan,
      industry = 'Information Technology (IT) & Software',
      companyAddress,
      pocName,
      pocEmail,
      pocMobile,
      pocDesignation = 'Project Manager',
      ccEmail = '',
      adminName = 'Moby K Babu',
      adminEmail = 'shaista.a@econz.net'
    } = req.body;

    if (!companyName || !pocName || !pocEmail) {
      return res.status(400).json({ message: 'Company Name, POC Name, and POC Email are required.' });
    }

    const effectiveGstOrPan = gstOrPan || vat || '';

    // ============================================================
    // STEP 1: CHECK IF CUSTOMER EXISTS -> UPDATE OR CREATE NEW
    // ============================================================
    let customer = await Customer.findOne({
      $or: [
        { account: new RegExp(`^${companyName.trim()}$`, 'i') },
        { companyShortName: companyShortName ? new RegExp(`^${companyShortName.trim()}$`, 'i') : null },
        { 'contacts.email': pocEmail.trim().toLowerCase() }
      ].filter(Boolean)
    });

    if (customer) {
      // Update existing customer details
      if (companyShortName) customer.companyShortName = companyShortName;
      if (effectiveGstOrPan) customer.pan = effectiveGstOrPan;
      if (industry) customer.industry = industry;
      if (companyAddress) customer.address = companyAddress;
      if (entity) customer.entity = entity;

      // Check contact
      const contactIdx = customer.contacts.findIndex(c => c.email && c.email.toLowerCase() === pocEmail.toLowerCase());
      if (contactIdx >= 0) {
        customer.contacts[contactIdx].name = pocName;
        customer.contacts[contactIdx].phone = pocMobile || customer.contacts[contactIdx].phone;
        customer.contacts[contactIdx].role = pocDesignation || customer.contacts[contactIdx].role;
      } else {
        customer.contacts.push({
          name: pocName,
          email: pocEmail,
          phone: pocMobile || '',
          role: pocDesignation || 'Project Manager'
        });
      }
      await customer.save();
      console.log(`[NDA] Existing customer updated: ${customer.account}`);
    } else {
      // Create new customer
      customer = new Customer({
        account: companyName.trim(),
        companyShortName: companyShortName || '',
        industry: industry || 'Information Technology (IT) & Software',
        pan: effectiveGstOrPan,
        taxIdType: entity === 'India' ? 'GST/PAN' : 'VAT',
        entity: entity,
        address: companyAddress || '',
        customerType: 'Direct',
        status: 'Active',
        contacts: [
          {
            name: pocName,
            email: pocEmail,
            phone: pocMobile || '',
            role: pocDesignation || 'Project Manager'
          }
        ],
        createdBy: req.user?._id
      });
      await customer.save();
      console.log(`[NDA] New customer created: ${customer.account}`);
    }

    // ============================================================
    // STEP 2: GENERATE UNIQUE AGREEMENT NUMBER / REF ID
    // ============================================================
    const random8 = Math.floor(10000000 + Math.random() * 90000000).toString();
    const refId = random8;

    const ndaPayload = {
      refId,
      entity,
      currency,
      companyName,
      companyShortName,
      gstOrPan: effectiveGstOrPan,
      industry,
      companyAddress,
      pocName,
      pocEmail,
      pocMobile,
      pocDesignation,
      ccEmail,
      adminName,
      adminEmail
    };

    // ============================================================
    // STEP 3: GOOGLE DOCS TEMPLATE COPY & PLACEHOLDER REPLACEMENT
    // ============================================================
    const googleDocResult = await generateNdaGoogleDoc(ndaPayload, req.headers['x-google-access-token'] || null);

    // ============================================================
    // STEP 4: DISPATCH ELECTRONIC SIGNATURE VIA BOLDSIGN
    // ============================================================
    const boldSignResult = await sendNdaToBoldSign({
      title: 'Mutual Non-Disclosure Agreement',
      message: 'Please review and sign the Mutual Non-Disclosure Agreement.',
      signer_name: pocName,
      signer_email: pocEmail,
      admin_name: adminName,
      admin_email: adminEmail,
      cc_email: ccEmail,
      refId: refId,
      companyName: companyName,
      companyAddress: companyAddress,
      gstOrPan: effectiveGstOrPan,
      industry: industry,
      pocDesignation: pocDesignation,
      pocMobile: pocMobile,
      entity: entity,
      currency: currency,
      fileBuffer: googleDocResult.fileBuffer,
      file_url: googleDocResult.docUrl || googleDocResult.pdfUrl,
      uploadFilename: googleDocResult.filename,
      uploadContentType: googleDocResult.contentType
    });

    // ============================================================
    // STEP 5: STORE IN NDA TABLE
    // ============================================================
    const newNda = new Nda({
      refId,
      entity,
      currency,
      companyName,
      companyShortName,
      gstOrPan: effectiveGstOrPan,
      industry,
      companyAddress,
      pocName,
      pocEmail,
      pocMobile,
      pocDesignation,
      ccEmail,
      adminName,
      adminEmail,
      status: 'Sent for Signature',
      googleDocId: googleDocResult.docId,
      googleDocUrl: googleDocResult.documentUrl,
      pdfUrl: googleDocResult.pdfUrl,
      docUrl: googleDocResult.docUrl,
      boldsignDocumentId: boldSignResult.document_id,
      boldsignStatus: 'Sent',
      boldsignResponse: boldSignResult.raw_response,
      customer: customer._id,
      createdBy: req.user?._id,
      creatorEmail: req.user?.email || adminEmail
    });

    await newNda.save();

    // Trigger Notification for NDA Creation
    const actorName = req.user?.name || 'A team member';
    sendDocumentNotification({
      type: 'NDA_CREATED',
      title: 'New NDA Created',
      message: `NDA #${refId} was created by ${actorName}.`,
      relatedType: 'Nda',
      refId: refId,
      relatedDocId: newNda._id,
      actorUser: req.user,
      creatorId: req.user?._id
    }).catch(err => console.error('[NDA Notification Error]:', err));

    res.status(201).json({
      success: true,
      message: 'Mutual Non-Disclosure Agreement created and sent for signature successfully.',
      nda: newNda,
      customer
    });

  } catch (err) {
    console.error('[NDA Creation Error]:', err);
    res.status(500).json({ message: err.message || 'Error creating Non-Disclosure Agreement' });
  }
});

/**
 * @route   PUT /api/nda/:id
 * @desc    Update NDA status or details
 * @access  Private
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const nda = await Nda.findById(req.params.id);
    if (!nda) return res.status(404).json({ message: 'NDA not found' });

    Object.assign(nda, req.body);
    await nda.save();

    // Trigger Notification for NDA Update
    const actorName = req.user?.name || 'A team member';
    sendDocumentNotification({
      type: 'NDA_UPDATED',
      title: 'NDA Updated',
      message: `NDA #${nda.refId} was updated by ${actorName}.`,
      relatedType: 'Nda',
      refId: nda.refId,
      relatedDocId: nda._id,
      actorUser: req.user,
      creatorId: nda.createdBy
    }).catch(err => console.error('[NDA Notification Error]:', err));

    res.json(nda);
  } catch (err) {
    console.error('Error updating NDA:', err);
    res.status(500).json({ message: 'Server error updating NDA' });
  }
});

module.exports = router;
