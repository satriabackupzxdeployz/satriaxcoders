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
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID postingan diperlukan' });
    const postSnapshot = await db.ref('posts/' + id).once('value');
    if (!postSnapshot.exists()) return res.status(404).json({ error: 'Postingan tidak ditemukan' });
    const postData = postSnapshot.val();
    if (decoded.role !== 'owner' && postData.uid !== decoded.uid) {
        return res.status(403).json({ error: 'Anda tidak berhak menghapus postingan ini' });
    }
    await db.ref('posts/' + id).remove();
    res.status(200).json({ success: true });
};