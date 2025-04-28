const { Client, Account, Databases, Storage } = require('appwrite');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setJWT(process.env.APPWRITE_API_KEY);

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

module.exports = {
  client,
  account,
  databases,
  storage,
  databaseId: process.env.APPWRITE_DATABASE_ID,
  usersCollectionId: process.env.APPWRITE_USERS_COLLECTION_ID,
  imagesBucketId: process.env.APPWRITE_IMAGES_BUCKET_ID
};