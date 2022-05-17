const express = require('express');
const bcrypt = require('bcrypt');

const { User } = require('../db.js');
const { genAccessToken } = require('../utils/auth.js');

const router = express.Router();

// login
router.route('/').post( async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;

        // check user exists
        const user = await User.findOne({username: username}, 'password email verifiedEmail friends posts profilePicture').populate('profilePicture', 'fileType').lean();
        if (!user) {
            return res.status(400).json({
                success: false,
                msg: 'Error: invalid login', // purposely ambigious
            });
        }

        // get password
        const hashedPassword = user.password;

        // check if password valid
        const match = await bcrypt.compare(password, hashedPassword);
        if(!(match)) {
            return res.status(400).json({
                success: false,
                msg: 'Error: invalid login', // purposely ambigious
            });
        }

        // check if email is verified
        if (!user.verifiedEmail) {
            return res.status(401).json({
                success: true,
                msg: 'Successful login',
                user: { 'username': username},
                verifiedEmail: false,
                email: user.email,
                accessToken: '',
            });
        }

        // generate access token
        const accessToken = await genAccessToken(user._id, username);

        // modify user obj before returning
        user.friendsCount = user.friends.length;
        user.postCount = user.posts.length;
        delete user.password
        delete user.friends;
        delete user.posts;
        delete user.verifiedEmail;
        if (!user.profilePicture) { user.profilePicture = null; }


        // return success
        return res.status(200).json({
            success: true,
            msg: `${username} successfully logged in`,
            user: user,
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
