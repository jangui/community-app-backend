const User = require('../models/User.model');

const existingUsername = (username, projection) => {
    return new Promise(async (res, rej) => {
        try {
            if (!(username)) { rej('no username provided'); return; }

            // check if user w/ username exists
            const user = await User.findOne({username: username}, projection).lean();

            // resolve user
            // if no user found will resolve null
            res(user);

        } catch(err) {
            rej(err);
        }
    });
}

const existingEmail = (email, projection) => {
    return new Promise(async (res, rej) => {
        try {
            if (!(email)) { rej('no email provided'); return; }

            // check if user w/ email exist
            const user = await User.findOne({email: email}, projection).lean();

            // resolve user
            // if no user found will resolve null
            res(user);

        } catch(err) {
            rej(err);
        }
    });
}

const existingPhone = (countryCodeAndPhone, projection) => {
    return new Promise(async (res, rej) => {
        try {
            if (!(countryCodeAndPhone)) { rej('no phone number provided'); return; }

            // split phone number into country code and phone
            const phone = countryCodeAndPhone.split(" ");
            if (phone.length !== 2) { rej('user does not exist'); }
            const countryCode = phone[0];
            const phoneNumber = phone[1];

            // check if user with phone exists
            user = await User.findOne({
                countryCode: countryCode,
                phoneNumber: phoneNumber
            }, projection).lean();

            // resolve user
            // if no user found will resolve null
            res(user);

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
const areFriendsID = (userID1, userID2) => {
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
}

const areFriendsUsername = (username1, username2) => {
    return new Promise( async (res, rej) => {
        try {
            // get user1's friend
            const user1 = await User.find({username: username1}, 'friends').lean();

            // get user2's id
            const user2 = await User.find({username: username2}, '_id').lean();

            // check if friends
            if (user1.friends.includes(user2._id)) {
                res(true);
                return;
            }
            res(false);

        } catch(err) {
            rej(err);
        }
    });
}

// check if username1 has friend req from username2
const hasFriendReqUsername = (username1, username2) => {
    return new Promise( async (res, rej) => {
        try {
            // get user1 friendReqs
            const user1 = await User.find({username: username1}, 'friendRequests').lean();

            // get user2's id
            const user2 = await User.find({username: usernam2}, '_id').lean();

            // check if user1 has friend req from user2
            if ((user1.friendRequests.includes(user2._id))) {
                res(true);
                return;
            }
            res(false);

        } catch(err) {
            rej(err);
        }
    });
}

// check if user w/ id 1 has friend req from user w/ id 2
const hasFriendReqID = (userID1, userID2) => {
    return new Promise( async (res, rej) => {
        try {
            // get user1 friendReqs
            const user1 = await User.findByID(userID1,'friendRequests').lean();

            // check if user1 has friend req from user2
            if ((user1.friendRequests.includes(userID2))) {
                res(true);
                return;
            }
            res(false);

        } catch(err) {
            rej(err);
        }
    });
}

exports.existingUsername = existingUsername;
exports.existingEmail = existingEmail;
exports.existingPhone = existingPhone;
exports.areFriendsID = areFriendsID;
exports.areFriendsUsername = areFriendsUsername;
exports.hasFriendReqUsername = hasFriendReqUsername;
exports.hasFriendReqID = hasFriendReqID;
