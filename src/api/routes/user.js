const express = require('express');
const router = express.Router();

const {
    registerUser,
    login,
    getUser,
    editUser,
    deleteUser,
    getFriends,
    sendFriendRequest,
    getFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    getFeed
} = require('../controllers/userController');

// register a user
router.route('/register').post( async (req, res) => registerUser(req, res));

// login
router.route('/login').post( async (req, res) => login(req, res));

// get a user's info
router.route('/:username').get(getUser);

// edit current user's info
router.route('/edit/').post(editUser);

// delete current user
router.route('/').delete(deleteUser);

// get a users friends
router.route('/friends/:username').post(getFriends);

// send a friend request
router.route('/friendRequest/:username').post(sendFriendRequest);

// get current user's friend requests
router.route('/friendRequests').post(getFriendRequests);

// accept friend request
router.route('/acceptFriendRequest/:username').post(acceptFriendRequest);

// reject a friend request
router.route('/rejectFriendRequest/:username').post(rejectFriendRequest);

// remove a friend
router.route('/removeFriend/:username').post(removeFriend);

// get current user's feed
router.route('/feed').post(getFeed);

module.exports = router;

