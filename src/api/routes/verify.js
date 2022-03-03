const express = require('express');

const { User } = require('../db.js');
const { genAccessToken } = require('../utils/auth.js');

const router = express.Router();

// verify
router.route('/').post( async (req, res) => {
    try {
        const username = req.body.username;
        const verificationCode = req.body.verificationCode;

        // verify
        const user = await User.findOneAndUpdate({username: username}, {verifiedEmail: true}).lean();
        if (!user) {
            return res.status(400).json({
                success: false,
                msg: 'Error: invalid login', // purposely ambigious
            });
        }

        // generate access token
        const accessToken = await genAccessToken(user._id, username);

        // return success
        return res.status(200).json({
            success: true,
            msg: `${username} email verified`,
            user: {_id: user._id, username: username},
            verifiedEmail: true,
            email: user.email,
            accessToken: accessToken
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error:  ${err}`,
        });
    }
});

module.exports = router;
