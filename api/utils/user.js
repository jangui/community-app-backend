const mongoose = require('mongoose');

const User = require('../models/User.model');

/*
 * checks if user exists by either checking the username, email or countryCode + phoneNumber
 * @param  {String} userIdentifier  Either a username, id, email or phone number
 *                                  If the identifier is a phone number it must be a string
 *                                      where the country code and phone number are seperated by a space
 * @return {Promise<Object>}        A promise that returns an object of the user trying to log in.
 *                                  The object has a username and _id field
 */
const existingUser = (userIdentifier) => {
    return new Promise(async (res, rej) => {
        if (!(userIdentifier)) { rej('need user identifier'); return; }

        try {
            let user;
            // check if identifier is a valid username
            user = await User.findOne({username: userIdentifier}, 'username').lean();
            if (user) { res(user); return; }

            // check if identifier is a valid email
            user = await User.findOne({email: userIdentifier}, 'username').lean();
            if (user) { res(user); return; }

            // check if identifier is a valid phone
            const phone = userIdentifier.split(" ");
            if (phone.length !== 2) { rej('user does not exist'); }
            const countryCode = phone[0];
            const phoneNumber = phone[1];
            user = await User.findOne({
                countryCode: countryCode,
                phoneNumber: phoneNumber
            }, 'username').lean();
            if (user) { res(user); return; }


            // if unable to find user
            rej('user does not exist');

        } catch(err) {
            rej(err);
        }
    });
}

/*
 * checks if two users are friends
 * @param  {String} userID1  The first user's id
 * @param  {String} userID2  The other user's id
 * @return {Boolean}         Boolean represnting whether two users are friends or not
 */
const areFriends = (userID1, userID2) => {
    return new Promise( async (res, rej) => {
        try {
            // check users are friends
            const user = await User.findById(userID1, 'friends').lean();

            if (user.friends.includes(userID2)) {
                res(true);
                return;
            }
            res(false);

        } catch(err) {
            rej(err);
        }
    });
};

exports.existingUser = existingUser;
exports.areFriends = areFriends;
