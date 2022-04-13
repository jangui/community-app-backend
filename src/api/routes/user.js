const express = require('express');

const {
    getUser,
    editUser,
    deleteUser,
    getCommunities,
    getFriends,
    sendFriendRequest,
    getFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    getFeed,
} = require('../controllers/userController');

const router = express.Router();

// get a user's info
router.route('/:username').get(getUser);

// edit current user's info
router.route('/edit/').post(editUser);

// delete current user
router.route('/').delete(deleteUser);

// get a user's communities
router.route('/communities').post(getCommunities);

// get a users friends
router.route('/friends/').post(getFriends);

// send a friend request
router.route('/friendRequest/').post(sendFriendRequest);

// get current user's friend requests
router.route('/friendRequests').post(getFriendRequests);

// accept friend request
router.route('/accept/friendRequest/').post(acceptFriendRequest);

// reject a friend request
router.route('/reject/friendRequest/').post(rejectFriendRequest);

// cancel a friend request
router.route('/cancel/friendRequest/').post(cancelFriendRequest);

// remove a friend
router.route('/remove/friend/').post(removeFriend);

// get current user's feed
router.route('/feed').post(getFeed);


module.exports = router;

