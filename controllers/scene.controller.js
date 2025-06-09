const { databases, databaseId: DATABASE_ID } = require('../config/appwrite');
const { Query } = require('node-appwrite');
const CloudinaryService = require('../services/cloudinary.service');

// Load environment variables
const dotenv = require('dotenv');
dotenv.config();

const COLLECTIONS = {
  TOURS: '68438aa8003143e4d330',
  SCENES: '68438e900010d9797e48',
  HOTSPOTS: '684390750026a2e5e2b8'
};

const sceneController = {

  // Create a new scene with optional image upload
  async createScene(req, res) {
    try {
      const { tourId, title, description, order, panoramaUrl, pitch, yaw, hfov } = req.body;
      const userId = req.user.$id;
      let imageUrl = panoramaUrl;

      // Parse form data fields to proper types
      const parsedOrder = order ? parseInt(order) : 0;
      const parsedPitch = pitch ? parseFloat(pitch) : 0;
      const parsedYaw = yaw ? parseFloat(yaw) : 0;
      const parsedHfov = hfov ? parseFloat(hfov) : 100;

      // console.log('Parsed scene data:', {
      //   order: parsedOrder,
      //   pitch: parsedPitch,
      //   yaw: parsedYaw,
      //   hfov: parsedHfov
      // });

      // Verify tour ownership
      const tour = await databases.getDocument(DATABASE_ID, COLLECTIONS.TOURS, tourId);
      if (tour.authorId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized: You can only add scenes to your own tours'
        });
      }

      // Handle image upload if provided
      if (req.file) {
        const uploadResult = await CloudinaryService.uploadImage(
          req.file.buffer,
          'scene',
          userId,
          req.file.originalname
        );

        if (uploadResult.success) {
          imageUrl = uploadResult.url;
        } else {
          return res.status(500).json({
            success: false,
            error: 'Failed to upload image: ' + uploadResult.error
          });
        }
      }

      // Create scene
      const scene = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.SCENES,
        'unique()',
        {
          tourId,
          title,
          description: description || '',
          order: parsedOrder,
          imageUrl: imageUrl || '',
          authorId: userId,
          pitch: parsedPitch,
          yaw: parsedYaw,
          hfov: parsedHfov
        }
      );

      res.status(201).json({
        success: true,
        data: { scene }
      });
    } catch (error) {
      console.error('Error in createScene:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Get a single scene by ID
  async getSceneById(req, res) {
    try {
      const { id } = req.params;
      
      const scene = await databases.getDocument(DATABASE_ID, COLLECTIONS.SCENES, id);
      
      res.json({
        success: true,
        data: { scene }
      });
    } catch (error) {
      console.error('Error in getSceneById:', error);
      res.status(404).json({
        success: false,
        error: 'Scene not found'
      });
    }
  },

  // Update a scene
  async updateScene(req, res) {
    try {
      const { id } = req.params;
      const { title, description, order, panoramaUrl, pitch, yaw, hfov } = req.body;
      const userId = req.user.$id;

      // Verify scene ownership
      const existingScene = await databases.getDocument(DATABASE_ID, COLLECTIONS.SCENES, id);
      if (existingScene.authorId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized: You can only update your own scenes'
        });
      }

      // Parse form data fields to proper types
      const parsedOrder = order ? parseInt(order) : 0;
      const parsedPitch = pitch ? parseFloat(pitch) : 0;
      const parsedYaw = yaw ? parseFloat(yaw) : 0;
      const parsedHfov = hfov ? parseFloat(hfov) : 100;

      const updatePayload = {};
      if (title) updatePayload.title = title;
      if (description !== undefined) updatePayload.description = description;
      if (order !== undefined) updatePayload.order = parsedOrder;
      if (panoramaUrl) updatePayload.imageUrl = panoramaUrl;
      if (pitch !== undefined) updatePayload.pitch = parsedPitch;
      if (yaw !== undefined) updatePayload.yaw = parsedYaw;
      if (hfov !== undefined) updatePayload.hfov = parsedHfov;

      // Handle image upload if provided
      if (req.file) {
        const uploadResult = await CloudinaryService.uploadImage(
          req.file.buffer,
          'scene',
          userId,
          req.file.originalname
        );

        if (uploadResult.success) {
          updatePayload.imageUrl = uploadResult.url;
        } else {
          return res.status(500).json({
            success: false,
            error: 'Failed to upload image: ' + uploadResult.error
          });
        }
      }

      const scene = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.SCENES,
        id,
        updatePayload
      );

      res.json({
        success: true,
        data: { scene }
      });
    } catch (error) {
      console.error('Error in updateScene:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Delete a scene
  async deleteScene(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.$id;

      // Verify scene ownership
      const existingScene = await databases.getDocument(DATABASE_ID, COLLECTIONS.SCENES, id);
      if (existingScene.authorId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized: You can only delete your own scenes'
        });
      }

      // Delete associated hotspots first
      const hotspots = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.HOTSPOTS,
        [Query.equal('sceneId', id)]
      );

      await Promise.all(
        hotspots.documents.map(hotspot =>
          databases.deleteDocument(DATABASE_ID, COLLECTIONS.HOTSPOTS, hotspot.$id)
        )
      );

      // Delete the scene
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.SCENES, id);

      res.json({
        success: true,
        data: { message: 'Scene deleted successfully' }
      });
    } catch (error) {
      console.error('Error in deleteScene:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

};

module.exports = sceneController;
