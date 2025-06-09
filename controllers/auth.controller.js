const { account,users, databases, databaseId, usersCollectionId } = require('../config/appwrite');
const { ID, Query } = require('node-appwrite');
const jwt = require('jsonwebtoken');

// Load environment variables
const dotenv = require('dotenv');
dotenv.config();

const authController = {

// Register a new user
async register (req, res) {
  try {
    const { email, password, name, phone } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Create user account in Appwrite
    const user = await account.create(
      ID.unique(),
      email,
      password,
      name
    );

    // Create additional user data in database
    const userData = await databases.createDocument(
      databaseId,
      usersCollectionId,
      ID.unique(),
      {
        userId: user.$id,
        email: email,
        name: name,
        phone: phone || '',
        role: 'user',
        bio: '',
        createdAt: new Date().toISOString()
      }
    );

    // Create email verification
    //await account.createVerification(process.env.APP_URL + '/verify-email');

    res.status(201).json({
      message: 'User registered successfully. Please verify your email.',
      user: {
        id: user.$id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 409) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    
    res.status(500).json({ error: 'Failed to register user', details: error.message });
  }
},

// Login user
async login (req, res) {
  try {
    const { email, password } = req.body;
    console.log('Login request body:', req.body);
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Create email session
    let session = await account.createEmailPasswordSession(email, password);
    

    // Get user account
    let user = await users.get(session.userId);
  
    // // Check if user is verified
    // if (!user.emailVerification) {
    //   return res.status(401).json({ error: 'Email not verified' });
    // }
    
    console.log('User:', user);
    // Get user data from database
    const userData = await databases.listDocuments(
      databaseId,
      usersCollectionId,
      [Query.equal('userId', user.$id)]
    );

    // Generate JWT with appwrite token
    const token = jwt.sign(
      { 
        userId: user.$id,
        email: user.email,
        role: userData.documents[0]?.role || 'user'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.$id,
        email: user.email,
        name: user.name,
        role: userData.documents[0]?.role || 'user'
      },
      token,
      sessionId: session.$id
    });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.code === 401) {
      return res.status(401).json({ error: 'Invalid credentials'});
    }
    
    res.status(500).json({ error: 'Failed to login', details: error.message });
  }
},

// Logout user
async logout (req, res)  {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    await account.deleteSession(sessionId);
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout', details: error.message });
  }
},

// Get current user
async getCurrentUser (req, res)  {
  try {
    // Get user account
    const user = req.user; // This should be set by the auth middleware
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    console.log('Current user:', user);

    // Get user data from database
    const userData = await databases.listDocuments(
      databaseId,
      usersCollectionId,
      [Query.equal('userId', user.$id)]
    );

    console.log('User data:', userData);

    res.json({
      user: {
        id: user.$id,
        email: user.email,
        name: userData.documents[0]?.name,
        phone: userData.documents[0]?.phone || '',
        role: userData.documents[0]?.role || 'user',
        bio: userData.documents[0]?.bio || ''
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(401).json({ error: 'Not authenticated' });
  }
},

// Request password reset
 async requestPasswordReset  (req, res)  {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    await account.createRecovery(email, process.env.APP_URL + '/reset-password');
    
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Failed to send password reset email', details: error.message });
  }
},

// Complete password reset
 async completePasswordReset (req, res)  {
  try {
    const { userId, secret, password, passwordAgain } = req.body;
    
    if (!userId || !secret || !password || !passwordAgain) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password !== passwordAgain) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    
    await account.updateRecovery(userId, secret, password, passwordAgain);
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset completion error:', error);
    res.status(500).json({ error: 'Failed to reset password', details: error.message });
  }
},

// Verify email
async verifyEmail (req, res) {
  try {
    const { userId, secret } = req.body;
    
    if (!userId || !secret) {
      return res.status(400).json({ error: 'User ID and secret are required' });
    }
    
    await account.updateVerification(userId, secret);
    
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Failed to verify email', details: error.message });
  }
},

// Update user profile
updateProfile: async (req, res) => {
  try {
    const { name, phone, bio } = req.body;
    console.log('Update profile request body:', req.body); // Log the request body for debugging purposes     // Get user account from Appwrite
    //const user = await account.get();
    
    // // Update name in Appwrite account if provided
    // if (name) {
    //   await account.updateName(name);
    // }
    
    // Get user data from database
    const userData = await databases.listDocuments(
      databaseId,
      usersCollectionId,
      [Query.equal('userId', req.user.$id)] // Use the user ID from the request instead of the user ID from Appwrite account. This is to ensure that the user can only update their own profile.
    );
    
    if (userData.documents.length > 0) {
      // Update user data in database
      await databases.updateDocument(
        databaseId,
        usersCollectionId,
        userData.documents[0].$id,
        {
          name: name || userData.documents[0].name,
          phone: phone || userData.documents[0].phone,
          bio: bio || userData.documents[0].bio,
        }
      );
    }
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }
}

};

//export authController;
module.exports = authController;