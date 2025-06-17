const express = require('express');
const router = express.Router();
const { databases, databaseId, usersCollectionId: collectionId } = require('../config/appwrite');

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await databases.listDocuments(databaseId, collectionId);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single user
router.get('/:id', async (req, res) => {
  try {
    const user = await databases.getDocument(databaseId, collectionId, req.params.id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ error: 'User not found' });
  }
});

// Update user
router.put('/:id', async (req, res) => {

  const { name, phone, bio } = req.body;
  console.log('Update user request body:', req.body); // Log the request body for debugging purposes
  try {
    const updatedUser = await databases.updateDocument(
      databaseId,
      collectionId,
      req.params.id,
      { name, phone, bio }
    );
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    await databases.deleteDocument(databaseId, collectionId, req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;