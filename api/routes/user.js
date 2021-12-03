const router = require('express').Router();
const mongoose = require('mongoose');

const User = require('../models/User.model');
const Post = require('../models/Post.model');
const { existingUser, areFriends } = require('../utils');

/*
 * All these endpoints are only available if authenticated.
 * Authentication is done by middleware which checks for a JWT
 * On success the authentication middleware stores the authenticated
 * user's username and id in the response object
 * these can be accessed at res.locals.username and res.locals.userID
 */

/*
 * GET /user/{userID} endpoint
 * Responses:
 *   200:
 *     content: application/json
 *     data:
 *       success: true
 *       msg: A successful register message
 *       user:
 *          _id: user id
 *          username: user's username
 *          image: profile picutre ID
 *          friendsCount: # of friends
 *          postCount: # of posts
 *
 *   401 / 500:
 *     content: application/json
 *     data:
 *       success: false
 *       msg: appropriate error msg
 */
router.route('/:userID').get( async (req, res) => {
    const userID = req.params.userID;

    try {
        // get user info
        const user = (await User.aggregate([
            { $match: {
                "_id": mongoose.Types.ObjectId(userID),
            }},
            { $project: {
                "_id": "$_id",
                "username": "$username",
                "name": "$name",
                "image": "$image",
                "friendsCount": {$size: "$friends"},
                "postCount": {$size: "$posts"},
                "friends": "$friends",
            }},
        ]))[0];

        if (!(user)) {
            return res.status(400).json({
                success: false,
                msg: `Error: User does not exist. id: ${userID}`,
            });
        }

        return res.status(200).json({
            success: true,
            msg: `successfully got ${user.username}`,
            user: user,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error:  ${err}`,
        });
    }
});

/*
 * DELETE /user/{userID} endpoint
 * Responses:
 *   200:
 *     content: application/json
 *     data:
 *       success: true
 *       msg: success message
 *   401 / 500:
 *     content: application/json
 *     data:
 *       success: false
 *       msg: appropriate error msg
 */
router.route('/:userID').delete( async (req, res) => {
    const loggedInUser = res.locals.userID;
    const toDelete = req.params.userID;

    // make sure you can only delete your own account
    if (loggedInUser !== toDelete) {
        return res.status(401).json({
            success: false,
            msg: `Error: User ${loggedInUser} cannot delete ${username}`,
        });
    }

    try {
        // delete user
        await User.findByIdAndDelete({userID});

        return res.status(200).json({
            success: true,
            msg: `${userID} successfully deleted`
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
});

/*
 * GET /user/{userID}/posts endpoint
 * Responses:
 *   200:
 *     content: application/json
 *     data:
 *       success: true
 *       msg: A successful register message
 *       posts: array of posts
 *          [ post:
 *              _id: post id
 *              postType: { Integer } 0 == text post; 1 == picture post
 *              text: the text of the post (or the image's caption)
 *              image: the image id for the post (undefined if text post)
 *          ]
 *
 *   401 / 500:
 *     content: application/json
 *     data:
 *       success: false
 *       msg: appropriate error msg
 */
router.route('/:userID/posts/').post( async (req, res) => {
    const currentUser = res.locals.userID;
    const desiredUser = req.params.userID;

    try {
        // only get posts for current user or friends of the current user
        if (currentUser !== desiredUser && !(await areFriends(currentUser, desiredUser))) {
            return res.status(401).json({
                success: false,
                msg: `Error: User ${currentUser} cannot get ${desiredUser}'s posts`,
            });
        }

        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);

        // get posts
        const posts = (await Post.aggregate([
            { $match: {
                owner: mongoose.Types.ObjectId(desiredUser),
            }},
            { $skip: skip},
            { $limit: limit},
            { $sort: { timestamp: 1 }},
            { $project: {
                "_id": "$_id",
                "postType": "$postType",
                "text": "$text",
                "image": "$image",
            }},
        ]))[0];

        return res.status(200).json({
            success: true,
            msg: `successfully got posts ${skip}-${limit+skip} for ${desiredUser}`,
            posts: posts,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error:  ${err}`,
        });
    }
});

router.route('/addFriend/').post( async (req, res) => {
    const currentUser = res.locals.userID;
    const newFriend = req.body.userID;

    // check if we're adding ourselves
    if (currentUser === newFriend) {
        return res.status(400).json({
            success: false,
            msg: "Error: Can't add yourself as a friend",
        });
    }


    try {

        // fail if already friends
        if ((await areFriends(currentUser, newFriend))) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${currentUser} and ${newFriend} are already friends`,
            });
        }

        // check if we have a friend request from the user
        const user = await User.findById(currentUser, 'friendRequests').lean();
        if (!(user.friendRequests.includes(newFriend))) {
            return res.status(401).json({
                success: false,
                msg: `Error: no friend request from ${newFriend}. Cannot add friend`,
            });

        }

        // remove friendRequest
        await User.findByIdAndUpdate(currentUser,
            { $pull: { friendRequests: newFriend }}
        );

        // add new friend to current user's friends
        await User.findByIdAndUpdate(currentUser,
            { $push: { friends: newFriend }}
        );

        // add current user to the new friend's friends
        await User.findByIdAndUpdate(newFriend,
            { $push: { friends: currentUser }}
        );

        return res.status(200).json({
            success: true,
            msg: `${currentUser} and ${newFriend} are now friends`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error:  ${err}`,
        });
    }

});

router.route('/removeFriend/').post( async (req, res) => {
    const currentUser = res.locals.userID;
    const oldFriend = req.body.userID;

    // check if we're removing ourselves
    if (currentUser === oldFriend) {
        return res.status(400).json({
            success: false,
            msg: "Error: Can't remove yourself as a friend",
        });
    }

    try {
        // fail if aren't friends
        if (!(await areFriends(currentUser, oldFriend))) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${currentUser} and ${oldFriend} are not friends`,
            });
        }

        // add new friend to current user's friends
        await User.findByIdAndUpdate(currentUser,
            { $pull: { friends: oldFriend }}
        );

        // remove current user to the new friend's friends
        await User.findByIdAndUpdate(oldFriend,
            { $pull: { friends: currentUser }}
        );

        return res.status(200).json({
            success: true,
            msg: `${currentUser} and ${oldFriend} are no longer friends`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error:  ${err}`,
        });
    }

});

// get a users friends
router.route('/:userID/friends').get( async (req, res) => {
    const currentUser = res.locals.userID;
    const desiredUser = req.params.userID;

    try {
        // only get friends for current user or friends of current user
        if (currentUser !== desiredUser && !(await areFriends(currentUser, desiredUser))) {
            return res.status(401).json({
                success: false,
                msg: `Error: User ${currentUser} cannot get ${desiredUser}'s friends`,
            });
        }

        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);

        // get friends
        const user = await User.findById(desiredUser, 'friends').lean()
        friends = user.friends.slice(skip, skip+limit+1);

        return res.status(200).json({
            success: true,
            msg: `successfully got friends ${skip}-${limit+skip} for ${desiredUser}`,
            friends: friends,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error:  ${err}`,
        });
    }
});

// send a friend request
router.route('/friendRequest').post( async (req, res) => {
    const currentUser = res.locals.userID;
    const desiredUser = req.body.userID;

    try {
        // check if we're sending ourselves a friend req
        if (currentUser === desiredUser) {
            return res.status(400).json({
                success: false,
                msg: `Error: cannot send yourself a friend request`,
            });
        }

        // check if we're sending a friend a friend req
        if (await areFriends(currentUser, desiredUser)) {
            return res.status(400).json({
                success: false,
                msg: `Error: User ${currentUser} and ${desiredUser} are already friends`,
            });
        }

        // check if we already sent a friend req
        const user = await User.findById(desiredUser, 'friendRequests').lean();
        if (user.friendRequests.includes(currentUser)) {
            return res.status(400).json({
                success: false,
                msg: `Error: User ${currentUser} already send ${desiredUser} a friend request`,
            });
        }

        // send friend request
        await User.findByIdAndUpdate(desiredUser,
            { $push: { friendRequests: currentUser }}
        );
        return res.status(200).json({
            success: true,
            msg: `Successfully sent ${desiredUser} a friend request`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error:  ${err}`,
        });
    }

});

// cancel a friend request
router.route('/cancelFriendRequest').post( async (req, res) => {
    const currentUser = res.locals.userID;
    const desiredUser = req.params.userID;

    try {
        // cancel friend request
        await User.findByIdAndUpdate(desiredUser,
            { $pull: { friendRequests: currentUser }}
        );
        return res.status(200).json({
            success: false,
            msg: `Successfully cancelled friend request to ${desiredUser}`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error:  ${err}`,
        });
    }

});

module.exports = router;
