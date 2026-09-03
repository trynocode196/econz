const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Send Document for Electronic Signature via BoldSign API
 * Supports Email OTP for customer signer, signature bounds, and date picker placements
 * 
 * Configured Layouts:
 * 1. Microsoft Agreements -> Annexure on Page 9 (Sig y: 155, Date y: 297)
 * 2. Google Cloud Plans -> Annexure on Page 12 (Sig y: 150, Date y: 288)
 * 3. India & UAE (Google Workspace / Standard) -> Annexure on Page 9 (Sig y: 415, Date y: 560)
 */
async function sendBoldSignDocument(options = {}) {
  const {
    title = 'Commercial Agreement',
    message = 'Please review and sign the document.',
    signer_name,
    signer_email,
    admin_name = '',
    admin_email = '',
    cc_email = '',
    file_url,
    fileBuffer = null,
    product_category = '',
    entity = 'India',
    is_microsoft = false,
    quoteData = null
  } = options;
  const apiKey = (process.env.BOLDSIGN_API_KEY && process.env.BOLDSIGN_API_KEY.trim()) || 'NzhlNDliOGUtOGViMS00MDQ3LTgyOWMtZGE4ODE0MjI1NDYy';

  const isUAE = entity === 'UAE';
  const effectiveAdminName = admin_name || (isUAE ? 'Econz' : 'Srikar M');
  const effectiveAdminEmail = admin_email || (isUAE ? 'shaista.a@econz.net' : 'srikar.m@econz.net');

  if (!signer_name) throw new Error('Client signer name is required.');
  if (!signer_email) throw new Error('Client signer email is required.');
  if (!effectiveAdminEmail) throw new Error('Admin signer email is required.');

  if (!apiKey) {
    console.error('[BoldSign] Error: BOLDSIGN_API_KEY is missing! Cannot dispatch signature email to:', signer_email);
    return {
      success: false,
      document_id: `BS-${Date.now()}`,
      warning: 'BOLDSIGN_API_KEY is missing'
    };
  }

  const { generateAgreementPdf } = require('./pdfGenerator');

  let fileData = null;

  if (fileBuffer && Buffer.isBuffer(fileBuffer) && fileBuffer.slice(0, 4).toString().startsWith('%PDF')) {
    fileData = fileBuffer;
  } else if (file_url) {
    let cleanFileUrl = String(file_url).trim();
    if (cleanFileUrl.startsWith('//')) cleanFileUrl = 'https:' + cleanFileUrl;
    if (cleanFileUrl.startsWith('http')) {
      try {
        const fileResponse = await axios.get(cleanFileUrl, { responseType: 'arraybuffer', timeout: 5000 });
        const buf = Buffer.from(fileResponse.data);
        if (buf.slice(0, 4).toString().startsWith('%PDF')) {
          fileData = buf;
        }
      } catch (err) {
        console.warn('[BoldSign] Warning fetching PDF URL, generating fallback PDF:', err.message);
      }
    }
  }

  // If still no valid PDF, generate high-quality 12-page PDF
  if (!fileData) {
    console.log('[BoldSign] Generating structured multi-page PDF agreement for BoldSign...');
    const quotePayload = quoteData || options.quote || {};
    fileData = await generateAgreementPdf({
      refId: quotePayload.refId || title,
      customerName: quotePayload.customerName || signer_name,
      companyShortName: quotePayload.companyShortName || '',
      orderPan: quotePayload.orderPan || quotePayload.pan || quotePayload.vat || '',
      taxIdType: quotePayload.taxIdType || 'PAN',
      orderAddress: quotePayload.orderAddress || quotePayload.address || '',
      entity: quotePayload.entity || entity,
      currency: quotePayload.currency || 'INR',
      pocName: quotePayload.pocName || signer_name,
      pocDesignation: quotePayload.pocDesignation || 'Project Manager',
      pocEmail: quotePayload.pocEmail || signer_email,
      pocMobile: quotePayload.pocMobile || '',
      templateTitle: quotePayload.templateTitle || quotePayload.template || product_category,
      products: quotePayload.products || quotePayload.skus || [],
      skus: quotePayload.products || quotePayload.skus || [],
      value: quotePayload.value || 0
    });
  }

  const categoryStr = String(product_category || '').toLowerCase();
  const isMicrosoft = is_microsoft || categoryStr.includes('microsoft') || categoryStr.includes('m365') || categoryStr.includes('office 365');
  const isGCP = categoryStr.includes('google cloud') || categoryStr.includes('gcp') || categoryStr.includes('cloud plans');

  // Determine Annexure Page & Coordinates
  let annexurePageNumber = 9;
  let annexureClientSigY = 415;
  let annexureClientDateY = 560;
  let annexureAdminSigY = 415;
  let annexureAdminDateY = 560;

  if (isMicrosoft) {
    // Microsoft: Page 9 (y: 155 / 297)
    annexurePageNumber = 9;
    annexureClientSigY = 155;
    annexureClientDateY = 297;
    annexureAdminSigY = 155;
    annexureAdminDateY = 297;
  } else if (isGCP) {
    // Google Cloud Plans: Page 12 (y: 150 / 288)
    annexurePageNumber = 12;
    annexureClientSigY = 150;
    annexureClientDateY = 288;
    annexureAdminSigY = 150;
    annexureAdminDateY = 288;
  } else {
    // India & UAE (Google Workspace / Standard): Page 9 (y: 415 / 560)
    annexurePageNumber = 9;
    annexureClientSigY = 415;
    annexureClientDateY = 560;
    annexureAdminSigY = 415;
    annexureAdminDateY = 560;
  }

  const form = new FormData();

  form.append('Title', title);
  form.append('Message', message);
  form.append('EnableSigningOrder', 'true');
  form.append('DocumentDownloadOption', 'Combined');
  form.append('DisableEmails', 'false');
  form.append('DisableSMS', 'false');

  const clientSigner = {
    name: signer_name,
    emailAddress: signer_email,
    signerType: 'Signer',
    signerOrder: 1,
    locale: 'EN',
    deliveryMode: 'Email',
    authenticationType: 'EmailOTP',
    formFields: [
      {
        id: 'client_signature_page_6',
        name: 'client_signature_page_6',
        fieldType: 'Signature',
        pageNumber: 6,
        bounds: {
          x: 140,
          y: 505,
          width: 140,
          height: 40
        },
        isRequired: true
      },
      {
        id: 'client_signature_page_9',
        name: 'client_signature_page_9',
        fieldType: 'Signature',
        pageNumber: annexurePageNumber,
        bounds: {
          x: 140,
          y: annexureClientSigY,
          width: 140,
          height: 40
        },
        isRequired: true
      },
      {
        id: 'DatePicker1',
        name: 'DatePicker1',
        fieldType: 'DateSigned',
        pageNumber: 1,
        bounds: {
          x: 510,
          y: 140,
          width: 180,
          height: 25
        },
        isRequired: false,
        dateFormat: 'dd/MM/yyyy'
      },
      {
        id: 'DatePicker2',
        name: 'DatePicker2',
        fieldType: 'DateSigned',
        pageNumber: 6,
        bounds: {
          x: 140,
          y: 647,
          width: 180,
          height: 25
        },
        isRequired: false,
        dateFormat: 'dd/MM/yyyy'
      },
      {
        id: 'DatePicker3',
        name: 'DatePicker3',
        fieldType: 'DateSigned',
        pageNumber: annexurePageNumber,
        bounds: {
          x: 140,
          y: annexureClientDateY,
          width: 180,
          height: 25
        },
        isRequired: false,
        dateFormat: 'dd/MM/yyyy'
      }
    ]
  };

  const adminSigner = {
    name: effectiveAdminName,
    emailAddress: effectiveAdminEmail,
    signerType: 'Signer',
    signerOrder: 2,
    locale: 'EN',
    deliveryMode: 'Email',
    formFields: [
      {
        id: 'admin_signature_page_6',
        name: 'admin_signature_page_6',
        fieldType: 'Signature',
        pageNumber: 6,
        bounds: {
          x: 460,
          y: 505,
          width: 140,
          height: 40
        },
        isRequired: true
      },
      {
        id: 'admin_signature_page_9',
        name: 'admin_signature_page_9',
        fieldType: 'Signature',
        pageNumber: annexurePageNumber,
        bounds: {
          x: 460,
          y: annexureAdminSigY,
          width: 140,
          height: 40
        },
        isRequired: true
      },
      {
        id: 'DatePicker4',
        name: 'DatePicker4',
        fieldType: 'DateSigned',
        pageNumber: 6,
        bounds: {
          x: 460,
          y: 647,
          width: 180,
          height: 25
        },
        isRequired: false,
        dateFormat: 'dd/MM/yyyy'
      },
      {
        id: 'DatePicker5',
        name: 'DatePicker5',
        fieldType: 'DateSigned',
        pageNumber: annexurePageNumber,
        bounds: {
          x: 460,
          y: annexureAdminDateY,
          width: 180,
          height: 25
        },
        isRequired: false,
        dateFormat: 'dd/MM/yyyy'
      }
    ]
  };

  // Append Signers twice, once per signer
  form.append('Signers', JSON.stringify(clientSigner));
  form.append('Signers', JSON.stringify(adminSigner));

  if (cc_email && String(cc_email).trim()) {
    const ccList = String(cc_email)
      .split(/[;,]/)
      .map(e => e.trim())
      .filter(e => e !== '');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (let i = 0; i < ccList.length; i++) {
      if (emailRegex.test(ccList[i])) {
        form.append(`CC[${i}].EmailAddress`, ccList[i]);
      }
    }
  }

  form.append('Files', fileData, {
    filename: 'agreement.pdf',
    contentType: 'application/pdf'
  });

  try {
    console.log(`[BoldSign] Sending agreement to client: ${signer_email} (OTP) and admin: ${effectiveAdminEmail}...`);
    const response = await axios.post('https://api.boldsign.com/v1/document/send', form, {
      headers: {
        ...form.getHeaders(),
        'X-API-KEY': apiKey,
        Accept: 'application/json'
      }
    });

    console.log('[BoldSign] Success! Document ID:', response.data.documentId);
    return {
      success: true,
      document_id: response.data.documentId || '',
      raw_response: response.data
    };
  } catch (error) {
    let errorMessage = error.message;
    if (error.response && error.response.data) {
      errorMessage = typeof error.response.data === 'string'
        ? error.response.data
        : JSON.stringify(error.response.data);
    }
    console.error('[BoldSign] API dispatch error:', errorMessage);
    return {
      success: false,
      document_id: `BS-${Date.now()}`,
      warning: errorMessage
    };
  }
}

/**
 * Fetch Document Status & Properties from BoldSign
 */
async function getBoldSignDocumentProperties(documentId) {
  const apiKey = (process.env.BOLDSIGN_API_KEY && process.env.BOLDSIGN_API_KEY.trim()) || 'NzhlNDliOGUtOGViMS00MDQ3LTgyOWMtZGE4ODE0MjI1NDYy';
  if (!apiKey || !documentId || documentId.startsWith('BS-')) return null;

  try {
    const response = await axios.get(`https://api.boldsign.com/v1/document/properties?documentId=${documentId}`, {
      headers: {
        'X-API-KEY': apiKey,
        Accept: 'application/json'
      }
    });
    return response.data;
  } catch (err) {
    console.error('[BoldSign] Error getting document properties:', err.response?.data || err.message);
    return null;
  }
}

/**
 * Download Completed Signed PDF from BoldSign
 */
async function downloadBoldSignSignedPdf(documentId) {
  const apiKey = (process.env.BOLDSIGN_API_KEY && process.env.BOLDSIGN_API_KEY.trim()) || 'NzhlNDliOGUtOGViMS00MDQ3LTgyOWMtZGE4ODE0MjI1NDYy';
  if (!apiKey || !documentId || documentId.startsWith('BS-')) return null;

  try {
    const response = await axios.get(`https://api.boldsign.com/v1/document/download?documentId=${documentId}`, {
      headers: {
        'X-API-KEY': apiKey,
        Accept: 'application/pdf'
      },
      responseType: 'arraybuffer'
    });

    return Buffer.from(response.data);
  } catch (err) {
    console.error('[BoldSign] Error downloading signed PDF:', err.response?.data || err.message);
    return null;
  }
}

/**
 * Save Signed PDF buffer to local uploads folder and return public URL
 */
function saveSignedPdfToDisk(refId, pdfBuffer) {
  try {
    const uploadsDir = path.join(__dirname, '../public/signed_contracts');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const fileName = `${refId || 'contract'}_signed.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);
    return `/uploads/signed_contracts/${fileName}`;
  } catch (err) {
    console.error('[BoldSign] Error saving PDF to disk:', err);
    return null;
  }
}

module.exports = {
  sendBoldSignDocument,
  getBoldSignDocumentProperties,
  downloadBoldSignSignedPdf,
  saveSignedPdfToDisk
};
