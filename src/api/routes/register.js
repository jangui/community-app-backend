const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const { User }  = require('../db.js');
const { uploadFile } = require('../utils/upload.js');

const router = express.Router();

// register a user
router.route('/').post( async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;
        const name = req.body.name;
        const email = req.body.email;
        const countryCode = req.body.countryCode;
        const phoneNumber = req.body.phoneNumber;

        // check that request body has all the needed info to register account
        if (!(username && password && name && email && countryCode && phoneNumber)) {
            return res.status(400).json({
                success: false,
                msg: 'Error: Not enough data to register account',
            });
        }

        // check if user exists with username, email, or countryCode + phoneNumber
        const existingUser = await User.findOne({
            $or: [
                { username: username },
                { email: email },
                { countryCode: countryCode, phoneNumber: phoneNumber }
            ]
        }, 'username email countryCode phoneNumber').lean();

        // return error if existing user
        if (existingUser) {
            let msg;
            if (existingUser.username === username) {
                msg = `username '${username}' unavailable`;
            } else if (existingUser.email === email) {
                msg = `email '${email}' unavailable`;
            } else if (existingUser.phoneNumber === phoneNumber) {
                msg = `phone '+${countryCode} ${phoneNumber}' unavailable`;
            }
            return res.status(409).json({
                success: false,
                msg: `Error: ${msg}`
            });
        }

        // hash password
        hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS));

        // create user obj
        const user = new User({
            _id: mongoose.Types.ObjectId(),
            username: username,
            password: hashedPassword,
            name: name,
            email: email,
            countryCode: countryCode,
            phoneNumber: phoneNumber
        });

        // add profile picture
        let staticFileData;
        if (req.files && req.files.profilePicture) {
            const staticFile = req.files.profilePicture;
            staticFileData = await uploadFile(staticFile, user._id, true, false, null, req, res);
            user.profilePicture = staticFileData._id;
        }

        // save user to database
        const userDoc = await user.save();

        // return success
        return res.status(200).json({
            success: true,
            msg: `${username} successfully registered`,
            user: { _id: user._id, username: user.username, profilePicture: staticFileData },
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error:  ${err}`,
        });
    }
});

module.exports = router;
