const admin = require('firebase-admin');

let db = null;

function getDb() {
  if (db) return db;
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  }
  db = admin.firestore();
  return db;
}

async function createOrder(data) {
  await getDb().collection('orders').doc(data.orderId).set(data);
  return data;
}

async function getOrder(orderId) {
  const doc = await getDb().collection('orders').doc(orderId).get();
  return doc.exists ? doc.data() : null;
}

async function updateOrder(orderId, data) {
  await getDb().collection('orders').doc(orderId).update(data);
}

async function createApplication(data) {
  await getDb().collection('applications').doc(data.orderId).set(data);
  return data;
}

module.exports = { createOrder, getOrder, updateOrder, createApplication };
