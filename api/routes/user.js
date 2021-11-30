const router = require('express').Router();

const User = require('../models/User.model');
const { existingUser } = require('../utils');

/*
 * All these endpoints are only available if authenticated
 * authentication is done by middleware checking JWT
 * On success the authentication middleware stores the authenticated
 * user's username and id in the response object
 * these can be accessed at res.locals.username and res.locals.userID
 */

/*
 * GET /user endpoint
 * Responses:
 *   200:
 *     content: application/json
 *     data:
 *       success: true
 *       msg: A successful register message
 *       user: JSON of the mongoose document of the currently logged in user
 *   401:
 *     content: application/json
 *     data:
 *       success: false
 *       msg: unauthorized
 */
router.route('/').get( async (req, res) => {
    const username = res.locals.username;

    try {
        const user = await existingUser(username);
        res.status = 200;
        return res.json({
            success: true,
            msg: `successfully got ${user.username}`,
            user: user,
        });

    } catch(err) {
        res.status = 400;
        return res.json({
            success: false,
            msg: `Error:  ${err}`,
        });
    }
});

module.exports = router;
