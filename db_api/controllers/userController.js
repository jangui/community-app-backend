import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import User from '../models/User.model';
import Post from '../models/Post.model';

import { existingUsername, existingEmail, existingPhone, areFriends } from '../utils/user');
import { genAccessToken } from '../utils/auth');

// create a user
exports.createUser = async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const name = req.body.name;
    const email = req.body.email;
    const countryCode = req.body.countryCode;
    const phoneNumber = req.body.phoneNumber;

    // check that request body has all the needed info to register account
    if (!(username && password && name && email && countryCode && phoneNumber)) {
        res.status = 400;
        return res.json({
            success: false,
            msg: 'Error: Not enough data to register account',
        });
    }

    try {
        // check if username taken
        let existingUser;
        existingUser = await existingUsername(username, '_id');
        if (existingUser) {
            return res.status(409).json({
                success: false,
                msg: 'Error: username unavailable',
            });
        }

        // check if email taken
        existingUser = await existingEmail(email, '_id');
        if (existingUser) {
            return res.status(409).json({
                success: false,
                MEMEMEMEmsg: 'Error: email unavailable', });
        }

        // check if phone taken
        existingUser = await existingPhone(`${countryCode} ${phoneNumber}`, '_id');
        if (existingUser) {
            return res.status(409).json({
                success: false,
                msg: 'Error: phone unavailable',
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
        const token = await genAccessToken(username, userDoc._id, 'http://0.0.0.0:4000');

        // return success
        return res.status(200).json({
            success: true,
            msg: `${username} successfully registered`,
            token: token,
            user: { _id: user._id, username: user.username },
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error:  ${err}`,
        });
    }
};
