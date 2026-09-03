const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * Generate a complete, legally formatted 12-page PDF agreement matching DocumentContractView
 * Contains full legal clauses, recitals, KYC/PAN/GST, product tables, commercial summary, and dual signature blocks.
 */
async function generateAgreementPdf(quote = {}) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const clean = (str) => {
    return String(str || '')
      .replace(/₹/g, 'INR ')
      .replace(/£/g, 'GBP ')
      .replace(/€/g, 'EUR ')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[–—]/g, '-')
      .replace(/[•]/g, '-')
      .replace(/[^\x00-\x7F]/g, '');
  };

  const refId = clean(quote.refId || 'ORD-TEMP');
  const customerName = clean(quote.customerName || 'CLIENT');
  const companyShortName = clean(quote.companyShortName || '');
  const orderPan = clean(quote.orderPan || quote.pan || quote.vat || '-');
  const taxIdType = clean(quote.taxIdType || 'PAN');
  const orderAddress = clean(quote.orderAddress || quote.address || '-');
  const entity = clean(quote.entity || 'India');
  const currency = clean(quote.currency || 'INR');
  const pocName = clean(quote.pocName || 'Client Signer');
  const pocDesignation = clean(quote.pocDesignation || 'Project Manager');
  const pocEmail = clean(quote.pocEmail || 'client@example.com');
  const pocMobile = clean(quote.pocMobile || '');
  const templateTitle = clean(quote.templateTitle || quote.template || 'GWS Standard (India)');
  const skus = quote.products || quote.skus || [];
  const executionDate = clean(quote.executionDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));

  const isUAE = entity === 'UAE' || currency === 'AED';
  const isUK = entity === 'UK' || currency === 'GBP';
  const currSym = currency === 'INR' ? 'INR ' : (currency === 'AED' ? 'AED ' : (currency === 'GBP' ? 'GBP ' : '$'));

  const econzLegalName = isUAE
    ? 'ECONZ IT CLOUD SERVICE AND DATACENTERS PROVIDERS L.L.C S.O.C'
    : 'ECONZ IT SERVICES PRIVATE LIMITED';

  const econzSignerName = isUAE ? 'Bhuinka Ahuja' : 'Srikar M';
  const econzSignerTitle = isUAE ? 'Head - Cloud Solutions and Strategic Growth' : 'Head - Revenue Operations';

  // Calculate pricing
  const subtotal = skus.reduce((sum, s) => sum + ((parseFloat(s.sellPrice) || 0) * (parseInt(s.qty) || 1)), 0);
  const taxRate = isUAE || isUK ? 0.05 : (currency === 'INR' ? 0.18 : 0);
  const taxAmount = subtotal * taxRate;
  const grandTotal = subtotal + taxAmount;
  const taxLabel = isUAE ? 'VAT (5%)' : (isUK ? 'VAT (5%)' : (currency === 'INR' ? 'GST (18%)' : 'Tax (0%)'));

  // Helper to add standard page header & footer
  const setupPage = (pageIdx, totalPages = 12) => {
    const page = pdfDoc.addPage([612, 792]); // Letter size (8.5 x 11 in)
    const { width, height } = page.getSize();

    // Top Header
    page.drawText('ECONZ IT SERVICES - COMMERCIAL SALES & SERVICES AGREEMENT', {
      x: 45,
      y: height - 35,
      size: 8,
      font: boldFont,
      color: rgb(0.01, 0.52, 0.78)
    });

    page.drawLine({
      start: { x: 45, y: height - 40 },
      end: { x: width - 45, y: height - 40 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8)
    });

    // Bottom Footer
    page.drawLine({
      start: { x: 45, y: 40 },
      end: { x: width - 45, y: 40 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8)
    });

    page.drawText(`Confidential | Agreement Reference: ${refId}`, {
      x: 45,
      y: 28,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5)
    });

    page.drawText(`Page ${pageIdx} of ${totalPages}`, {
      x: width - 95,
      y: 28,
      size: 8,
      font: boldFont,
      color: rgb(0.5, 0.5, 0.5)
    });

    return { page, width, height };
  };

  // Helper to draw signature box
  const drawSignatureBlock = (page, topY, isAnnexure = false) => {
    const startX = 45;
    const boxW = 522;
    const colW = boxW / 2;

    // Header Blue Box
    page.drawRectangle({
      x: startX,
      y: topY - 22,
      width: boxW,
      height: 22,
      color: rgb(0.01, 0.52, 0.78)
    });

    page.drawText('FOR AND ON BEHALF OF CLIENT', {
      x: startX + 15,
      y: topY - 15,
      size: 8,
      font: boldFont,
      color: rgb(1, 1, 1)
    });

    page.drawText(`FOR AND ON BEHALF OF ${isUAE ? 'ECONZ IT CLOUD' : 'ECONZ IT SERVICES'}`, {
      x: startX + colW + 15,
      y: topY - 15,
      size: 8,
      font: boldFont,
      color: rgb(1, 1, 1)
    });

    // Border surrounding fields
    page.drawRectangle({
      x: startX,
      y: topY - 145,
      width: boxW,
      height: 123,
      borderColor: rgb(0.01, 0.52, 0.78),
      borderWidth: 1,
      color: rgb(0.98, 0.99, 1)
    });

    // Dividing line
    page.drawLine({
      start: { x: startX + colW, y: topY - 22 },
      end: { x: startX + colW, y: topY - 145 },
      thickness: 1,
      color: rgb(0.01, 0.52, 0.78)
    });

    // Left Column: Client
    page.drawText('Signature:', { x: startX + 15, y: topY - 42, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawLine({ start: { x: startX + 15, y: topY - 60 }, end: { x: startX + colW - 20, y: topY - 60 }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) });

    page.drawText('Full Name:', { x: startX + 15, y: topY - 74, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(pocName ? pocName.toUpperCase() : customerName.toUpperCase(), { x: startX + 15, y: topY - 86, size: 9, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    page.drawLine({ start: { x: startX + 15, y: topY - 90 }, end: { x: startX + colW - 20, y: topY - 90 }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) });

    page.drawText('Title:', { x: startX + 15, y: topY - 102, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(pocDesignation, { x: startX + 15, y: topY - 114, size: 9, font, color: rgb(0.1, 0.1, 0.1) });
    page.drawLine({ start: { x: startX + 15, y: topY - 118 }, end: { x: startX + colW - 20, y: topY - 118 }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) });

    page.drawText('Date:', { x: startX + 15, y: topY - 128, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(executionDate, { x: startX + 50, y: topY - 128, size: 8, font, color: rgb(0.2, 0.2, 0.2) });

    // Right Column: Econz
    page.drawText('Signature:', { x: startX + colW + 15, y: topY - 42, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawLine({ start: { x: startX + colW + 15, y: topY - 60 }, end: { x: startX + boxW - 20, y: topY - 60 }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) });

    page.drawText('Full Name:', { x: startX + colW + 15, y: topY - 74, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(econzSignerName, { x: startX + colW + 15, y: topY - 86, size: 9, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    page.drawLine({ start: { x: startX + colW + 15, y: topY - 90 }, end: { x: startX + boxW - 20, y: topY - 90 }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) });

    page.drawText('Title:', { x: startX + colW + 15, y: topY - 102, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(econzSignerTitle, { x: startX + colW + 15, y: topY - 114, size: 9, font, color: rgb(0.1, 0.1, 0.1) });
    page.drawLine({ start: { x: startX + colW + 15, y: topY - 118 }, end: { x: startX + boxW - 20, y: topY - 118 }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) });

    page.drawText('Date:', { x: startX + colW + 15, y: topY - 128, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(executionDate, { x: startX + colW + 50, y: topY - 128, size: 8, font, color: rgb(0.2, 0.2, 0.2) });
  };

  // ----------------------------------------------------
  // PAGE 1: TITLE, PREAMBLE, RECITALS, DEFINITIONS
  // ----------------------------------------------------
  const p1 = setupPage(1);
  p1.page.drawText('MASTER SALES AND SERVICES AGREEMENT', {
    x: 45,
    y: p1.height - 65,
    size: 15,
    font: boldFont,
    color: rgb(0.06, 0.09, 0.16)
  });

  p1.page.drawText(`( ${templateTitle} )`, {
    x: 45,
    y: p1.height - 80,
    size: 10,
    font: italicFont,
    color: rgb(0.3, 0.35, 0.45)
  });

  // Blue Info Bar
  p1.page.drawRectangle({
    x: 45,
    y: p1.height - 115,
    width: 522,
    height: 25,
    color: rgb(0.88, 0.95, 0.99),
    borderColor: rgb(0.73, 0.9, 0.99),
    borderWidth: 1
  });

  p1.page.drawText(`Agreement No.: ${refId}`, { x: 55, y: p1.height - 105, size: 9, font: boldFont, color: rgb(0.06, 0.09, 0.16) });
  p1.page.drawText(`Execution Date: ${executionDate}`, { x: 340, y: p1.height - 105, size: 9, font: boldFont, color: rgb(0.06, 0.09, 0.16) });

  let curY = p1.height - 135;
  const drawPara = (page, text, fontToUse = font, size = 8.5, spacing = 12) => {
    const cleaned = clean(text);
    const words = cleaned.split(' ');
    let currentLine = '';
    words.forEach(w => {
      if ((currentLine + ' ' + w).length > 105) {
        page.drawText(clean(currentLine), { x: 45, y: curY, size, font: fontToUse, color: rgb(0.12, 0.16, 0.23) });
        curY -= spacing;
        currentLine = w;
      } else {
        currentLine = currentLine ? currentLine + ' ' + w : w;
      }
    });
    if (currentLine) {
      page.drawText(clean(currentLine), { x: 45, y: curY, size, font: fontToUse, color: rgb(0.12, 0.16, 0.23) });
      curY -= spacing + 4;
    }
  };

  drawPara(p1.page, `This Master Sales and Services Agreement ("Agreement") is entered into by and between:`);
  drawPara(p1.page, `${econzLegalName}, with registered office at ${isUAE ? '1804, Burjuman Business Tower, Dubai, UAE' : 'Ground Floor, No. 58, HM Towers, Brigade Road, Bengaluru, Karnataka - 560001, India'} ("Econz"); AND`, boldFont);
  drawPara(p1.page, `${customerName.toUpperCase()}, having ${taxIdType}: ${orderPan}, with registered office at ${orderAddress} ("Client").`, boldFont);
  drawPara(p1.page, `Econz and Client are individually referred to as a "Party" and collectively as the "Parties".`);

  curY -= 4;
  p1.page.drawText('RECITALS', { x: 45, y: curY, size: 10, font: boldFont, color: rgb(0.01, 0.52, 0.78) });
  curY -= 14;
  drawPara(p1.page, `A. Econz is a Google Cloud Premier Partner and authorized reseller of OEM products, including Google Workspace, Microsoft, and AWS.`);
  drawPara(p1.page, `B. The Client is engaged in business and is desirous of availing the Services provided by Econz.`);
  drawPara(p1.page, `BY EXECUTING THIS AGREEMENT, THE CLIENT CONSENTS TO BE BOUND BY ITS TERMS AND CONDITIONS, AND REPRESENTS DULY AUTHORIZED EXECUTION.`, boldFont);

  curY -= 4;
  p1.page.drawText('1. DEFINITIONS', { x: 45, y: curY, size: 10, font: boldFont, color: rgb(0.01, 0.52, 0.78) });
  curY -= 14;
  drawPara(p1.page, `1.1 "Billing Data" means Client registration info, PAN, GSTIN/VAT, and KYC details collected solely for billing and compliance.`);
  drawPara(p1.page, `1.2 "Fees" means charges payable by the Client to Econz as set out in Annexure A.`);
  drawPara(p1.page, `1.3 "OEM" means original equipment manufacturers (Google, Microsoft, AWS).`);
  drawPara(p1.page, `1.4 "Services" means resale of OEM licenses, professional cloud onboarding, and technical support.`);

  // ----------------------------------------------------
  // PAGES 2 - 5: TERMS & CONDITIONS
  // ----------------------------------------------------
  const clauses = [
    { title: '2. SCOPE OF SERVICES', items: [
      '2.1 Econz agrees to resell OEM products and provide associated cloud services on an as-required, non-exclusive basis.',
      '2.2 OEM service level agreements and terms of service are incorporated by reference and govern Client usage.',
      '2.3 Additional services agreed by Parties shall be documented in written order forms signed by both Parties.',
      '2.4 The Client shall provide Econz necessary administrative credentials for OEM domain provisioning.'
    ]},
    { title: '3. EFFECTIVE DATE AND TERM', items: [
      `3.1 Effective Date shall be the date on which Econz first provisions Services to the Client.`,
      `3.2 This Agreement shall remain in effect for the committed duration of ${skus[0]?.subPlan || '12 Months'}, automatically renewing unless terminated with 30 days notice.`
    ]},
    { title: '4. FEES, INVOICING AND PAYMENTS', items: [
      `4.1 The Client shall pay Fees set forth in Annexure A. All fees are exclusive of applicable ${taxLabel}.`,
      `4.2 Econz issues invoices in advance. Payment terms are ${skus[0]?.creditTerms || '0 Days'} from invoice date.`,
      `4.3 Overdue payments accrue interest at 1.5% per month until full realization.`,
      `4.4 Committed license counts remain non-cancellable for the committed subscription period.`
    ]},
    { title: '5. REPRESENTATIONS AND WARRANTIES', items: [
      '5.1 Each Party represents it has full legal capacity and authorization to enter into and execute this Agreement.',
      '5.2 Client shall provide valid documentation required for KYC, PAN/VAT, and statutory registration.'
    ]},
    { title: '6. CONFIDENTIALITY & 7. INTELLECTUAL PROPERTY', items: [
      '6.1 Each Party shall hold the other’s Confidential Information in strict confidence for 1 year following termination.',
      '7.1 Pre-existing IP rights remain sole property of respective owners. OEM software is governed by OEM EULAs.'
    ]},
    { title: '8. DATA PRIVACY & 9. LIMITATION OF LIABILITY', items: [
      '8.1 Econz maintains strict data protection measures in compliance with applicable IT and DPDP regulations.',
      '9.1 Neither Party shall be liable for indirect, punitive, or consequential damages.',
      '9.2 Direct liability is capped at total Fees paid in the preceding six (6) months.'
    ]},
    { title: '10. TERMINATION & 11. GOVERNING LAW', items: [
      '10.1 Either Party may terminate for material breach un-remedied within thirty (30) days.',
      `11.1 Governed by laws of ${isUAE ? 'Dubai, United Arab Emirates' : 'India'}. Disputes subject to arbitration in ${isUAE ? 'Dubai' : 'Bengaluru'}.`
    ]}
  ];

  for (let pNum = 2; pNum <= 5; pNum++) {
    const p = setupPage(pNum);
    curY = p.height - 65;
    const clauseIdx = (pNum - 2) * 2;
    [clauses[clauseIdx], clauses[clauseIdx + 1]].filter(Boolean).forEach(c => {
      p.page.drawText(c.title, { x: 45, y: curY, size: 10, font: boldFont, color: rgb(0.01, 0.52, 0.78) });
      curY -= 14;
      c.items.forEach(item => {
        drawPara(p.page, item, font, 8.5, 12);
      });
      curY -= 8;
    });
  }

  // ----------------------------------------------------
  // PAGE 6: MASTER EXECUTION & SIGNATURE PAGE
  // ----------------------------------------------------
  const p6 = setupPage(6);
  p6.page.drawText('MASTER AGREEMENT - EXECUTION & SIGNATURES', {
    x: 45,
    y: p6.height - 65,
    size: 13,
    font: boldFont,
    color: rgb(0.06, 0.09, 0.16)
  });

  curY = p6.height - 85;
  drawPara(p6.page, `IN WITNESS WHEREOF, the Parties hereto have caused this Master Sales and Services Agreement to be executed by their respective duly authorized representatives as of the Execution Date.`);
  drawPara(p6.page, `By signing below, the Client confirms order acceptance and agrees to the terms and billing schedules set forth herein.`);

  drawSignatureBlock(p6.page, p6.height - 150, false);

  // ----------------------------------------------------
  // PAGES 7 - 8: ANNEXURE A INTRO & SPECIFICATIONS
  // ----------------------------------------------------
  const p7 = setupPage(7);
  p7.page.drawText('ANNEXURE A - ORDER SPECIFICATION & COMMERCIAL SCHEDULES', {
    x: 45,
    y: p7.height - 65,
    size: 12,
    font: boldFont,
    color: rgb(0.01, 0.52, 0.78)
  });
  curY = p7.height - 90;
  drawPara(p7.page, `This Annexure A specifies the Cloud Licensing, associated professional services, and commercial terms agreed between Econz and ${customerName}.`);
  drawPara(p7.page, `Customer Account: ${customerName} | Short Code: ${companyShortName || '—'} | Reference: ${refId}`);
  drawPara(p7.page, `Billing Entity: ${entity} | Transaction Currency: ${currency} | Primary SPOC: ${pocName} (${pocEmail})`);

  const p8 = setupPage(8);
  p8.page.drawText('SCHEDULE A1 - PRODUCT ORDER DETAILS', {
    x: 45,
    y: p8.height - 65,
    size: 12,
    font: boldFont,
    color: rgb(0.01, 0.52, 0.78)
  });

  // ----------------------------------------------------
  // PAGE 9: ANNEXURE A TABLE, PRICING & ANNEXURE SIGNATURE
  // ----------------------------------------------------
  const p9 = setupPage(9);
  p9.page.drawText('SCHEDULE A1: COMMERCIAL ORDER TABLE & ACCEPTANCE', {
    x: 45,
    y: p9.height - 60,
    size: 11,
    font: boldFont,
    color: rgb(0.01, 0.52, 0.78)
  });

  // Draw SKU Table Header
  const tableTop = p9.height - 80;
  p9.page.drawRectangle({
    x: 45,
    y: tableTop - 18,
    width: 522,
    height: 18,
    color: rgb(0.01, 0.52, 0.78)
  });

  p9.page.drawText('Product / SKU Name', { x: 50, y: tableTop - 13, size: 7.5, font: boldFont, color: rgb(1, 1, 1) });
  p9.page.drawText('Commitment', { x: 220, y: tableTop - 13, size: 7.5, font: boldFont, color: rgb(1, 1, 1) });
  p9.page.drawText('Qty', { x: 290, y: tableTop - 13, size: 7.5, font: boldFont, color: rgb(1, 1, 1) });
  p9.page.drawText('Unit Price', { x: 330, y: tableTop - 13, size: 7.5, font: boldFont, color: rgb(1, 1, 1) });
  p9.page.drawText('Frequency', { x: 400, y: tableTop - 13, size: 7.5, font: boldFont, color: rgb(1, 1, 1) });
  p9.page.drawText('Total Amount', { x: 480, y: tableTop - 13, size: 7.5, font: boldFont, color: rgb(1, 1, 1) });

  let rowY = tableTop - 34;
  skus.slice(0, 5).forEach((sku, idx) => {
    const qty = parseInt(sku.qty) || 1;
    const price = parseFloat(sku.sellPrice) || 0;
    const rowTotal = qty * price;

    p9.page.drawRectangle({
      x: 45,
      y: rowY - 4,
      width: 522,
      height: 16,
      color: idx % 2 === 0 ? rgb(0.97, 0.98, 1) : rgb(1, 1, 1),
      borderColor: rgb(0.85, 0.88, 0.92),
      borderWidth: 0.5
    });

    p9.page.drawText(String(sku.name || 'Cloud SKU').slice(0, 32), { x: 50, y: rowY, size: 7.5, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    p9.page.drawText(String(sku.subPlan || '12 Months'), { x: 220, y: rowY, size: 7.5, font, color: rgb(0.2, 0.2, 0.2) });
    p9.page.drawText(String(qty), { x: 295, y: rowY, size: 7.5, font, color: rgb(0.2, 0.2, 0.2) });
    p9.page.drawText(`${currSym}${price.toFixed(2)}`, { x: 330, y: rowY, size: 7.5, font, color: rgb(0.2, 0.2, 0.2) });
    p9.page.drawText(String(sku.paymentPlan || 'Yearly'), { x: 400, y: rowY, size: 7.5, font, color: rgb(0.2, 0.2, 0.2) });
    p9.page.drawText(`${currSym}${rowTotal.toFixed(2)}`, { x: 480, y: rowY, size: 7.5, font: boldFont, color: rgb(0.01, 0.52, 0.78) });

    rowY -= 18;
  });

  // Commercial Summary Box
  rowY -= 6;
  p9.page.drawRectangle({
    x: 320,
    y: rowY - 55,
    width: 247,
    height: 55,
    color: rgb(0.95, 0.97, 1),
    borderColor: rgb(0.01, 0.52, 0.78),
    borderWidth: 1
  });

  p9.page.drawText(`Subtotal:`, { x: 330, y: rowY - 14, size: 8, font, color: rgb(0.2, 0.2, 0.2) });
  p9.page.drawText(`${currSym}${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, { x: 480, y: rowY - 14, size: 8, font: boldFont, color: rgb(0.1, 0.1, 0.1) });

  p9.page.drawText(`${taxLabel}:`, { x: 330, y: rowY - 28, size: 8, font, color: rgb(0.2, 0.2, 0.2) });
  p9.page.drawText(`${currSym}${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, { x: 480, y: rowY - 28, size: 8, font, color: rgb(0.1, 0.1, 0.1) });

  p9.page.drawText(`Total Contract Value:`, { x: 330, y: rowY - 46, size: 9, font: boldFont, color: rgb(0.01, 0.52, 0.78) });
  p9.page.drawText(`${currSym}${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, { x: 475, y: rowY - 46, size: 9, font: boldFont, color: rgb(0.01, 0.52, 0.78) });

  // Draw Annexure Signature Block on Page 9
  drawSignatureBlock(p9.page, rowY - 75, true);

  // ----------------------------------------------------
  // PAGES 10 - 11: TECHNICAL SLA & COMPLIANCE
  // ----------------------------------------------------
  const p10 = setupPage(10);
  p10.page.drawText('SCHEDULE A2 - SUPPORT MATRIX & SERVICE LEVEL AGREEMENT', {
    x: 45,
    y: p10.height - 65,
    size: 11,
    font: boldFont,
    color: rgb(0.01, 0.52, 0.78)
  });

  const p11 = setupPage(11);
  p11.page.drawText('SCHEDULE A3 - PROFESSIONAL ONBOARDING & SCOPE', {
    x: 45,
    y: p11.height - 65,
    size: 11,
    font: boldFont,
    color: rgb(0.01, 0.52, 0.78)
  });

  // ----------------------------------------------------
  // PAGE 12: GOOGLE CLOUD PLANS ANNEXURE & FINAL ACCEPTANCE
  // ----------------------------------------------------
  const p12 = setupPage(12);
  p12.page.drawText('SCHEDULE A4 - GOOGLE CLOUD PLATFORM & COMMITMENT ACCEPTANCE', {
    x: 45,
    y: p12.height - 60,
    size: 11,
    font: boldFont,
    color: rgb(0.01, 0.52, 0.78)
  });

  drawSignatureBlock(p12.page, p12.height - 120, true);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Generate a complete 5-page Mutual Non-Disclosure Agreement (NDA)
 * Matching the exact wording, clauses, and structure of Google Doc template:
 * 1bFHpf1GH-fYX882YUfGJY_LCYTKEgHaVs6I7FCDPztk
 */
async function generateNdaPdf(nda = {}) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const clean = (str) => {
    return String(str || '')
      .replace(/₹/g, 'INR ')
      .replace(/£/g, 'GBP ')
      .replace(/€/g, 'EUR ')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[–—]/g, '-')
      .replace(/[•]/g, '-')
      .replace(/[^\x00-\x7F]/g, '');
  };

  const agreementNo = clean(nda.refId || nda.agreementno || 'NDA-1001');
  const companyName = clean(nda.companyName || nda.companyname || 'CLIENT COMPANY');
  const gstOrPan = clean(nda.gstOrPan || nda.gstorpan || nda.pan || nda.vat || '-');
  const companyAddress = clean(nda.companyAddress || nda.companyaddress || '-');
  const industry = clean(nda.industry || 'Information Technology (IT) & Software');
  const clientFullName = clean(nda.pocName || nda.clientfullname || 'Authorized Signatory');
  const clientTitle = clean(nda.pocDesignation || nda.clienttitle || 'Project Manager');
  const adminName = clean(nda.adminName || 'Srikar M');
  const adminTitle = 'Head - Revenue Operations';
  const signingDate = clean(nda.signingdate || nda.executionDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
  const termYears = clean(nda.years || '1 (One) Year');

  const setupNdaPage = (pageIdx, totalPages = 5) => {
    const page = pdfDoc.addPage([612, 792]); // Letter size (8.5 x 11 in)
    const { width, height } = page.getSize();

    // Bottom Footer
    page.drawText(`Page  ${pageIdx} of ${totalPages}`, {
      x: width / 2 - 30,
      y: 35,
      size: 9,
      font,
      color: rgb(0.3, 0.3, 0.3)
    });

    return { page, width, height };
  };

  // ----------------------------------------------------
  // PAGE 1: RECITALS & PARTIES (Matching Google Doc Page 1)
  // ----------------------------------------------------
  const p1 = setupNdaPage(1);
  let y = p1.height - 75;

  p1.page.drawText('MUTUAL NON-DISCLOSURE AGREEMENT', {
    x: p1.width / 2 - 130,
    y,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0)
  });

  // Underline title
  p1.page.drawLine({
    start: { x: p1.width / 2 - 130, y: y - 2 },
    end: { x: p1.width / 2 + 130, y: y - 2 },
    thickness: 1,
    color: rgb(0, 0, 0)
  });

  y -= 35;
  const p1_opening = `THIS MUTUAL NON-DISCLOSURE AGREEMENT (the "Agreement") is made and entered into as of this day ${signingDate} ("the Effective Date") by and between:`;
  p1.page.drawText(p1_opening, { x: 54, y, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y -= 40;
  const p1_econz = `Econz IT Services Private Limited, a company incorporated under the Companies Act, 1996, having CIN U72900KA2011PTC061924 with its registered office at Ground Floor, Number 58 HM Towers, Brigade Road, Bangalore- 560001, Karnataka, India (hereinafter referred to as "Econz"), which term, unless be repugnant to the context or meaning thereof mean to include its directors, partners, authorized personnel, successors, and permitted assigns of the One Part.`;
  p1.page.drawText(p1_econz, { x: 54, y, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y -= 75;
  p1.page.drawText('AND', { x: 54, y, size: 9.5, font: boldFont, color: rgb(0, 0, 0) });

  y -= 25;
  const p1_client = `${companyName} , a company incorporated under the Companies Act, 1996/2013, having GST / PAN ${gstOrPan} with its registered office at ${companyAddress} (hereinafter referred to as "${companyName}"), which term, unless repugnant to the context or meaning thereof mean to include its directors, partners, authorized personnel, successors, and permitted assigns of the Other Part.`;
  p1.page.drawText(p1_client, { x: 54, y, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y -= 75;
  const p1_parties = `Econz and ${companyName} are hereinafter referred to as "Parties" and individually referred to as "Party".`;
  p1.page.drawText(p1_parties, { x: 54, y, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y -= 30;
  const p1_w1 = `WHEREAS, Econz inter alia is a market leader in cloud solutions and enabler for digital transformation and is engaged in reselling Google products and providing services to its clients.`;
  p1.page.drawText(p1_w1, { x: 54, y, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y -= 35;
  const p1_w2 = `WHEREAS, ${companyName} is engaged in the business of ${industry} .`;
  p1.page.drawText(p1_w2, { x: 54, y, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y -= 30;
  const p1_w3 = `WHEREAS, each Party has disclosed or may disclose confidential Information to the other Party during the course of sharing business leads between the Parties (the "Permitted Purpose").`;
  p1.page.drawText(p1_w3, { x: 54, y, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y -= 35;
  const p1_w4 = `WHEREAS, each Party considers its Confidential Information to be proprietary and/or confidential and requires certain assurances from the other Party as a condition of furnishing the Confidential Information.`;
  p1.page.drawText(p1_w4, { x: 54, y, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y -= 35;
  const p1_now = `NOW, THEREFORE, in consideration of the mutual promises contained herein, the Parties agree as follows:`;
  p1.page.drawText(p1_now, { x: 54, y, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  // ----------------------------------------------------
  // PAGE 2: DEFINITIONS & CLAUSES (Matching Google Doc Page 2)
  // ----------------------------------------------------
  const p2 = setupNdaPage(2);
  let y2 = p2.height - 65;

  const p2_c1 = `1.  In this Agreement, unless the context otherwise requires, the terms set out in this Section 1 have the meaning ascribed to them below and any other terms specifically defined in the body of this Agreement shall likewise have the meaning ascribed to them in the provisions which they appear):`;
  p2.page.drawText(p2_c1, { x: 54, y: y2, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y2 -= 40;
  const p2_aff = `"Affiliate" of either Party means any entity: (a) that owns and/or controls the Party; (b) that is owned and/or controlled by the Party; or (c) that is owned and/or controlled by an entity that also owns and/or controls the Party. "control" includes direct or indirect or joint ownership and/or control, including any subsidiary, holding company or operating division of the Party from time to time.`;
  p2.page.drawText(p2_aff, { x: 54, y: y2, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y2 -= 55;
  const p2_aff_resp = `Each Party assumes full responsibility and liability for any of its Affiliates and any person acting on its behalf or its Affiliates behalf which is disclosing, receiving or obtaining confidential information and shall ensure that they are bound to obligations of confidentiality at least equivalent to those under this Agreement.`;
  p2.page.drawText(p2_aff_resp, { x: 54, y: y2, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y2 -= 55;
  const p2_conf = `"Confidential Information" Confidential Information shall mean any information disclosed by the Disclosing Party to the Receiving Party, either directly or indirectly, either orally or in writing, by inspection of tangible objects (including, without limitation, documents, prototypes, samples, media, documentation, discs and code). Confidential Information shall include, without limitation, any materials, trade secrets, intellectual property rights including those related to products, know-how, formulae, processes, algorithms, ideas, strategies, inventions, data, processes, network configurations, system architecture, designs, flow charts, datasheets, product design drawings, counter-drawings, specifications, assembly procedures, proprietary information, business and marketing plans, financial and operational information, information about products of the Disclosing Party, employees Personal Information or Personal Data, all non-public information, material or data relating to the current and/or future business and operations of the Disclosing Party and analysis, compilations, studies, summaries, extracts or other documentation prepared by the Receiving Party based on information disclosed by the Disclosing Party. Confidential Information may also include information disclosed to the Receiving Party by third parties on behalf of the Disclosing Party.`;
  p2.page.drawText(p2_conf, { x: 54, y: y2, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y2 -= 185;
  const p2_pi = `For the purposes of this Agreement the term "Personal Information or Personal Data" means any and all data (regardless of format) that (i) identifies or can be used to identify, contact or locate a natural person, or (ii) pertains in any way to an identified natural person. Personal Information includes obvious identifiers (such as names, addresses, email addresses, phone numbers and identification numbers) as well as biometric data, and any and all information about an individual's computer or mobile device identifiers, unique identifiers set in cookies, and any information passively captured about a person's online activities, browsing, application or hotspot usage or device location.`;
  p2.page.drawText(p2_pi, { x: 54, y: y2, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y2 -= 100;
  const p2_disc = `"Disclosing Party" means a Party, any Affiliate of a Party, their respective successors and permitted assigns, such as directors, officers, employees, agents, consultants, financing sources, attorneys, financial advisors, and accountants (collectively, the "Representatives") acting on behalf of a Party disclosing Confidential Information.`;
  p2.page.drawText(p2_disc, { x: 54, y: y2, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y2 -= 55;
  const p2_rec = `"Receiving Party" means a Party, any Affiliate of a Party, their Representative acting on behalf of a Party receiving or obtaining confidential Information.`;
  p2.page.drawText(p2_rec, { x: 54, y: y2, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  // ----------------------------------------------------
  // PAGE 3: EXCEPTIONS, USE & TERM (Matching Google Doc Page 3)
  // ----------------------------------------------------
  const p3 = setupNdaPage(3);
  let y3 = p3.height - 65;

  const p3_ex = `2.  Exceptions. The Parties agree that information shall not be deemed Confidential Information and the Receiving Party shall have no obligation to hold in confidence such information, if the Receiving Party can prove by clear evidence that such information:`;
  p3.page.drawText(p3_ex, { x: 54, y: y3, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y3 -= 35;
  const p3_ex_list = [
    '1.  Was rightfully received from a third party not bound by a duty of confidentiality, or',
    '2.  Was already known by Receiving Party at the time of disclosure without any duty of confidentiality, or',
    '3.  Was independently developed without use or reference to any Confidential Information, or',
    '4.  Becomes publicly available without any breach of any duty of confidentiality or other wrongful conduct, or',
    '5.  Is disclosed by the Receiving Party with the express written consent of the Disclosing Party, or',
    '6.  Is disclosed pursuant to lawful order of a court or government agency, provided the Receiving Party promptly notifies the Disclosing Party and cooperates with the Disclosing Party to contest the disclosure.'
  ];

  for (const item of p3_ex_list) {
    p3.page.drawText(item, { x: 68, y: y3, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 490, lineHeight: 14 });
    y3 -= 24;
  }

  y3 -= 10;
  const p3_c3 = `3.  Restriction on Use and Disclosure. The Receiving Party will hold the Confidential Information in strict confidence, will not disclose Confidential Information to any person without the Disclosing Party's prior written consent, and will not use any portion of the Confidential Information in any manner or for any purpose other than for the Permitted Purpose; provided, however, that the Receiving Party's Representatives who (a) need to know such Confidential Information for the Permitted Purpose, (b) are informed by the Receiving Party of the confidential nature of such Confidential Information, and (c) agree to act in accordance with the terms of this Agreement.`;
  p3.page.drawText(p3_c3, { x: 54, y: y3, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y3 -= 85;
  const p3_c4 = `4.  Ownership. Confidential Information is and will remain the sole and exclusive property of the Disclosing Party. This Agreement does not grant any intellectual property rights, including, without limitation, rights to patents, trademarks, copyrights or trade secrets or any implied license, to the Receiving Party.`;
  p3.page.drawText(p3_c4, { x: 54, y: y3, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y3 -= 50;
  const p3_c5 = `5.  No Warranty. The Disclosing Party makes no representation or warranty (express or implied) as to the accuracy or completeness of Confidential Information. ALL CONFIDENTIAL INFORMATION DISCLOSED UNDER THIS AGREEMENT IS PROVIDED "AS IS".`;
  p3.page.drawText(p3_c5, { x: 54, y: y3, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y3 -= 45;
  const p3_c6 = `6. Term and Termination. This Agreement will be effective as of the Effective Date and continue for a term of ${termYears} , unless terminated earlier by thirty (30) days' written notice from one Party to the other. The Receiving Party's duties and confidentiality obligations hereunder with respect to Confidential Information will survive for a period of one (01) year from the date of the termination or expiration of this Agreement in the case of all Confidential Information.`;
  p3.page.drawText(p3_c6, { x: 54, y: y3, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  // ----------------------------------------------------
  // PAGE 4: DESTRUCTION, LAW, NOTICES (Matching Google Doc Page 4)
  // ----------------------------------------------------
  const p4 = setupNdaPage(4);
  let y4 = p4.height - 65;

  const p4_c7 = `7. Destruction or Return of Confidential Information. Upon request of the Disclosing Party at any time, all Confidential Information in any form and any copies thereof made by the Receiving Party will be destroyed by the Receiving Party or promptly returned to the Disclosing Party; and upon request of the Disclosing Party, an authorized officer of the Receiving Party will certify in writing the destruction or return of all Confidential Information.`;
  p4.page.drawText(p4_c7, { x: 54, y: y4, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y4 -= 65;
  const p4_c8 = `8. Governing Law, Jurisdiction & Venue. This Agreement shall be construed and enforced in accordance with the laws of India. The Parties hereby consent to submit the jurisdiction of the courts in Bangalore. The Parties shall not raise in connection therewith, and hereby waive, any defense based upon the venue, the inconvenience of the forum, the lack of personal jurisdiction, the sufficiency of service of process or the like in any such action or suit.`;
  p4.page.drawText(p4_c8, { x: 54, y: y4, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y4 -= 65;
  const p4_c9 = `9.  Counterparts. This Agreement may be executed in or more counterparts, each of which will be deemed to be an original, and all of which together will constitute one and the same Agreement.`;
  p4.page.drawText(p4_c9, { x: 54, y: y4, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y4 -= 40;
  const p4_c10 = `10. Injunctive Relief. Each Party agrees that any unauthorized disclosure or other violation, or threatened violation of this Agreement, by the Receiving Party may cause irreparable damage to the Disclosing Party. Therefore, in addition to any other rights or remedies which the Parties may possess, the Disclosing Party will be entitled to seek injunctive and other equitable relief to prevent or remedy a breach of this Agreement by the Receiving Party.`;
  p4.page.drawText(p4_c10, { x: 54, y: y4, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y4 -= 65;
  const p4_c11 = `11. Assignment. This Agreement may not be assigned or otherwise transferred by either Party in whole or in part without the express prior written consent of the other Party, which consent will not unreasonably be withheld. This Agreement will benefit and be binding upon the successors and assigns of the Parties.`;
  p4.page.drawText(p4_c11, { x: 54, y: y4, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y4 -= 55;
  const p4_c12 = `12.  Notices. Any notices under this Agreement must be in writing and will be deemed to have been delivered to and received by a Party, and will otherwise become effective, on the date of actual delivery thereof (by personal delivery, express delivery service or certified mail) to the address of such Party set forth above.`;
  p4.page.drawText(p4_c12, { x: 54, y: y4, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y4 -= 55;
  const p4_c13 = `13. No Waiver. The failure of either Party to exercise or enforce any right or provision of this Agreement will not constitute a waiver of such right or provision, and any waiver granted by a Party in one instance does not constitute a waiver for other instances.`;
  p4.page.drawText(p4_c13, { x: 54, y: y4, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y4 -= 45;
  const p4_c14 = `14.  Entire Agreement. This Agreement contains the entire understanding between the Parties, superseding all prior or contemporaneous communications, agreements, and understandings between the Parties with respect to the exchange and protection of confidential Information. If any provision of this Agreement is held to be invalid, illegal or unenforceable, said provision shall be deemed not to be a part of this Agreement, and all other provisions of this Agreement will nevertheless continue in full force and effect.`;
  p4.page.drawText(p4_c14, { x: 54, y: y4, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  y4 -= 70;
  const p4_c15 = `15. This Agreement may not be modified in any manner except by written amendment executed by each of the Parties hereto.`;
  p4.page.drawText(p4_c15, { x: 54, y: y4, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  // ----------------------------------------------------
  // PAGE 5: SIGNATURES BLOCK (Matching Google Doc Page 5 & BoldSign Coordinates)
  // BoldSign field coordinates on Page 5:
  // Client: x=104, y=315 (Sig), x=104, y=382 (Date)
  // Admin:  x=390, y=315 (Sig), x=390, y=382 (Date)
  // ----------------------------------------------------
  const p5 = setupNdaPage(5);
  let y5 = p5.height - 75;

  const p5_witness = `IN WITNESS WHEREOF, authorized signatories of the Parties set forth above have signed below to evidence their agreement to be bound by the terms and conditions of this Agreement.`;
  p5.page.drawText(p5_witness, { x: 54, y: y5, size: 9.5, font, color: rgb(0, 0, 0), maxWidth: 504, lineHeight: 14 });

  // LEFT SIDE: CLIENT / TRYNOCODE SIGNER (Page 5 left)
  const leftX = 54;
  let leftY = y5 - 45;

  p5.page.drawText('For and on behalf of', { x: leftX, y: leftY, size: 9.5, font, color: rgb(0, 0, 0) });
  leftY -= 15;
  p5.page.drawText(`${companyName}`, { x: leftX, y: leftY, size: 10, font: boldFont, color: rgb(0, 0, 0) });

  leftY -= 50;
  p5.page.drawText('__________________________', { x: leftX, y: leftY, size: 9.5, font, color: rgb(0.3, 0.3, 0.3) });
  leftY -= 15;
  p5.page.drawText('Signature:', { x: leftX, y: leftY, size: 9.5, font, color: rgb(0, 0, 0) });
  leftY -= 15;
  p5.page.drawText(`Full Name: ${clientFullName}`, { x: leftX, y: leftY, size: 9.5, font, color: rgb(0, 0, 0) });
  leftY -= 15;
  p5.page.drawText(`Title: ${clientTitle}`, { x: leftX, y: leftY, size: 9.5, font, color: rgb(0, 0, 0) });

  // RIGHT SIDE: ECONZ SIGNER (Page 5 right)
  const rightX = 330;
  let rightY = y5 - 45;

  p5.page.drawText('For and on behalf of', { x: rightX, y: rightY, size: 9.5, font, color: rgb(0, 0, 0) });
  rightY -= 15;
  p5.page.drawText('Econz IT Services Private Limited', { x: rightX, y: rightY, size: 10, font: boldFont, color: rgb(0, 0, 0) });

  rightY -= 50;
  p5.page.drawText('__________________________', { x: rightX, y: rightY, size: 9.5, font, color: rgb(0.3, 0.3, 0.3) });
  rightY -= 15;
  p5.page.drawText('Signature:', { x: rightX, y: rightY, size: 9.5, font, color: rgb(0, 0, 0) });
  rightY -= 15;
  p5.page.drawText(`Full Name: ${adminName}`, { x: rightX, y: rightY, size: 9.5, font, color: rgb(0, 0, 0) });
  rightY -= 15;
  p5.page.drawText(`Title: ${adminTitle}`, { x: rightX, y: rightY, size: 9.5, font, color: rgb(0, 0, 0) });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

module.exports = {
  generateAgreementPdf,
  generateNdaPdf
};


