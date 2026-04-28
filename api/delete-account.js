const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    });
}

const db = admin.database();

module.exports = async (req, res) => {
    if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Token diperlukan' });
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
        return res.status(401).json({ error: 'Token tidak valid' });
    }
    await db.ref('users/' + decoded.uid).remove();
    const postsSnapshot = await db.ref('posts').orderByChild('uid').equalTo(decoded.uid).once('value');
    const deletions = [];
    postsSnapshot.forEach(child => {
        deletions.push(db.ref('posts/' + child.key).remove());
    });
    await Promise.all(deletions);
    res.status(200).json({ success: true });
};