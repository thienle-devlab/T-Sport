const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET_KEY = process.env.SECRET_KEY;

// Middleware để xác thực token


function authenticateToken(req, res, next) {
    // console.log('Headers:', req.headers);
    // const authHeader = req.headers['authorization'];
    // console.log('Auth header:', authHeader);
    // const token = authHeader && authHeader.split(' ')[1];
    // console.log('Extracted token:', token);
    const token = req.cookies.token;

    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) {
            console.error('Token verification error:', err);
            return res.status(403).json({ error: 'Invalid token', details: err.message });
        }

        console.log('Token verified successfully');
        req.user = user;
        next();
    });
}

module.exports = authenticateToken;