const express = require('express');
const router = express.Router();
const { listAccounts, getAccount, createAccount, updateAccount, deleteAccount } = require('../services/salesforceAccounts');

router.get('/', async (req, res) => {
  const accounts = await listAccounts(req.session);
  res.status(200).json(accounts);
});

module.exports = router;