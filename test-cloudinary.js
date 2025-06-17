// Test script to verify Cloudinary configuration
const cloudinary = require('./config/cloudinary');

async function testCloudinaryConnection() {
  try {
    console.log('Testing Cloudinary connection...');
    
    // Test API connection
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful:', result);
    
    // Test cloud info
    const cloudInfo = await cloudinary.api.resource_types();
    console.log('✅ Available resource types:', cloudInfo.resource_types);
    
    console.log('\n🎉 Cloudinary is properly configured!');
    console.log('You can now use the image upload endpoints.');
    
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    console.log('\n📝 Please check your environment variables:');
    console.log('- CLOUDINARY_CLOUD_NAME');
    console.log('- CLOUDINARY_API_KEY');
    console.log('- CLOUDINARY_API_SECRET');
  }
}

// Run the test
testCloudinaryConnection();
