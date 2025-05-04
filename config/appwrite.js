const sdk = require("node-appwrite");
dotenv.config();
const dotenv = require('dotenv');
const client = new sdk.Client();

client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setJWT(process.env.APPWRITE_API_KEY)
  

const account = new sdk.Account(client)
const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);

module.exports = {
  client,
  account,
  databases,
  storage,
  databaseId: process.env.APPWRITE_DATABASE_ID,
  usersCollectionId: process.env.APPWRITE_USERS_COLLECTION_ID,
  imagesBucketId: process.env.APPWRITE_IMAGES_BUCKET_ID
};