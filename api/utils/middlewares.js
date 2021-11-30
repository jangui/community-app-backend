const jwt = require('jsonwebtoken');

/*
 * Middleware used to check that a user has been authenticated.
 * Verifies the JWT and passes along the userID and username of the auth'd user.
 */
const authUser = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const encodedToken = authHeader && authHeader.split(' ')[1];

    // check if token set
    if (encodedToken == null) {
        res.status(400);
        return res.json({
            'success': false,
            'msg': 'Error: Authentication failed. JWT not set.',
        });
    }

    try {
        // verify the token
        const token = jwt.verify(encodedToken, process.env.JWT_TOKEN_SECRET);

        // add the user ID and username in the req object which we pass along
        res.locals.userID = token.payload.userID;
        res.locals.username = token.payload.username;

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
