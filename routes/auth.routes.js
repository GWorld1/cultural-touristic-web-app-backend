const express = require('express');
const router = express.Router();
const { account } = require('../config/appwrite');

// User registration
router.post('/register', async (req, res) => {
  try {
    const user = await account.create(
      req.body.email,
      req.body.password,
      req.body.name
    );
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const session = await account.createEmailSession(
      req.body.email,
      req.body.password
    );
    res.json(session);
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

module.exports = router;