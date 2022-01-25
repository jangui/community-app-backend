const express = require('express');
const bcrypt = require('bcrypt');

const User = require('../models/User.model.js');
const { genAccessToken } = require('../utils/auth.js');

const router = express.Router();

// login
router.route('/login').post( async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;

        // check user exists
        const user = await User.find({username: username}, 'password');
        if (!user) {
            return res.status(401).json({
                success: false,
                msg: 'Error: invalid login', // purposely ambigious
            });
        }

        // get password
        const hashedPassword = user.password;

        // check password
        const match = await bcrypt.compare(password, hashedPassword);
        if(!(match)) {
            return res.status(401).json({
                success: false,
                msg: 'Error: invalid login', // purposely ambigious
            });
        }

        // generate access token
        const token = genAccessToken(user._id, username);

        // return success
        return res.status(200).json({
            success: true,
            msg: `${username} successfully logged in`,
            token: token,
            user: {_id: user._id, username: username}
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error:  ${err}`,
        });
    }
});

module.exports = router;
