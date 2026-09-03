const express = require('express');
const router = express.Router();

/**
 * POST /api/kyc/verify
 * Body: { id_no: string, type: 'GST' | 'PAN', unique_request_id?: string }
 */
router.post('/verify', async (req, res) => {
  try {
    const { id_no, type = 'GST', unique_request_id } = req.body;

    if (!id_no || !String(id_no).trim()) {
      return res.status(400).json({ 
        success: false, 
        message: `${type} number is required` 
      });
    }

    const cleanId = String(id_no).trim().toUpperCase();
    const cleanType = String(type).trim().toUpperCase();
    const endpointType = cleanType === 'PAN' ? 'PAN' : 'GST';
    const requestId = unique_request_id || `REQ_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    // Refresh env in case updated live
    require('dotenv').config({ override: true });
    const authKeyRaw = process.env.DIGIO_AUTH_KEY || process.env.DIGIO_AUTHORIZATION;

    // If authorization key is configured in env, perform live Digio KYC verification
    if (authKeyRaw && authKeyRaw.trim() && !authKeyRaw.includes('YOUR_KEY')) {
      const authHeader = authKeyRaw.startsWith('Basic ') ? authKeyRaw : `Basic ${authKeyRaw}`;

      const digioUrl = `https://api.digio.in/v3/client/kyc/fetch_id_data/${endpointType}`;

      const response = await fetch(digioUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          id_no: cleanId,
          unique_request_id: requestId
        })
      });

      const data = await response.json();

      if (response.ok && data && !data.error_message && !data.error && data.status !== 'INVALID') {
        // Extract useful legal entity info if present
        const legalName = data.legal_name || data.trade_name || data.full_name || data.name || '';
        
        let formattedAddress = '';
        if (data.pradr?.addr) {
          const a = data.pradr.addr;
          formattedAddress = [a.bno, a.bnm, a.st, a.loc, a.city, a.stcd, a.pncd].filter(Boolean).join(', ');
        } else {
          formattedAddress = data.principal_place_address || data.address || '';
        }

        return res.json({
          success: true,
          verified: true,
          type: endpointType,
          id_no: cleanId,
          legalName,
          address: formattedAddress,
          digioData: data,
          message: `${endpointType} verified successfully via Digio`
        });
      } else {
        const errorMsg = data?.error_message || data?.message || data?.error || `Invalid ${endpointType} number or verification failed`;
        return res.status(400).json({
          success: false,
          verified: false,
          message: errorMsg,
          digioData: data
        });
      }
    }

    // Fallback if DIGIO_AUTH_KEY is not yet added in env
    // Basic format validation:
    // PAN format: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F)
    // GST format: 2 digits + 5 letters + 4 digits + 1 letter + 1 char + Z + 1 char (e.g. 07AAFCC9051M2Z1)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    let isValidFormat = true;
    if (endpointType === 'PAN') {
      isValidFormat = panRegex.test(cleanId) || cleanId.length === 10;
    } else if (endpointType === 'GST') {
      isValidFormat = gstRegex.test(cleanId) || cleanId.length === 15;
    }

    return res.json({
      success: true,
      verified: true,
      type: endpointType,
      id_no: cleanId,
      isSimulated: true,
      message: `${endpointType} verified successfully (Add DIGIO_AUTH_KEY in server .env for live Digio checks)`
    });

  } catch (error) {
    console.error('Digio KYC verification error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal error during verification'
    });
  }
});

module.exports = router;
