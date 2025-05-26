// Load environment variables
const dotenv = require('dotenv');
dotenv.config();

const sdk = require("node-appwrite");
const client = new sdk.Client();

client 
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)
//  .setSelfSigned(true); // Use only on dev mode (Self-signed SSL certificate)
  

const account = new sdk.Account(client);
const users = new sdk.Users(client);
const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);



module.exports = {
  client,
  account,
  users,
  databases,
  storage,
  databaseId: process.env.APPWRITE_DATABASE_ID,
  usersCollectionId: process.env.APPWRITE_USERS_COLLECTION_ID,
  imagesBucketId: process.env.APPWRITE_IMAGES_BUCKET_ID
};