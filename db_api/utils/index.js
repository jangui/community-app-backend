const { genAccessToken }  = require('./auth');
exports.genAccessToken = genAccessToken;

const { existingUsername, existingEmail, existingPhone, areFriends }  = require('./user');
exports.existingUsername = existingUsername;
exports.existingEmail = existingEmail;
exports.existingPhone = existingPhone;
exports.areFriends = areFriends;


