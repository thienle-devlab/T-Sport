const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({
            error: 'No token provided'
        });
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(401).json({
                error: 'Invalid or expired token'
            });
        }

        req.user = user;
        next();
    });
}

module.exports = authenticateToken;