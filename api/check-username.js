const admin = require('firebase-admin');

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    });
}

const db = admin.database();

module.exports = async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Username diperlukan' });
    const snapshot = await db.ref('users').orderByChild('usernameLower').equalTo(username.toLowerCase()).once('value');
    res.status(200).json({ exists: snapshot.exists() });
};