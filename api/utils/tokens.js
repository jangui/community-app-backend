const jwt = require('jsonwebtoken');

/*
 * Creates and returns a json web token
 * @param  {mongoose.Document} The mongoose document of the user logging in
 * @return {String}            A string containing an encoded JWT
 *                             When decoded, token has a member named 'payload'
 *                             which contains the userID and username
 */
const genAccessToken = (user) => {
    const token = jwt.sign(
        { payload: {
            userID: user._id,
            username: user.username
            }
        },
        process.env.JWT_TOKEN_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION },
    );
    return token;
};

exports.genAccessToken = genAccessToken;
