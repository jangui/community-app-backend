const { authUser }  = require('./middlewares');
const { existingUser, areFriends }  = require('./user');
const { genAccessToken } = require('./tokens');

exports.authUser = authUser;
exports.existingUser = existingUser;
exports.areFriends = areFriends;
exports.genAccessToken = genAccessToken;
