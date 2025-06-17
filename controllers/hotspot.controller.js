const { databases, databaseId: DATABASE_ID } = require('../config/appwrite');
const CloudinaryService = require('../services/cloudinary.service');

// Load environment variables
const dotenv = require('dotenv');
dotenv.config();

const COLLECTIONS = {
  TOURS: '68438aa8003143e4d330',
  SCENES: '68438e900010d9797e48',
  HOTSPOTS: '684390750026a2e5e2b8'
};

const hotspotController = {

  // Create a new hotspot with optional image upload
  async createHotspot(req, res) {
    try {
      const { 
        sceneId, 
        tourId, 
        text, 
        type, 
        pitch, 
        yaw, 
        infoContent, 
        externalUrl, 
        style 
      } = req.body;
      const userId = req.user.$id;

      // Verify scene and tour ownership
      const scene = await databases.getDocument(DATABASE_ID, COLLECTIONS.SCENES, sceneId);
      if (scene.authorId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized: You can only add hotspots to your own scenes'
        });
      }

      // Parse form data fields to proper types
      const parsedPitch = pitch ? parseFloat(pitch) : 0;
      const parsedYaw = yaw ? parseFloat(yaw) : 0;

      const parseInfoContent = infoContent ? JSON.parse(infoContent) : null;
      const parseStyle = style ? JSON.parse(style) : null;
      
      console.log('Parsed hotspot data:', {
        pitch: parsedPitch,
        yaw: parsedYaw,
        infoContent: parseInfoContent
      });

      // Create hotspot
      const hotspot = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.HOTSPOTS,
        'unique()',
        {
          sceneId,
          tourId,
          text,
          type,
          pitch: parsedPitch,
          yaw: parsedYaw,
          infoContent: JSON.stringify(parseInfoContent) || '{}',
          externalUrl: externalUrl || '',
          style: JSON.stringify(parseStyle || {
            backgroundColor: '#ffffff',
            textColor: '#000000',
            borderColor: '#cccccc',
            borderWidth: 1,
            borderRadius: 5,
            padding: 10
          }),
          authorId: userId
        }
      );

      res.status(201).json({
        success: true,
        data: { 
          hotspot: {
            ...hotspot,
            infoContent: hotspot.infoContent ? JSON.parse(hotspot.infoContent) : null,
            style: JSON.parse(hotspot.style)
          }
        }
      });
    } catch (error) {
      console.error('Error in createHotspot:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Get a single hotspot by ID
  async getHotspotById(req, res) {
    try {
      const { id } = req.params;
      
      const hotspot = await databases.getDocument(DATABASE_ID, COLLECTIONS.HOTSPOTS, id);
      
      res.json({
        success: true,
        data: { 
          hotspot: {
            ...hotspot,
            infoContent: hotspot.infoContent ? JSON.parse(hotspot.infoContent) : null,
            style: JSON.parse(hotspot.style)
          }
        }
      });
    } catch (error) {
      console.error('Error in getHotspotById:', error);
      res.status(404).json({
        success: false,
        error: 'Hotspot not found'
      });
    }
  },

  // Update a hotspot
  async updateHotspot(req, res) {
    try {
      const { id } = req.params;
      console.log("id: ", id);
      console.log('Request body:', req.body);
      const { 
        text, 
        type, 
        pitch, 
        yaw, 
        infoContent, 
        externalUrl, 
        style 
      } = req.body;
      
      const userId = req.user.$id;

      // Verify hotspot ownership
      const existingHotspot = await databases.getDocument(DATABASE_ID, COLLECTIONS.HOTSPOTS, id);
      if (existingHotspot.authorId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized: You can only update your own hotspots'
        });
      }

      // Parse form data fields to proper types
      const parsedPitch = pitch ? parseFloat(pitch) : 0;
      const parsedYaw = yaw ? parseFloat(yaw) : 0;

      // Parse JSON fields safely
      let parseInfoContent = null;
      if (infoContent) {
        try {
          parseInfoContent = typeof infoContent === 'string' ? JSON.parse(infoContent) : infoContent;
        } catch (e) {
          console.error('Error parsing infoContent:', e);
          parseInfoContent = null;
        }
      }

      let parseStyle = null;
      if (style) {
        try {
          parseStyle = typeof style === 'string' ? JSON.parse(style) : style;
        } catch (e) {
          console.error('Error parsing style:', e);
          parseStyle = null;
        }
      }

      // Handle image upload if provided
      if (req.file) {
        const uploadResult = await CloudinaryService.uploadImage(
          req.file.buffer,
          'hotspot',
          userId,
          req.file.originalname
        );

        if (uploadResult.success) {
          // Update the infoContent with the new image URL if it's an info hotspot
          if (parseInfoContent && type === 'info') {
            parseInfoContent.imageUrl = uploadResult.url;
          }
        } else {
          return res.status(500).json({
            success: false,
            error: 'Failed to upload image: ' + uploadResult.error
          });
        }
      }

      const updatePayload = {};
      if (text) updatePayload.text = text;
      if (type) updatePayload.type = type;
      if (pitch !== undefined) updatePayload.pitch = parsedPitch;
      if (yaw !== undefined) updatePayload.yaw = parsedYaw;
      if (parseInfoContent) updatePayload.infoContent = JSON.stringify(parseInfoContent);
      if (externalUrl !== undefined) updatePayload.externalUrl = externalUrl;
      if (parseStyle) updatePayload.style = JSON.stringify(parseStyle);

      const hotspot = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.HOTSPOTS,
        id,
        updatePayload
      );

      res.json({
        success: true,
        data: { 
          hotspot: {
            ...hotspot,
            infoContent: hotspot.infoContent ? JSON.parse(hotspot.infoContent) : null,
            style: JSON.parse(hotspot.style)
          }
        }
      });
    } catch (error) {
      console.error('Error in updateHotspot:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Delete a hotspot
  async deleteHotspot(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.$id;

      // Verify hotspot ownership
      const existingHotspot = await databases.getDocument(DATABASE_ID, COLLECTIONS.HOTSPOTS, id);
      if (existingHotspot.authorId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized: You can only delete your own hotspots'
        });
      }

      // Delete the hotspot
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.HOTSPOTS, id);

      res.json({
        success: true,
        data: { message: 'Hotspot deleted successfully' }
      });
    } catch (error) {
      console.error('Error in deleteHotspot:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

};

module.exports = hotspotController;
