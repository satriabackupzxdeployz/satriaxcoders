const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
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
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { username, email, password, birthdate } = req.body;
    if (!username || !email || !password || !birthdate) {
        return res.status(400).json({ error: 'Semua field harus diisi' });
    }
    const usernameLower = username.toLowerCase();
    const snapshot = await db.ref('users').orderByChild('usernameLower').equalTo(usernameLower).once('value');
    if (snapshot.exists()) {
        return res.status(409).json({ error: 'Username sudah dipakai' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRef = db.ref('users').push();
    const userData = {
        username: username,
        usernameLower: usernameLower,
        email: email,
        password: hashedPassword,
        birthdate: birthdate,
        displayName: username,
        bio: '',
        role: 'member',
        avatarUrl: '',
        bannerUrl: '',
        checkmarkType: 'blue',
        customCheckmarkUrl: '',
        postsCount: 0,
        followersCount: 0,
        followingCount: 0,
        createdAt: Date.now()
    };
    await userRef.set(userData);
    const uid = userRef.key;
    const token = jwt.sign({ uid, username, displayName: username, role: 'member' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const userResponse = {
        uid,
        displayName: username,
        username: '@' + username,
        email,
        bio: '',
        role: 'member',
        avatarUrl: '',
        checkmarkType: 'blue',
        customCheckmarkUrl: '',
        postsCount: 0,
        followersCount: 0,
        followingCount: 0
    };
    res.status(201).json({ token, user: userResponse });
};