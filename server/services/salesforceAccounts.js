const { salesforceClient } = require('./salesforce');
const { appendCreatedAccountRow } = require('./googleSheets');

function formatAccount(account) {
  return {
    id: account.Id,
    name: account.Name,
    phone: account.Phone,
    website: account.Website,
  };
}

module.exports.listAccounts = async (session, params = {}) => {
  const { limit = 20, offset = 0 } = params;
  const api = salesforceClient(session);
  const q = `SELECT Id, Name, Phone, Website FROM Account ORDER BY LastModifiedDate DESC LIMIT ${limit} OFFSET ${offset}`;
  const { data } = await api.get('/query', { params: { q } });
  return data.records.map(formatAccount);
};

module.exports.getAccount = async (session, id) => {
  const api = salesforceClient(session);
  const { data } = await api.get(`/sobjects/Account/${id}`);
  return formatAccount(data);
};

module.exports.createAccount = async (session, fields) => {
  const api = salesforceClient(session);
  const { data } = await api.post('/sobjects/Account', fields);
  const result = {
    id: data.id,
    success: data.success,
    errors: data.errors || [],
  };

  try {
    await appendCreatedAccountRow({
      id: result.id,
      name: fields.Name,
    });
  } catch (error) {
    console.error('Failed to append created account to Google Sheets', error);
  }

  return result;
};

module.exports.updateAccount = async (session, id, fields) => {
  const api = salesforceClient(session);
  await api.patch(`/sobjects/Account/${id}`, fields);
  return { id, updated: true };
};

module.exports.deleteAccount = async (session, id) => {
  const api = salesforceClient(session);
  await api.delete(`/sobjects/Account/${id}`);
  return { id, deleted: true };
};
