import express from 'express';

default export const router = express.Router();

const userController = require('../controllers/userController');

// create a user
router.route('/create').post(userController.createUser);

/*
// get a user's info
router.route('/:username').get(userController.getUser);

// edit current user's info
router.route('/edit/').post(userController.editUser);

// delete current user
router.route('/').delete(userController.deleteUser);

// get a users friends
router.route('/friends/:username').post(userController.getFriends);

// send a friend request
router.route('/friendRequest/:username').post(userController.sendFriendRequest);

// get current user's friend requests
router.route('/friendRequests').post(userController.getFriendRequests);

// accept friend request
router.route('/acceptFriendRequest/:username').post(userController.acceptFriendRequest);

// reject a friend request
router.route('/rejectFriendRequest/:username').post(userController.rejectFriendRequest);

// remove a friend
router.route('/removeFriend/:username').post(userController.removeFriend);

// get current user's feed
router.route('/feed').post(userController.getFeed);

// check user exists
router.route('/exists/:username').post(userController.existingUser);

// check users are friends
router.route('/areFriends').post(userController.areFriends);
*/

