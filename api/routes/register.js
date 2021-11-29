const router = require('express').Router();

const User = require('../models/User.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


/*
 * POST /register endpoint
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
 *       msg: A successful register message
 *       token: JWT used for session
 *       user: JSON of the mongoose document of user which registered
 *   409 && 500:
 *     content: application/json
 *     data:
 *       success: false
 *       msg: an appropriate error message
 */
router.route('/').post( async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const name = req.body.name;
    const email = req.body.email;
    const countryCode = req.body.countryCode;
    const phoneNumber = req.body.phoneNumber;

    // check that request body has all the needed info to register account
    if (!(username && password && name && (email || (countryCode && phoneNumber)))) {
        res.status = 400;
        return res.json({
            'success': false,
            'msg': 'Error: Not enough data to register account',
        });
    }

    try {
        // check if username taken
        const existingUser = await User.find({username: username});
        if (existingUser.length !== 0) {
            res.status = 409;
            return res.json({
                'success': false,
                'msg': 'Error: username unavailable',
            });
        }

        // check if email taken
        const existingEmail = await User.find({email: email});
        if (existingEmail.length !== 0) {
            res.status = 409;
            return res.json({
                'success': false,
                'msg': 'Error: email already in use',
            });
        }

        // check if phone taken
        const existingPhone = await User.find({
            countryCode: countryCode,
            phoneNumber: phoneNumber,
        });
        if (existingPhone.length !== 0) {
            res.status = 409;
            return res.json({
                'success': false,
                'msg': 'Error: phone already in use',
            });
        }

        // hash password
        hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS));

        // save user to database
        const user = new User({
            username: username,
            password: hashedPassword,
            name: name,
            email: email,
            countryCode: countryCode,
            phoneNumber: phoneNumber
        });
        const userDoc = await user.save();

        // create JWT
        const token = jwt.sign(
            { userID: [userDoc._id, username] },
            process.env.JWT_TOKEN_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION },
        );

        // return success
        res.status = 200;
        return res.json({
            success: true,
            msg: `${username} successfully registered`,
            token: token,
            user: user,
        });

    } catch(err) {
        res.status = 500;
        return res.json({
            'success': false,
            'msg': `Error:  ${err}`,
        });
    }
});

module.exports = router;
