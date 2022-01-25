const jwt = require('jsonwebtoken');

const { authenticateToken } = require('./auth.js');

/*
 * Middleware used to check that a user has been authenticated.
 * Verifies the JWT and passes along the userID and username of the auth'd user.
 */
const authUser = async (req, res, next) => {
    try {
        // verify the token
        const token = authenticateToken(req);

        // add the user ID and username in the req object which we pass along
        res.locals.userID = token.payload.userID;
        res.locals.username = token.payload.username;

        // procced to next middleware
        next();

    } catch(err) {
        res.status(400);
        return res.json({
            'success': false,
            'msg': `Error: ${err}`,
        });
    }
}

exports.authUser = authUser;
