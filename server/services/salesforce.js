const axios = require('axios');
const crypto = require('crypto');

const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;
const OAUTH_BASE_URL = 'https://login.salesforce.com/services/oauth2';
const REDIRECT_URI = 'http://localhost:3000/oauth/callback';

module.exports.generateCodeChallenge = () => {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  return { codeVerifier, codeChallenge };
};

module.exports.getAuthorizationUrl = (codeChallenge) =>
  [
    `${OAUTH_BASE_URL}/authorize`,
    `?response_type=code`,
    `&client_id=${CONSUMER_KEY}`,
    `&redirect_uri=${REDIRECT_URI}`,
    `&scope=api%20refresh_token`,
    `&code_challenge=${codeChallenge}`,
    `&code_challenge_method=S256`,
  ].join('');

module.exports.getAccessToken = async (code, codeVerifier) => {
  const data = {
    grant_type: 'authorization_code',
    code,
    client_id: CONSUMER_KEY,
    client_secret: CONSUMER_SECRET,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
  };

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const { data: responseData } = await axios.post(
    `${OAUTH_BASE_URL}/token`,
    data,
    { headers },
  );

  return responseData;
};
