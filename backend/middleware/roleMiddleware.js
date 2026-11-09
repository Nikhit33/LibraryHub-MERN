
const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required'
            }); //This Ensures authentication has already happened
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'Access denied. Insufficient permissions.'
            }); // Checks whether the user has been allowed to the role
        }


        next();
    };
};

module.exports = roleMiddleware;
