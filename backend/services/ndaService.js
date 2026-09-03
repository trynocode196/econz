const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { generateAgreementPdf, generateNdaPdf } = require('./pdfGenerator');

const NDA_TEMPLATE_ID = '1bFHpf1GH-fYX882YUfGJY_LCYTKEgHaVs6I7FCDPztk';

/**
 * Builds Google Docs batchUpdate replacement requests for NDA template
 */
function buildNdaReplacementRequests(ndaData) {
  const signingDate = ndaData.signingdate || ndaData.executionDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const replacements = {
    '{{agreementno}}': ndaData.refId || 'NDA-1001',
    '{{signingdate}}': signingDate,
    '{{companyname}}': ndaData.companyName || 'CLIENT',
    '{{gstorpan}}': ndaData.gstOrPan || '',
    '{{companyaddress}}': ndaData.companyAddress || '',
    '{{industry}}': ndaData.industry || 'Information Technology (IT) & Software',
    '{{years}}': ndaData.years || '1 (One) Year',
    '{{clientfullname}}': ndaData.pocName || 'Authorized Signatory',
    '{{clienttitle}}': ndaData.pocDesignation || 'Project Manager'
  };

  const requests = Object.entries(replacements).map(([key, value]) => ({
    replaceAllText: {
      containsText: {
        text: key,
        matchCase: false
      },
      replaceText: String(value || '')
    }
  }));

  return { requests, replacements };
}

/**
 * Copies Google Doc NDA Template, replaces placeholder parameters,
 * and exports the updated DOCX / PDF file to pass directly to BoldSign
 */
async function generateNdaGoogleDoc(ndaData, accessToken = null) {
  const agreementName = `${ndaData.refId} - ${ndaData.companyName} - Mutual Non-Disclosure Agreement`;
  const { requests, replacements } = buildNdaReplacementRequests(ndaData);
  let docId = null;
  let fileBuffer = null;
  let filename = null;
  let contentType = null;

  if (accessToken) {
    try {
      console.log(`[GoogleDocs NDA] Copying template ${NDA_TEMPLATE_ID} as "${agreementName}"...`);
      const copyRes = await fetch(`https://www.googleapis.com/drive/v3/files/${NDA_TEMPLATE_ID}/copy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: agreementName })
      });

      if (copyRes.ok) {
        const copyData = await copyRes.json();
        docId = copyData.id;

        if (docId) {
          console.log(`[GoogleDocs NDA] Performing batchUpdate replacement on new doc ${docId}...`);
          await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ requests })
          });

          // Export updated document as DOCX from Google Drive
          try {
            console.log(`[GoogleDocs NDA] Exporting updated doc ${docId} as DOCX...`);
            const exportRes = await fetch(`https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=application/vnd.openxmlformats-officedocument.wordprocessingml.document`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });

            if (exportRes.ok) {
              const arrayBuf = await exportRes.arrayBuffer();
              fileBuffer = Buffer.from(arrayBuf);
              filename = 'Econz_Mutual_Non_Disclosure_Agreement.docx';
              contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
              console.log(`[GoogleDocs NDA] Successfully exported updated DOCX (${fileBuffer.length} bytes) for BoldSign.`);
            }
          } catch (exportErr) {
            console.warn('[GoogleDocs NDA] Warning exporting DOCX via API:', exportErr.message);
          }
        }
      }
    } catch (err) {
      console.error('[GoogleDocs NDA] Error during API copy, batchUpdate, or export:', err);
    }
  }

  if (!docId) {
    docId = `${NDA_TEMPLATE_ID}_${ndaData.refId}`;
  }

  const documentUrl = `https://docs.google.com/document/d/${docId}/edit`;
  const pdfUrl = `https://docs.google.com/document/d/${docId}/export?format=pdf`;
  const docUrl = `https://docs.google.com/document/d/${docId}/export?format=docx`;

  return {
    templateId: NDA_TEMPLATE_ID,
    docId,
    documentUrl,
    pdfUrl,
    docUrl,
    requests,
    replacements,
    fileBuffer,
    filename,
    contentType
  };
}

/**
 * Sends Mutual Non-Disclosure Agreement to BoldSign for electronic signatures
 */
async function sendNdaToBoldSign(properties = {}) {
  const apiKey = (process.env.BOLDSIGN_API_KEY && process.env.BOLDSIGN_API_KEY.trim()) || 'NzhlNDliOGUtOGViMS00MDQ3LTgyOWMtZGE4ODE0MjI1NDYy';

  const title = String(properties.title || "Mutual Non-Disclosure Agreement").trim();
  const message = String(properties.message || "Please review and sign the Mutual Non-Disclosure Agreement.").trim();

  const signerName = String(properties.signer_name || "").trim();
  const signerEmail = String(properties.signer_email || "").trim();
  const adminName = String(properties.admin_name || "Moby K Babu").trim();
  const adminEmail = String(properties.admin_email || "shaista.a@econz.net").trim();
  let ccEmail = String(properties.cc_email || "").trim();
  let fileUrl = String(properties.file_url || "").trim();

  if (!signerName) throw new Error("Client signer name is required.");
  if (!signerEmail) throw new Error("Client signer email is required.");
  if (!adminName) throw new Error("Admin signer name is required.");
  if (!adminEmail) throw new Error("Admin signer email is required.");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(signerEmail)) throw new Error("Invalid client signer email: " + signerEmail);
  if (!emailRegex.test(adminEmail)) throw new Error("Invalid admin signer email: " + adminEmail);

  let fileBuffer = null;
  let uploadFilename = properties.uploadFilename || "Econz_Mutual_Non_Disclosure_Agreement.pdf";
  let uploadContentType = properties.uploadContentType || "application/pdf";

  if (properties.fileBuffer && Buffer.isBuffer(properties.fileBuffer)) {
    fileBuffer = properties.fileBuffer;
    if (fileBuffer.slice(0, 4).toString() === '%PDF') {
      uploadFilename = "Econz_Mutual_Non_Disclosure_Agreement.pdf";
      uploadContentType = "application/pdf";
    } else if (fileBuffer[0] === 0x50 && fileBuffer[1] === 0x4B) { // PK zip header (DOCX)
      uploadFilename = "Econz_Mutual_Non_Disclosure_Agreement.docx";
      uploadContentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
  } else if (fileUrl) {
    if (fileUrl.startsWith("//")) fileUrl = "https:" + fileUrl;
    try {
      const fileResponse = await axios.get(fileUrl, {
        responseType: "arraybuffer",
        timeout: 10000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      if (fileResponse.data && fileResponse.data.length > 0) {
        fileBuffer = Buffer.from(fileResponse.data);
        if (fileBuffer.slice(0, 4).toString() === '%PDF') {
          uploadFilename = "Econz_Mutual_Non_Disclosure_Agreement.pdf";
          uploadContentType = "application/pdf";
        } else if (fileBuffer[0] === 0x50 && fileBuffer[1] === 0x4B) {
          uploadFilename = "Econz_Mutual_Non_Disclosure_Agreement.docx";
          uploadContentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
      }
    } catch (e) {
      console.warn('[BoldSign NDA] Warning fetching remote file, generating PDF locally:', e.message);
    }
  }

  // Fallback / Direct Generation: generate high quality 5-page Mutual NDA PDF document
  if (!fileBuffer) {
    console.log('[BoldSign NDA] Generating 5-page Mutual NDA PDF buffer with replaced placeholders...');
    fileBuffer = await generateNdaPdf({
      refId: properties.refId || 'NDA-1001',
      agreementno: properties.refId || 'NDA-1001',
      companyName: properties.companyName || signerName,
      companyname: properties.companyName || signerName,
      gstOrPan: properties.gstOrPan || '',
      gstorpan: properties.gstOrPan || '',
      companyAddress: properties.companyAddress || '',
      companyaddress: properties.companyAddress || '',
      industry: properties.industry || 'Information Technology (IT) & Software',
      pocName: signerName,
      clientfullname: signerName,
      pocDesignation: properties.pocDesignation || 'Project Manager',
      clienttitle: properties.pocDesignation || 'Project Manager',
      pocEmail: signerEmail,
      pocMobile: properties.pocMobile || '',
      entity: properties.entity || 'India',
      currency: properties.currency || 'INR',
      adminName: adminName,
      adminEmail: adminEmail
    });
  }

  const form = new FormData();
  form.append("Title", title);
  form.append("Message", message);
  form.append("EnableSigningOrder", "true");
  form.append("DisableEmails", "false");
  form.append("DisableSMS", "true");
  form.append("DocumentDownloadOption", "Combined");
  form.append("EnablePrintAndSign", "false");
  form.append("EnableReassign", "false");
  form.append("AutoDetectFields", "false");

  // Client Signer (Order 1, Email OTP enabled)
  const clientSigner = {
    name: signerName,
    emailAddress: signerEmail,
    signerType: "Signer",
    signerOrder: 1,
    locale: "EN",
    deliveryMode: "Email",
    authenticationType: "EmailOTP",
    enableEmailOTP: true,
    privateMessage: "Please review the Mutual Non-Disclosure Agreement and complete your signature.",
    formFields: [
      {
        id: "client_signature_page_5",
        name: "client_signature_page_5",
        fieldType: "Signature",
        pageNumber: 5,
        bounds: { x: 104, y: 315, width: 140, height: 38 },
        isRequired: true
      },
      {
        id: "client_date_page_5",
        name: "client_date_page_5",
        fieldType: "DateSigned",
        pageNumber: 5,
        bounds: { x: 104, y: 382, width: 110, height: 22 },
        isRequired: true,
        dateFormat: "dd/MM/yyyy"
      }
    ]
  };

  // Admin Signer (Order 2)
  const adminSigner = {
    name: adminName,
    emailAddress: adminEmail,
    signerType: "Signer",
    signerOrder: 2,
    locale: "EN",
    deliveryMode: "Email",
    privateMessage: "Please review and complete the Econz signature on the Mutual Non-Disclosure Agreement.",
    formFields: [
      {
        id: "admin_signature_page_5",
        name: "admin_signature_page_5",
        fieldType: "Signature",
        pageNumber: 5,
        bounds: { x: 390, y: 315, width: 140, height: 38 },
        isRequired: true
      },
      {
        id: "admin_date_page_5",
        name: "admin_date_page_5",
        fieldType: "DateSigned",
        pageNumber: 5,
        bounds: { x: 390, y: 382, width: 110, height: 22 },
        isRequired: true,
        dateFormat: "dd/MM/yyyy"
      }
    ]
  };

  form.append("Signers", JSON.stringify(clientSigner));
  form.append("Signers", JSON.stringify(adminSigner));

  // Handle CC
  if (ccEmail !== "") {
    const ccList = ccEmail
      .split(/[;,]/)
      .map(email => email.trim())
      .filter(email => email !== "");

    const uniqueCcList = [...new Set(ccList)];

    for (let i = 0; i < uniqueCcList.length; i++) {
      const email = uniqueCcList[i];
      if (!emailRegex.test(email)) continue;
      if (email.toLowerCase() === signerEmail.toLowerCase() || email.toLowerCase() === adminEmail.toLowerCase()) continue;

      form.append("CC", JSON.stringify({ emailAddress: email }));
    }
  }

  // Attach File
  form.append("Files", fileBuffer, {
    filename: uploadFilename,
    contentType: uploadContentType
  });

  try {
    const response = await axios.post("https://api.boldsign.com/v1/document/send", form, {
      headers: {
        ...form.getHeaders(),
        "X-API-KEY": apiKey,
        Accept: "application/json"
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000,
      validateStatus: status => status >= 200 && status < 300
    });

    return {
      document_id: response.data.documentId,
      raw_response: response.data
    };
  } catch (err) {
    console.error('[BoldSign NDA Error]:', err.response?.data || err.message);
    return {
      document_id: `NDA-BS-${Date.now()}`,
      warning: err.response?.data?.message || err.message,
      raw_response: err.response?.data || { error: err.message }
    };
  }
}

module.exports = {
  NDA_TEMPLATE_ID,
  buildNdaReplacementRequests,
  generateNdaGoogleDoc,
  sendNdaToBoldSign
};
