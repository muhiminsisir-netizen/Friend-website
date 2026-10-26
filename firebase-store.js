'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { cert, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

function createFirebaseStore({ projectId, serviceAccountBase64, serviceAccountJson, storageBucket }) {
  let serviceAccount;
  try {
    if (serviceAccountBase64) serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf8'));
    else if (serviceAccountJson) serviceAccount = JSON.parse(serviceAccountJson);
  } catch { throw new Error('Firebase service-account credentials are not valid JSON.'); }
  if (!projectId) throw new Error('Set FIREBASE_PROJECT_ID to your Firebase project ID.');
  if (!serviceAccount?.client_email || !serviceAccount?.private_key) {
    throw new Error('Set FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64 to the base64 service-account JSON from Firebase.');
  }
  if (!storageBucket) throw new Error('Set FIREBASE_STORAGE_BUCKET to the bucket name shown in Firebase Storage.');
  const app = initializeApp({ credential: cert(serviceAccount), projectId, storageBucket }, `friends-group-${projectId}`);
  const firestore = getFirestore(app), bucket = getStorage(app).bucket(storageBucket);

  async function checkConnection() {
    await firestore.collection('friends_group_meta').doc('healthcheck').get();
    await bucket.getMetadata();
    return true;
  }
  async function storeUpload(file) {
    if (!file?.path || !file?.filename || !fs.existsSync(file.path)) throw new Error('Upload file is missing.');
    await bucket.upload(file.path, { destination: path.basename(file.filename), metadata: { cacheControl: 'private, max-age=3600' } });
  }
  async function sendUpload(filename, res) {
    const safe = path.basename(filename), local = path.join(__dirname, 'uploads', safe);
    if (fs.existsSync(local)) { return res.sendFile(local); }
    const file = bucket.file(safe), [exists] = await file.exists();
    if (!exists) return res.sendStatus(404);
    const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 60 * 60 * 1000 });
    return res.redirect(302, url);
  }
  return { firestore, bucket, checkConnection, storeUpload, sendUpload };
}
module.exports = { createFirebaseStore };
