const router = require('express').Router();

const User = require('../models/User.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/*
 * checks if user exists by either checking the username, email or countryCode + phoneNumber
 * @param  {String} username     The username used to log in
 * @param  {String} email        The email used to log in
 * @param  {String} countryCode  The user's phone's country code
 * @param  {String} phoneNumber  The user's phone number (can be used with countryCode to log in)
 * @return {Promise<mongoose.Document>} A promise that returns a mongoose document of the user trying to log in
 */
const existingUser = async (username, email, countryCode, phoneNumber) => {
    return new Promise(async (res, rej) => {
        try {
            let user;

            // check if username in db
            if (username) {
                user = await User.find({username: username});
                if (user.length > 0) {
                    // success
                    res(user[0]);
                }
            }

            // check if email in db
            if (email) {
                user = await User.find({email: email});
                if (user.length > 0) {
                    // success
                    res(user[0]);
                }
            }

            // check if countryCode + phoneNumber in db
            if (countryCode && phoneNumber) {
                user = await User.find({
                        countryCode: countryCode,
                        phoneNumber: phoneNumber
                });
                if (user.length > 0) {
                    // success
                    res(user[0]);
                }
            }

            // unable to find user
            rej('invalid login');

        } catch(err) {
            rej(err);
        }
    });
}

/*
 * Function called after verfied login.
 * Creates a JWT and returns it in a response object
 * @param  {mongoose.Document} The mongoose document of the user loggin in
 * @return {Response}          A Response object indicating successful login
 */
const successfulLogin = (user, res) => {
    // create JWT
    const token = jwt.sign(
        { userID: [user._id, user.username] },
        process.env.JWT_TOKEN_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION },
    );

    // return success
    res.status = 200;
    return res.json({
        success: true,
        msg: `${user.username} successfully logged in`,
        token: token,
        user: user,
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
 *   401 && 500:
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

    try {
        const user = await existingUser(username, email, countryCode, phoneNumber);

        // check password
        const match = await bcrypt.compare(password, user.password);
        if(!(match)) {
            res.status = 401;
            return res.json({
                'success': false,
                'msg': 'Error: invalid login', // purposely ambigious
            });
        }

        return successfulLogin(user, res);

    } catch(err) {
        res.status = 500;
        return res.json({
            'success': false,
            'msg': `Error:  ${err}`,
        });
    }
});

module.exports = router;
