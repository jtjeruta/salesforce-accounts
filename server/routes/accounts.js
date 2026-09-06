const express = require('express');
const router = express.Router();
const { handleError } = require('../services/salesforce');
const {
  listAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
} = require('../services/salesforceAccounts');

router.get('/', async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const accounts = await listAccounts(req.session, { limit, offset });
    res.status(200).json(accounts);
  } catch (error) {
    handleError(error, res);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const account = await getAccount(req.session, req.params.id);
    res.status(200).json(account);
  } catch (error) {
    handleError(error, res);
  }
});

router.post('/', async (req, res) => {
  try {
    const account = await createAccount(req.session, req.body);
    res.status(201).json(account);
  } catch (error) {
    handleError(error, res);
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const result = await updateAccount(req.session, req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    handleError(error, res);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await deleteAccount(req.session, req.params.id);
    res.status(200).json(result);
  } catch (error) {
    handleError(error, res);
  }
});

module.exports = router;
