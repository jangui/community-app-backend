import User from '../model/User.model');

export const existingUsername = (username, projection) => {
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

export const existingEmail = (email, projection) => {
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

export const existingPhone = (countryCodeAndPhone, projection) => {
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
export const areFriends = (userID1, userID2) => {
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
