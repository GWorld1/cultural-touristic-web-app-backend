const { Query } = require('node-appwrite');
const {databases, databaseId: DATABASE_ID } = require('../config/appwrite');

const COLLECTIONS = {
  TOURS: '68438aa8003143e4d330',
  SCENES: '68438e900010d9797e48',
  HOTSPOTS: '684390750026a2e5e2b8',
  ANALYTICS: 'tour_analytics'
};

/**
 * Tour Service Functions
 */
class TourService {
  
  /**
   * Get all tours with filters and pagination
   */
  static async getTours(filters = {}, pagination = {}) {
    const queries = [];
    
    // Add filters
    if (filters.authorId) {
      queries.push(Query.equal('authorId', filters.authorId));
    }
    if (filters.isPublic !== undefined) {
      queries.push(Query.equal('isPublic', filters.isPublic));
    }
    if (filters.category) {
      queries.push(Query.equal('category', filters.category));
    }
    if (filters.status) {
      queries.push(Query.equal('status', filters.status));
    }
    if (filters.search) {
      queries.push(Query.search('title', filters.search));
    }
    if (filters.tags && filters.tags.length > 0) {
      queries.push(Query.equal('tags', filters.tags));
    }
    
    // Add pagination
    if (pagination.limit) {
      queries.push(Query.limit(pagination.limit));
    }
    if (pagination.offset) {
      queries.push(Query.offset(pagination.offset));
    }
    
    // Add ordering
    queries.push(Query.orderDesc('$createdAt'));
    
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.TOURS,
        queries
      );
      
      return {
        tours: response.documents,
        total: response.total,
        success: true
      };
    } catch (error) {
      console.error('Error fetching tours:', error);
      return {
        error: error.message,
        success: false
      };
    }
  }
  
  /**
   * Get a single tour by ID with related scenes and hotspots
   */
  static async getTourById(tourId) {
    try {
      // Get tour
      const tour = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.TOURS,
        tourId
      );
      
      // Get scenes
      const scenesResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SCENES,
        [
          Query.equal('tourId', tourId),
          Query.orderAsc('order')
        ]
      );
      
      // Get hotspots for each scene
      const scenes = await Promise.all(
        scenesResponse.documents.map(async (scene) => {
          const hotspotsResponse = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.HOTSPOTS,
            [Query.equal('sceneId', scene.$id)]
          );
          
          return {
            ...scene,
            hotspots: hotspotsResponse.documents.map(hotspot => ({
              ...hotspot,
              infoContent: hotspot.infoContent ? JSON.parse(hotspot.infoContent) : null,
              style: JSON.parse(hotspot.style)
            }))
          };
        })
      );
      
      return {
        tour: {
          ...tour,
          settings: JSON.parse(tour.settings),
          scenes
        },
        success: true
      };
    } catch (error) {
      console.error('Error fetching tour:', error);
      return {
        error: error.message,
        success: false
      };
    }
  }
  
  /**
   * Create a new tour
   */
  static async createTour(tourData, userId) {
    
    try {
      const tour = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.TOURS,
        'unique()',
        {
          title: tourData.title,
          description: tourData.description,
          authorId: userId,
          author: tourData.author,
          tags: tourData.tags || [],
          isPublic: tourData.isPublic == 'true' ? true : false,
    //    estimatedDuration: tourData.estimatedDuration || 10,
          category: tourData.category || '',
          status: 'draft',
          viewCount: 0,
          thumbnailUrl: tourData.metadata.thumbnailUrl || '',
          settings: JSON.stringify(tourData.settings || {
            autoRotate: false,
            autoRotateSpeed: 2,
            showControls: true,
            allowFullscreen: true,
            showSceneList: true,
            backgroundColor: '#000000',
            loadingScreenText: 'Loading virtual tour...'
          }),
          startSceneId: tourData.startSceneId || ''
        }
      );
      
      return {
        tour: {
          ...tour,
          settings: JSON.parse(tour.settings),
          scenes: []
        },
        success: true
      };
    } catch (error) {
      console.error('Error creating tour:', error);
      return {
        error: error.message,
        success: false
      };
    }
  }
  
  /**
   * Update a tour
   */
  static async updateTour(tourId, updateData, userId) {
    try {
      // Verify ownership
      const existingTour = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.TOURS,
        tourId
      );
      
      if (existingTour.authorId !== userId) {
        return {
          error: 'Unauthorized: You can only update your own tours',
          success: false
        };
      }
      
      const updatePayload = {};
      
      if (updateData.title) updatePayload.title = updateData.title;
      if (updateData.description) updatePayload.description = updateData.description;
      if (updateData.startSceneId) updatePayload.startSceneId = updateData.startSceneId;
      if (updateData.settings) updatePayload.settings = JSON.stringify(updateData.settings);
     
      if (updateData.tags) updatePayload.tags = updateData.tags;
      if (updateData.isPublic !== undefined) updatePayload.isPublic = updateData.isPublic;
      if (updateData.estimatedDuration) updatePayload.estimatedDuration = updateData.estimatedDuration;
      if (updateData.thumbnailUrl) updatePayload.thumbnailUrl = updateData.thumbnailUrl;
      
      
      const tour = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.TOURS,
        tourId,
        updatePayload
      );
      
      return {
        tour: {
          ...tour,
          settings: JSON.parse(tour.settings)
        },
        success: true
      };
    } catch (error) {
      console.error('Error updating tour:', error);
      return {
        error: error.message,
        success: false
      };
    }
  }
  
  /**
   * Delete a tour and all related data
   */
  static async deleteTour(tourId, userId) {
    try {
      // Verify ownership
      const existingTour = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.TOURS,
        tourId
      );
      
      if (existingTour.authorId !== userId) {
        return {
          error: 'Unauthorized: You can only delete your own tours',
          success: false
        };
      }
      
      // Delete hotspots
      const hotspots = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.HOTSPOTS,
        [Query.equal('tourId', tourId)]
      );
      
      await Promise.all(
        hotspots.documents.map(hotspot =>
          databases.deleteDocument(DATABASE_ID, COLLECTIONS.HOTSPOTS, hotspot.$id)
        )
      );
      
      // Delete scenes
      const scenes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SCENES,
        [Query.equal('tourId', tourId)]
      );
      
      await Promise.all(
        scenes.documents.map(scene =>
          databases.deleteDocument(DATABASE_ID, COLLECTIONS.SCENES, scene.$id)
        )
      );
      
      // Delete analytics
      // const analytics = await databases.listDocuments(
      //   DATABASE_ID,
      //   COLLECTIONS.ANALYTICS,
      //   [Query.equal('tourId', tourId)]
      // );
      
      // await Promise.all(
      //   analytics.documents.map(analytic =>
      //     databases.deleteDocument(DATABASE_ID, COLLECTIONS.ANALYTICS, analytic.$id)
      //   )
      // );
      
      // Delete tour
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.TOURS, tourId);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting tour:', error);
      return {
        error: error.message,
        success: false
      };
    }
  }
  
  /**
   * Publish/Unpublish a tour
   */
  static async toggleTourPublish(tourId, publish, userId) {
    try {
      // Verify ownership
      const existingTour = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.TOURS,
        tourId
      );
      
      if (existingTour.authorId !== userId) {
        return {
          error: 'Unauthorized: You can only modify your own tours',
          success: false
        };
      }
      
      const tour = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.TOURS,
        tourId,
        {
          isPublic: publish,
          status: publish ? 'published' : 'draft'
        }
      );
      
      return {
        tour: {
          ...tour,
          settings: JSON.parse(tour.settings)
        },
        success: true
      };
    } catch (error) {
      console.error('Error toggling tour publish status:', error);
      return {
        error: error.message,
        success: false
      };
    }
  }
}

module.exports = TourService;