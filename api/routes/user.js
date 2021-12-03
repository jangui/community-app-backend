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
 * GET /user/{username} endpoint
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
 *          friendRequest: have they sent a friend req
 *
 *   401 / 500:
 *     content: application/json
 *     data:
 *       success: false
 *       msg: appropriate error msg
 */
router.route('/:username').get( async (req, res) => {
    const currentUser = res.locals.username;
    const currentUserID = res.locals.userID;
    const desiredUser = req.params.username;

    try {
        // get desired user info
        const user = (await User.aggregate([
            { $match: {
                "username": desiredUser,
            }},
            { $project: {
                "_id": "$_id",
                "username": "$username",
                "name": "$name",
                "image": "$image",
                "friendsCount": {$size: "$friends"},
                "postCount": {$size: "$posts"},
                "friendRequests": "$friendRequests",
            }},
        ]))[0];

        if (!(user)) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${desiredUser} does not exist`,
            });
        }

        let friendReq = false;
        let friends = false;
        if (currentUser !== desiredUser) {
            const currentUserDoc = await User.findById(currentUserID, 'friendRequests').lean()
            // check if they sent us a friend requsts
            const desiredUserDoc = await User.findOne({username:desiredUser}, '_id').lean();
            const desiredUserID = desiredUserDoc._id.toString();
            if (currentUserDoc.friendRequests.includes(desiredUserID)) {
                friendReq = true;
            }
            // check if we're friends
            friends = await areFriends(currentUserID, desiredUserID);
        }
        user.friendReq = friendReq;
        user.friends = friends;

        // dont send back the friend requests
        delete user.friendRequests;

        return res.status(200).json({
            success: true,
            msg: `successfully got ${desiredUser}`,
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
 * DELETE /user/ endpoint
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
router.route('/').delete( async (req, res) => {
    const loggedInUser = res.locals.username;

    try {
        // delete user
        await User.findOneAndDelete({username: loggedInUser});

        // TODO
        // delete all our posts,
        // delete all our outings
        // delete us as member from all out communities
        // delete all our friend requests
        // delete us as friend from all our friends

        return res.status(200).json({
            success: true,
            msg: `${loggedInUser} successfully deleted`
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
});

/*
 * GET /user/{username}/posts endpoint
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
router.route('/:username/posts/').get( async (req, res) => {
    const currentUser = res.locals.username;
    const currentUserID = res.locals.userID;
    const desiredUser = req.params.username;

    try {
        // get other user's ID
        const userDoc = await User.findOne({username: desiredUser}, '_id').lean();
        const desiredUserID = userDoc._id.toString();

        // only get posts for current user or friends of the current user
        if (currentUser !== desiredUser && !(await areFriends(currentUserID, desiredUserID))) {
            return res.status(401).json({
                success: false,
                msg: `Error: ${currentUser} cannot get ${desiredUser}'s posts`,
            });
        }

        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);

        // get posts
        const posts = (await Post.aggregate([
            { $match: {
                owner: desiredUserID,
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

router.route('/addFriend/:username').post( async (req, res) => {
    const currentUser = res.locals.username;
    const currentUserID = res.locals.userID;
    const newFriend = req.params.username;

    // check if we're adding ourselves
    if (currentUser === newFriend) {
        return res.status(400).json({
            success: false,
            msg: "Error: Can't add yourself as a friend",
        });
    }


    try {
        // get other user's id
        const userDoc = await User.findOne({username: newFriend}, '_id').lean();
        const newFriendID = userDoc._id.toString();

        // fail if already friends
        if ((await areFriends(currentUserID, newFriendID))) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${currentUser} and ${newFriend} are already friends`,
            });
        }

        // check if we have a friend request from the user
        const user = await User.findById(currentUserID, 'friendRequests').lean();
        if (!(user.friendRequests.includes(newFriendID))) {
            return res.status(401).json({
                success: false,
                msg: `Error: no friend request from ${newFriend}. Cannot add friend`,
            });

        }

        // remove friendRequest
        await User.findByIdAndUpdate(currentUserID,
            { $pull: { friendRequests: newFriendID }}
        );

        // add new friend to current user's friends
        await User.findByIdAndUpdate(currentUserID,
            { $push: { friends: newFriendID }}
        );

        // add current user to the new friend's friends
        await User.findByIdAndUpdate(newFriendID,
            { $push: { friends: currentUserID }}
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

router.route('/removeFriend/:username').post( async (req, res) => {
    const currentUser = res.locals.username;
    const currentUserID = res.locals.userID;
    const oldFriend = req.params.username;

    // check if we're removing ourselves
    if (currentUser === oldFriend) {
        return res.status(400).json({
            success: false,
            msg: "Error: Can't remove yourself as a friend",
        });
    }

    try {
        // get other user's id
        const userDoc = await User.findOne({username: oldFriend}, '_id').lean();
        const oldFriendID = userDoc._id.toString();

        // fail if aren't friends
        if (!(await areFriends(currentUserID, oldFriendID))) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${currentUser} and ${oldFriend} are not friends`,
            });
        }

        // add new friend to current user's friends
        await User.findByIdAndUpdate(currentUserID,
            { $pull: { friends: oldFriendID }}
        );

        // remove current user to the new friend's friends
        await User.findByIdAndUpdate(oldFriendID,
            { $pull: { friends: currentUserID }}
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
router.route('/:username/friends').get( async (req, res) => {
    const currentUser = res.locals.username;
    const currentUserID = res.locals.userID;
    const desiredUser = req.params.username;

    try {
        // get other user's id
        const userDoc = await User.findOne({username: desiredUser}, '_id').lean();
        const desiredUserID = userDoc._id.toString();

        // only get friends for current user or friends of current user
        if (currentUser !== desiredUser && !(await areFriends(currentUserID, desiredUserID))) {
            return res.status(401).json({
                success: false,
                msg: `Error: ${currentUser} cannot get ${desiredUser}'s friends`,
            });
        }

        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);

        // get friends
        const user = await User.findById(desiredUserID, 'friends').lean()
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
router.route('/friendRequest/:username').post( async (req, res) => {
    const currentUser = res.locals.username;
    const currentUserID = res.locals.userID;
    const desiredUser = req.params.username;

    try {
        // check if we're sending ourselves a friend req
        if (currentUser === desiredUser) {
            return res.status(400).json({
                success: false,
                msg: `Error: cannot send yourself a friend request`,
            });
        }

        // get other user's id
        const userDoc = await User.findOne({username: desiredUser}, '_id').lean();
        const desiredUserID = userDoc._id.toString();

        // check if we're sending a friend a friend req
        if (await areFriends(currentUserID, desiredUserID)) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${currentUser} and ${desiredUser} are already friends`,
            });
        }

        // check if we already sent a friend req
        const otherUser = await User.findById(desiredUserID, 'friendRequests').lean();
        if (otherUser.friendRequests.includes(currentUserID)) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${currentUser} already send ${desiredUser} a friend request`,
            });
        }

        // check if they sent us a friend requsts
        const user = await User.findById(currentUserID, 'friendRequests').lean();
        if (user.friendRequests.includes(desiredUserID)) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${desiredUser} already sent ${currentUser} a friend request`,
            });
        }

        // send friend request
        await User.findByIdAndUpdate(desiredUserID,
            { $push: { friendRequests: currentUserID }}
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
router.route('/cancelFriendRequest/:username').post( async (req, res) => {
    const currentUser = res.locals.username;
    const currentUserID = res.locals.userID;
    const desiredUser = req.params.username;

    try {
        // get other user's id
        const userDoc = await User.findOne({username: desiredUser}, '_id').lean();
        const desiredUserID = userDoc._id.toString();

        // cancel friend request
        await User.findByIdAndUpdate(desiredUserID,
            { $pull: { friendRequests: currentUserID }}
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

// get our friend requests
router.route('/friendRequests').post( async (req, res) => {
    const currentUser = res.locals.username;
    const currentUserID = res.locals.userID;

    try {
        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);

        // get friend requests
        const user = await User.findById(currentUserID, 'friendRequests').lean()
        friendRequests = user.friendRequests.slice(skip, skip+limit+1);

        return res.status(200).json({
            success: true,
            msg: `successfully got friend requests ${skip}-${limit+skip} for ${currentUser}`,
            friendRequests, friendRequests,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error:  ${err}`,
        });
    }
});

module.exports = router;
