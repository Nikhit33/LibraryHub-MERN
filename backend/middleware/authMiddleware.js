
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;


        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Access denied. No token provided.'
            });
        }

        //This extracts the token
        const token = authHeader.split(' ')[1];

        if (!token || !process.env.JWT_SECRET) {
            return res.status(401).json({
                message: 'Invalid authentication token.'
            });
        }

        // Verifies the JWT signature and expiration
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Finds the user in MongoDB
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                message: 'User not found.'
            });
        }
        if (user.isActive === false) {
            return res.status(403).json({
                message: 'Account deactivated.'
            });
        }
        // This attachws the authenticated user to the request
        req.user = user;

        // Continues to the protected route
        next();

    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired token.'
        });
    }
};

module.exports = authMiddleware;
