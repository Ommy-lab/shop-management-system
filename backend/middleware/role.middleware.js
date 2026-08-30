// middleware/role.middleware.js

/*
|--------------------------------------------------------------------------
| ROLE AUTHORIZATION MIDDLEWARE
|--------------------------------------------------------------------------
| This middleware allows access only to users whose role is included
| in the roles passed to allowRoles().
|
| Example:
| allowRoles("SUPER_ADMIN", "ADMIN")
|--------------------------------------------------------------------------
*/
export const allowRoles = (...allowedRoles) => {
    return (req, res, next) => {
    // req.user is created by authenticateUser middleware.
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "User is not authenticated",
            });
        }

    // Check whether the logged-in user's role is allowed.
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to perform this action",
            });
        }

        next();
    };
};