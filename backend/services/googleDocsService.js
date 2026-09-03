/**
 * Google Docs & Drive API Integration for Econz Orbit
 * Copies Master Legal Template and replaces all {{variables}} using batchUpdate
 */

/**
 * Resolves Google Doc Template ID based on Customer Country and Product Category:
 * 1. If Customer Country is UAE:
 *    -> 1us0WO3nhUd7jLubLxf20_qPbNnTjXCtykFBy2W_A_Ks
 * 2. If Customer Country is NOT UAE:
 *    - If Product Category is "Microsoft":
 *      -> 1xVlRGGZK9ePaBHHQi9RxsOVI5Ta8tqGraKxcGEIgVm0
 *    - If Product Category is "Google Cloud Plans":
 *      -> 1khpuoJwK4b19Ushz55ed5e9vyy9L4B6hw7_WuPe-HFw
 *    - Otherwise:
 *      -> 1eCQk76ndyePdO7pGuMBVqPqVJFj0WPr58b1zlYLqhOc
 */
function resolveGoogleDocTemplateId(quote) {
  const isUAE = 
    quote.entity === 'UAE' || 
    quote.currency === 'AED' || 
    (quote.orderAddress && /united arab emirates|uae|dubai|abu dhabi|sharjah/i.test(quote.orderAddress));

  if (isUAE) {
    return '1us0WO3nhUd7jLubLxf20_qPbNnTjXCtykFBy2W_A_Ks';
  }

  // Check product category / template / SKU names
  const category = (
    quote.templateTitle || 
    quote.template || 
    quote.productCategory || 
    quote.products?.[0]?.name || 
    quote.skus?.[0]?.name || 
    ''
  ).toLowerCase();

  if (category.includes('microsoft') || category.includes('m365') || category.includes('office 365')) {
    return '1xVlRGGZK9ePaBHHQi9RxsOVI5Ta8tqGraKxcGEIgVm0';
  }

  if (category.includes('google cloud') || category.includes('gcp') || category.includes('cloud plans')) {
    return '1khpuoJwK4b19Ushz55ed5e9vyy9L4B6hw7_WuPe-HFw';
  }

  // Default / Otherwise
  return '1eCQk76ndyePdO7pGuMBVqPqVJFj0WPr58b1zlYLqhOc';
}

function buildReplacementRequests(quoteData) {
  const skus = quoteData.products || quoteData.skus || [];
  
  // Categorize or split SKUs into table A, B, C or sequentially
  const getSkuField = (index, field, fallback = '') => {
    const s = skus[index];
    if (!s) return fallback;
    switch (field) {
      case 'name': return s.name || fallback;
      case 'qty': return String(s.qty || 1);
      case 'price': return parseFloat(s.sellPrice || 0).toFixed(2);
      case 'commitment_type': return s.subPlan || s.commitmentType || '12 Months';
      case 'payment_frequency': return s.paymentPlan || s.paymentFrequency || 'Yearly';
      case 'credit_terms': return s.creditTerms || s.creditLimit || '0 Days';
      case 'total': return ((parseFloat(s.sellPrice) || 0) * (parseInt(s.qty) || 1)).toFixed(2);
      default: return fallback;
    }
  };

  const subtotal = skus.reduce((sum, s) => sum + ((parseFloat(s.sellPrice) || 0) * (parseInt(s.qty) || 1)), 0);
  const isIndia = quoteData.currency === 'INR' || quoteData.entity === 'India';
  const isUK = quoteData.currency === 'GBP' || quoteData.entity === 'UK';
  const isUAE = quoteData.currency === 'AED' || quoteData.entity === 'UAE';
  
  const taxRate = isIndia ? 0.18 : (isUK || isUAE ? 0.05 : 0);
  const taxAmount = subtotal * taxRate;
  const grandTotal = subtotal + taxAmount;
  const taxPctStr = isIndia ? '18%' : (isUK || isUAE ? '5%' : '0%');

  const replacements = {
    // Header & Customer details
    '{{agreementno}}': quoteData.refId || 'ORD-TEMP',
    '{{companyname}}': quoteData.customerName || 'CLIENT',
    '{{gstorpan}}': quoteData.orderPan || quoteData.pan || quoteData.vat || '',
    '{{companyaddress}}': quoteData.orderAddress || quoteData.address || '',
    '{{industry}}': quoteData.orderIndustry || quoteData.industry || 'Information Technology (IT) & Software',
    '{{years}}': skus[0]?.subPlan || '12 Months',
    '{{days}}': skus[0]?.creditTerms || skus[0]?.creditLimit || '0 Days',
    '{{clientfullname}}': quoteData.pocName || quoteData.customerName || 'Authorized Signatory',
    '{{clienttitle}}': quoteData.pocDesignation || 'Project Manager',
    '{{productcategoryname}}': quoteData.templateTitle || quoteData.template || skus[0]?.name || 'Google Workspace',
    '{{currency}}': quoteData.currency || 'USD',

    // Table A (1 to 5)
    '{{A_1_name}}': getSkuField(0, 'name'),
    '{{A_1_qty}}': getSkuField(0, 'qty'),
    '{{A_1_price}}': getSkuField(0, 'price'),
    '{{A_1_commitment_type}}': getSkuField(0, 'commitment_type'),
    '{{A_1_payment_frequency}}': getSkuField(0, 'payment_frequency'),
    '{{A_1_credit_terms}}': getSkuField(0, 'credit_terms'),
    '{{A_1_total}}': getSkuField(0, 'total'),

    '{{A_2_name}}': getSkuField(1, 'name'),
    '{{A_2_qty}}': getSkuField(1, 'qty'),
    '{{A_2_price}}': getSkuField(1, 'price'),
    '{{A_2_commitment_type}}': getSkuField(1, 'commitment_type'),
    '{{A_2_payment_frequency}}': getSkuField(1, 'payment_frequency'),
    '{{A_2_credit_terms}}': getSkuField(1, 'credit_terms'),
    '{{A_2_total}}': getSkuField(1, 'total'),

    '{{A_3_name}}': getSkuField(2, 'name'),
    '{{A_3_qty}}': getSkuField(2, 'qty'),
    '{{A_3_price}}': getSkuField(2, 'price'),
    '{{A_3_commitment_type}}': getSkuField(2, 'commitment_type'),
    '{{A_3_payment_frequency}}': getSkuField(2, 'payment_frequency'),
    '{{A_3_credit_terms}}': getSkuField(2, 'credit_terms'),
    '{{A_3_total}}': getSkuField(2, 'total'),

    '{{A_4_name}}': getSkuField(3, 'name'),
    '{{A_4_qty}}': getSkuField(3, 'qty'),
    '{{A_4_price}}': getSkuField(3, 'price'),
    '{{A_4_commitment_type}}': getSkuField(3, 'commitment_type'),
    '{{A_4_payment_frequency}}': getSkuField(3, 'payment_frequency'),
    '{{A_4_credit_terms}}': getSkuField(3, 'credit_terms'),
    '{{A_4_total}}': getSkuField(3, 'total'),

    '{{A_5_name}}': getSkuField(4, 'name'),
    '{{A_5_qty}}': getSkuField(4, 'qty'),
    '{{A_5_price}}': getSkuField(4, 'price'),
    '{{A_5_commitment_type}}': getSkuField(4, 'commitment_type'),
    '{{A_5_payment_frequency}}': getSkuField(4, 'payment_frequency'),
    '{{A_5_credit_terms}}': getSkuField(4, 'credit_terms'),
    '{{A_5_total}}': getSkuField(4, 'total'),

    '{{subtotalA}}': subtotal.toFixed(2),
    '{{gtotalA}}': grandTotal.toFixed(2),
    '{{gstpercentageA}}': taxPctStr,
    '{{gstA}}': taxAmount.toFixed(2),

    // Table B (1 to 5) - Professional Services or blank
    '{{B_1_name}}': '',
    '{{B_1_qty}}': '',
    '{{B_1_price}}': '',
    '{{B_1_commitment_type}}': '',
    '{{B_1_payment_frequency}}': '',
    '{{B_1_credit_terms}}': '',
    '{{B_1_total}}': '',

    '{{B_2_name}}': '',
    '{{B_2_qty}}': '',
    '{{B_2_price}}': '',
    '{{B_2_commitment_type}}': '',
    '{{B_2_payment_frequency}}': '',
    '{{B_2_credit_terms}}': '',
    '{{B_2_total}}': '',

    '{{B_3_name}}': '',
    '{{B_3_qty}}': '',
    '{{B_3_price}}': '',
    '{{B_3_commitment_type}}': '',
    '{{B_3_payment_frequency}}': '',
    '{{B_3_credit_terms}}': '',
    '{{B_3_total}}': '',

    '{{B_4_name}}': '',
    '{{B_4_qty}}': '',
    '{{B_4_price}}': '',
    '{{B_4_commitment_type}}': '',
    '{{B_4_payment_frequency}}': '',
    '{{B_4_credit_terms}}': '',
    '{{B_4_total}}': '',

    '{{B_5_name}}': '',
    '{{B_5_qty}}': '',
    '{{B_5_price}}': '',
    '{{B_5_commitment_type}}': '',
    '{{B_5_payment_frequency}}': '',
    '{{B_5_credit_terms}}': '',
    '{{B_5_total}}': '',

    '{{subtotalB}}': '0.00',
    '{{gtotalB}}': '0.00',
    '{{gstpercentageB}}': taxPctStr,
    '{{gstB}}': '0.00',

    // Table C (1 to 5) - Technical Support or blank
    '{{C_1_name}}': '',
    '{{C_1_qty}}': '',
    '{{C_1_price}}': '',
    '{{C_1_commitment_type}}': '',
    '{{C_1_payment_frequency}}': '',
    '{{C_1_credit_terms}}': '',
    '{{C_1_total}}': '',

    '{{C_2_name}}': '',
    '{{C_2_qty}}': '',
    '{{C_2_price}}': '',
    '{{C_2_commitment_type}}': '',
    '{{C_2_payment_frequency}}': '',
    '{{C_2_credit_terms}}': '',
    '{{C_2_total}}': '',

    '{{C_3_name}}': '',
    '{{C_3_qty}}': '',
    '{{C_3_price}}': '',
    '{{C_3_commitment_type}}': '',
    '{{C_3_payment_frequency}}': '',
    '{{C_3_credit_terms}}': '',
    '{{C_3_total}}': '',

    '{{C_4_name}}': '',
    '{{C_4_qty}}': '',
    '{{C_4_price}}': '',
    '{{C_4_commitment_type}}': '',
    '{{C_4_payment_frequency}}': '',
    '{{C_4_credit_terms}}': '',
    '{{C_4_total}}': '',

    '{{C_5_name}}': '',
    '{{C_5_qty}}': '',
    '{{C_5_price}}': '',
    '{{C_5_commitment_type}}': '',
    '{{C_5_payment_frequency}}': '',
    '{{C_5_credit_terms}}': '',
    '{{C_5_total}}': '',

    '{{subtotalC}}': '0.00',
    '{{gtotalC}}': '0.00',
    '{{gstpercentageC}}': taxPctStr,
    '{{gstC}}': '0.00',
  };

  const requests = Object.entries(replacements).map(([key, value]) => ({
    replaceAllText: {
      containsText: {
        text: key,
        matchCase: false
      },
      replaceText: value || ''
    }
  }));

  return { requests, replacements };
}

async function generateAndStoreAgreementDoc(quote, accessToken = null) {
  // Dynamically resolve template ID according to country & product category
  const templateId = resolveGoogleDocTemplateId(quote);
  const agreementName = `${quote.refId} - ${quote.customerName} - Master Agreement`;
  const { requests, replacements } = buildReplacementRequests(quote);

  let docId = null;

  // 1. Try Google Drive API Copy if accessToken available
  if (accessToken) {
    try {
      console.log(`[GoogleDocs] Copying template ${templateId} as "${agreementName}"...`);
      const copyRes = await fetch(`https://www.googleapis.com/drive/v3/files/${templateId}/copy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: agreementName })
      });

      const copyText = await copyRes.text();
      console.log(`[GoogleDocs] Copy response (${copyRes.status}):`, copyText);

      if (copyRes.ok) {
        const copyData = JSON.parse(copyText);
        docId = copyData.id;

        // 2. Call Google Docs batchUpdate to replace placeholders
        if (docId) {
          console.log(`[GoogleDocs] Performing batchUpdate on new doc ${docId}...`);
          const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ requests })
          });
          const updateText = await updateRes.text();
          console.log(`[GoogleDocs] batchUpdate response (${updateRes.status}):`, updateText);
        }
      }
    } catch (err) {
      console.error('[GoogleDocs] Error during Google Doc API copy & batchUpdate:', err);
    }
  } else {
    console.warn('[GoogleDocs] No Google OAuth accessToken provided in request or user model.');
  }

  // Fallback unique document ID if direct API copy was not executed
  if (!docId) {
    docId = `${templateId}_${quote.refId}`;
  }

  const documentUrl = `https://docs.google.com/document/d/${docId}/edit`;
  const pdfUrl = `https://docs.google.com/document/d/${docId}/export?format=pdf`;

  return {
    templateId,
    docId,
    documentUrl,
    pdfUrl,
    requests,
    replacements
  };
}

module.exports = {
  resolveGoogleDocTemplateId,
  buildReplacementRequests,
  generateAndStoreAgreementDoc
};
