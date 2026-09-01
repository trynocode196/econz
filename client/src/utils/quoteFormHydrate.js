/** Attach full customer from list or id when API returns only an id */
export function linkCustomerOnQuote(quote, customers = []) {
  if (!quote || !customers.length) return quote;

  const customerId = quote.customer?._id || quote.customer;
  const linked = customers.find(
    (c) =>
      (customerId && String(c._id) === String(customerId)) ||
      (quote.customerName &&
        c.account?.toLowerCase() === String(quote.customerName).toLowerCase())
  );

  if (!linked) return quote;

  const existing =
    quote.customer && typeof quote.customer === 'object' && !Array.isArray(quote.customer)
      ? quote.customer
      : {};

  return { ...quote, customer: { ...linked, ...existing } };
}

/** Flatten quote + linked customer into form field values */
export function normalizeQuoteForForm(quote) {
  if (!quote) return quote;

  const customer =
    quote.customer && typeof quote.customer === 'object' && !Array.isArray(quote.customer)
      ? quote.customer
      : null;

  const primaryContact =
    customer?.contacts?.find((c) => c?.email || c?.name) || customer?.contacts?.[0] || {};

  return {
    ...quote,
    customerName: quote.customerName || customer?.account || '',
    companyShortName: quote.companyShortName || customer?.companyShortName || '',
    taxIdType: quote.taxIdType || customer?.taxIdType || 'PAN',
    industry: quote.orderIndustry || quote.industry || customer?.industry || '',
    orderIndustry: quote.orderIndustry || quote.industry || customer?.industry || '',
    orderAddress: quote.orderAddress || customer?.address || '',
    orderPan: quote.orderPan || customer?.pan || '',
    entity: quote.entity || customer?.entity || quote.entity || 'India',
    billTo: quote.billTo || customer?.customerType || quote.billTo || 'Direct',
    pocName: quote.pocName || primaryContact.name || '',
    pocEmail: quote.pocEmail || primaryContact.email || '',
    pocMobile: quote.pocMobile || primaryContact.phone || '',
    pocDesignation: quote.pocDesignation || primaryContact.role || '',
  };
}

/**
 * Apply a quote API record onto Create Order form state.
 * Returns metadata used for edit mode (refId, status).
 */
export function applyQuoteToForm(quote, setters) {
  const normalized = normalizeQuoteForForm(quote);
  const lines = normalized.products?.length ? normalized.products : normalized.skus;
  const firstDomain = lines?.[0]?.domain || normalized.domain || '';

  const isIndia = (normalized.entity || 'India') === 'India';

  setters.setCustomerName(normalized.customerName || '');
  setters.setCompanyShortName(normalized.companyShortName || '');
  setters.setTaxIdType(normalized.taxIdType || 'PAN');
  setters.setDealType(normalized.dealType || 'Renewal');
  setters.setCurrency(normalized.currency || 'INR');
  setters.setEntity(normalized.entity || 'India');
  setters.setBillTo(normalized.billTo || 'Direct');
  setters.setDomain(firstDomain);
  setters.setIndustry(normalized.orderIndustry || normalized.industry || '');
  setters.setAddress(normalized.orderAddress || '');

  if (isIndia) {
    setters.setPan(normalized.orderPan || '');
    setters.setTaxIdVerified(Boolean(String(normalized.orderPan || '').trim()));
    setters.setVat('');
  } else {
    setters.setVat(normalized.orderPan || '');
    setters.setPan('');
    setters.setTaxIdVerified(true);
  }

  setters.setPocName(normalized.pocName || '');
  setters.setPocEmail(normalized.pocEmail || '');
  setters.setPocMobile(normalized.pocMobile || '');
  setters.setPocDesignation(normalized.pocDesignation || '');

  if (normalized.template) {
    setters.setSelectedTemplate(normalized.template);
  }

  if (lines?.length) {
    setters.setOrderSkus(
      lines.map((s) => ({
        domain: s.domain || firstDomain,
        name: s.name || '',
        qty: s.qty ?? 1,
        listPrice: s.listPrice ?? 0,
        partnerDiscRate: s.partnerDiscRate ?? 0.12,
        partnerDiscAmt: s.partnerDiscAmt ?? 0,
        priceAfterPartnerDisc: s.priceAfterPartnerDisc ?? 0,
        googleDiscPct: s.googleDiscPct ?? 0,
        googleDiscAmt: s.googleDiscAmt ?? 0,
        buyPrice: s.buyPrice ?? 0,
        sellPrice: s.sellPrice ?? '',
        profit: s.profit ?? 0,
        marginPct: s.marginPct ?? 0,
        custDiscPct: s.custDiscPct ?? 0,
        subPlan: s.subPlan || '12 Months',
        paymentPlan: s.paymentPlan || 'Half - Yearly',
        creditLimit: s.creditLimit || '7 Days',
        startDate: s.startDate || '',
        endDate: s.endDate || '',
        renewalDate: s.renewalDate || '',
        isValid: true,
        requiresApproval: Boolean(s.requiresApproval),
      }))
    );
  }

  return {
    refId: normalized.refId,
    status: normalized.status || 'Draft',
    title: normalized.title || 'Standard Order',
  };
}
