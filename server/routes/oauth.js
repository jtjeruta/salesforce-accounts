const express = require('express');
const router = express.Router();
const {
  generateCodeChallenge,
  getAuthorizationUrl,
  getAccessToken,
} = require('../services/salesforce');

router.get('/login', (req, res) => {
  try {
    const { codeVerifier, codeChallenge } = generateCodeChallenge();
    const authorizationUrl = getAuthorizationUrl(codeChallenge);
  
    if (!req.session.salesForce) req.session.salesForce = {};
    req.session.salesForce.codeVerifier = codeVerifier;
    res.redirect(authorizationUrl);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/callback', async (req, res) => {
  if (req.query.error) {
    const data = {
      error: req.query.error,
      description: req.query.error_description,
    };

    return res.status(400).json(data);
  }

  try {
    const { code } = req.query;
    const response = await getAccessToken(code, req.session.salesForce.codeVerifier);

    if (!req.session.salesForce) req.session.salesForce = {};
    req.session.salesForce.accessToken = response.access_token;
    req.session.salesForce.refreshToken = response.refresh_token;
    req.session.salesForce.signature = response.signature;
    req.session.salesForce.instanceUrl = response.instance_url;
    req.session.salesForce.id = response.id;
    req.session.salesForce.issuedAt = response.issued_at;

    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.redirect(`/?error=${encodeURIComponent(error.message)}`);
  }
});

router.get('/status', (req, res) => {
  const salesForce = req.session.salesForce || {};

  res.status(200).json({
    connected: Boolean(salesForce.accessToken && salesForce.instanceUrl),
    instanceUrl: salesForce.instanceUrl || null,
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ error: 'Failed to log out' });
    }

    res.clearCookie('connect.sid', { path: '/' });
    return res.status(200).json({ success: true });
  });
});

module.exports = router;
