const axios = require('axios');
const crypto = require('crypto');

const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;
const OAUTH_BASE_URL = 'https://login.salesforce.com/services/oauth2';
const REDIRECT_URI = `${process.env.SERVER_URL}/oauth/callback`;

function createNotAuthenticatedError(message = 'Not authenticated') {
  const err = new Error(message);
  err.status = 401;
  return err;
}

function saveSession(session) {
  return new Promise((resolve, reject) => {
    session.save((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function isSalesforceAuthError(error) {
  const responseStatus = error.response?.status;
  const responseData = error.response?.data;

  if (responseStatus !== 401) return false;

  if (Array.isArray(responseData)) {
    return responseData.some((item) => item?.errorCode === 'INVALID_SESSION_ID');
  }

  return responseData?.errorCode === 'INVALID_SESSION_ID';
}

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

module.exports.refreshAccessToken = async (session) => {
  const salesForce = session.salesForce || {};
  const { refreshToken } = salesForce;

  if (!refreshToken) {
    throw createNotAuthenticatedError();
  }

  const data = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CONSUMER_KEY,
    client_secret: CONSUMER_SECRET,
  };

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  try {
    const { data: responseData } = await axios.post(
      `${OAUTH_BASE_URL}/token`,
      data,
      { headers },
    );

    if (!session.salesForce) session.salesForce = {};
    session.salesForce.accessToken = responseData.access_token;
    session.salesForce.instanceUrl =
      responseData.instance_url || session.salesForce.instanceUrl;
    session.salesForce.refreshToken =
      responseData.refresh_token || session.salesForce.refreshToken;
    session.salesForce.issuedAt =
      responseData.issued_at || session.salesForce.issuedAt;

    await saveSession(session);

    return responseData;
  } catch (error) {
    throw createNotAuthenticatedError(
      error.response?.data?.error_description || 'Not authenticated',
    );
  }
};

module.exports.salesforceClient = (session) => {
  const { accessToken, instanceUrl } = session.salesForce || {};

  if (!accessToken || !instanceUrl) {
    throw createNotAuthenticatedError();
  }

  const client = axios.create({
    baseURL: `${instanceUrl}/services/data/v62.0`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (!originalRequest || originalRequest._salesforceRetried) {
        throw error;
      }

      if (!isSalesforceAuthError(error)) {
        throw error;
      }

      originalRequest._salesforceRetried = true;

      await module.exports.refreshAccessToken(session);

      originalRequest.baseURL = `${session.salesForce.instanceUrl}/services/data/v62.0`;
      originalRequest.headers = {
        ...(originalRequest.headers || {}),
        Authorization: `Bearer ${session.salesForce.accessToken}`,
      };

      return client(originalRequest);
    },
  );

  return client;
};

module.exports.handleError = (error, res) => {
  console.error(error.response?.data || error.message || error);

  if (error.status === 401 || isSalesforceAuthError(error)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const responseStatus = error.response?.status;
  const responseData = error.response?.data;

  return res
    .status(responseStatus || 502)
    .json(
      responseData || { error: error.message || 'Salesforce request failed' },
    );
};
