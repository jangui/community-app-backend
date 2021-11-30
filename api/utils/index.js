const { authUser }  = require('./middlewares');
const { existingUser }  = require('./user');
const { genAccessToken } = require('./tokens');

exports.authUser = authUser;
exports.existingUser = existingUser;
exports.genAccessToken = genAccessToken;
