const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

let app;
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
} else {
  app = admin.app();
}

const db = admin.database();
module.exports = db;
