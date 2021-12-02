const router = require('express').Router();

const User = require('../models/User.model');
const bcrypt = require('bcrypt');

const { existingUser, genAccessToken } = require('../utils');

/*
 * Function called after verfied login.
 * Creates a JWT and returns it in a response object
 * @param  {mongoose.Document} The mongoose document of the user loggin in
 * @return {Response}          A Response object indicating successful login
 */
const successfulLogin = (user, res) => {
    const token = genAccessToken(user);

    // return success
    return res.status(200).json({
        success: true,
        msg: `${user.username} successfully logged in`,
        token: token,
        user: { _id: user._id, username: user.username},
    });
}

/*
 * POST /login endpoint
 * Content: application/json
 * data:
 *   username or email or (countryCode and phoneNumber)
 *   password
 *
 * Responses:
 *   200:
 *     content: application/json
 *     data:
 *       success: true
 *       msg: A successful login message
 *       token: JWT used for session
 *       user: JSON of the mongoose document of user which logged in
 *   401 / 409 / 500:
 *     content: application/json
 *     data:
 *       success: false
 *       msg: an appropriate error message
 */
router.route('/').post( async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;
    const countryCode = req.body.countryCode;
    const phoneNumber = req.body.phoneNumber;

    // check and set the user identifier
    let userIdentifier;
    if (username) { userIdentifier = username; }
    else if (email) { userIdentifier = email; }
    else if (countryCode && phoneNumber) {
            userIdentifier = `${countryCode} ${phoneNumber}`;
    } else {
        return res.status(409).json({
            success: false,
            msg: 'Error: no user identifier',
        });

    }

    try {
        // check user exists
        userDoc = await existingUser(userIdentifier);

        // get password
        const user = await User.findOne({_id: userDoc._id}, 'username password').lean();
        const hashedPassword = user.password;

        // check password
        const match = await bcrypt.compare(password, hashedPassword);
        if(!(match)) {
            return res.status(401).json({
                success: false,
                msg: 'Error: invalid login', // purposely ambigious
            });
        }

        return successfulLogin(user, res);

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error:  ${err}`,
        });
    }
});

module.exports = router;
