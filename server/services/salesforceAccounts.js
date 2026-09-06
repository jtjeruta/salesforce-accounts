const { salesforceClient } = require('./salesforce');

module.exports.listAccounts = async (session) => {
  const api = salesforceClient(session);
  const q =
    'SELECT Id, Name, Phone, Website FROM Account ORDER BY LastModifiedDate DESC LIMIT 20';
  const { data } = await api.get('/query', { params: { q } });
  return data.records;
};

module.exports.getAccount = async (session, id) => {
  const api = salesforceClient(session);
  const { data } = await api.get(`/sobjects/Account/${id}`);
  return data;
};

module.exports.createAccount = async (session, fields) => {
  const api = salesforceClient(session);
  const { data } = await api.post('/sobjects/Account', fields);
  return data; // { id, success, errors }
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
