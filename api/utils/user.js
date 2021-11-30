
const User = require('../models/User.model');

/*
 * checks if user exists by either checking the username, email or countryCode + phoneNumber
 * @param  {String} userIdentifier      Either a username, email or phone number
 *                                      If the identifier is a phone number it must be a string
 *                                          where the country code and phone number are seperated by a space
 * @return {Promise<mongoose.Document>} A promise that returns a mongoose document of the user trying to log in
 */
const existingUser = (userIdentifier) => {
    return new Promise(async (res, rej) => {
        if (!(userIdentifier)) { rej('need user identifier'); return; }

        try {
            let user;
            // check if identifier is a valid username
            user = await User.findOne({username: userIdentifier});
            if (user) { res(user); return; }

            // check if identifier is a valid email
            user = await User.findOne({email: userIdentifier});
            if (user) { res(user); return; }

            // check if identifier is a valid phone
            const phone = userIdentifier.split(" ");
            if (phone.length !== 2) { rej('invalid country code + phone number'); }
            const countryCode = phone[0];
            const phoneNumber = phone[1];
            user = await User.findOne({countryCode: countryCode, phoneNumber: phoneNumber});
            if (user) { res(user); return; }

        } catch(err) {
            rej(err);
        }

        /*
        // check if identifier is a valid username
        User.findOne({username: userIdentifier}, (err, user) => {
            if (err) { rej(err); return; }
            res(user); return;
        });

        // check if identifier is a valid email
        User.findOne({email: userIdentifier}, (err, user) => {
            if (err) { rej(err); return; }
            res(user); return;
        });

        // check if identifier is a valid phone
        const phone = userIdentifier.split(" ");
        if (phone.length !== 2) { rej('invalid country code + phone number'); }
        const countryCode = phone[0];
        const phoneNumber = phone[1];
        User.findOne({countryCode: countryCode, phoneNumber: phoneNumber}, (err, user) => {
            if (err) { rej(err); return; }
            res(user); return;
        });
        */
    });
}

exports.existingUser = existingUser;
