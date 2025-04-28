const express = require('express');
const router = express.Router();
const { storage, imagesBucketId: bucketId } = require('../config/appwrite');

// Upload image
router.post('/upload', async (req, res) => {
  try {
    const file = req.files.image;
    const response = await storage.createFile(
      bucketId,
      file.data,
      [
        `role:member`,
        `userId:${req.userId}`
      ]
    );
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List images
router.get('/', async (req, res) => {
  try {
    const files = await storage.listFiles(bucketId);
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete image
router.delete('/:id', async (req, res) => {
  try {
    await storage.deleteFile(bucketId, req.params.id);
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;