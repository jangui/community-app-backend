const bcrypt = require('bcrypt');

const User = require('../models/User.model.js');
const Post = require ('../models/Post.model.js');

const {
    existingUsername,
    areFriendsID,
    areFriendsUsername,
    hasFriendReqUsername,
    hasFriendReqID
} = require('../utils/user.js');

const { genAccessToken } = require('../utils/auth.js');

// get a user's info
const getUser = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const desiredUsername = req.params.username;

        // get desired user info
        const desiredUser = (await User.aggregate([
            { $match: {
                "username": desiredUser,
            }},
            { $project: {
                "_id": "$_id",
                "username": "$username",
                "name": "$name",
                "image": "$image",
                "open": "$open",
                "visible": "$visible",
                "memberVisibility": "$memberVisibility",
                "friendsCount": {$size: "$friends"},
                "postCount": {$size: "$posts"},
                "friendRequests": "$friendRequests",
            }},
        ]))[0];

        if (!(desiredUser)) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${desiredUsername} does not exist`,
            });
        }

        let friendReq = false;
        let friends = false;
        if (currentUser !== desiredUsername) {
            // check if they sent us a friend requsts
            friendReq = await hasFriendReqID(currentUserID, desiredUser._id);

            if (!friendReq) {
                // check if we're friends
                friends = await areFriendsID(currentUserID, desiredUserID);
            }
        }
        desiredUser.friendReq = friendReq;
        desiredUser.friends = friends;

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
}

// edit current user
const editUser = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;


        // get user obj
        const user = await User.findByid(currentUserID);

        // update username
        if (req.body.username) {
            // check if username valid
            const existingUser = await existingUsername(req.body.username);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    msg: `Error: username '${req.body.username}' is not available`,
                })
            }
            user.username = req.body.username;
        }

        // update name
        if (req.body.name) {
            user.name = req.body.name;
        }

        // update password
        if (req.body.password) {
            // hash and set new password
            hashedPassword = await bcrypt.hash(req.body.password, parseInt(process.env.SALT_ROUNDS));
            user.password = hashedPassword;
        }

        // update email
        if (req.body.email) {
            user.email = req.body.email
            user.verifiedEmail = false;
        }

        // update phone
        if (req.body.countryCode && req.body.phoneNumber) {
            user.countryCode = req.body.countryCode;
            user.phoneNumber = req.body.phoneNumber;
            user.confirmedPhone = false;
        }

        // update profile image
        if (req.files.image) { // TODO
            // delete old image if there is one
            //if (user.profilePicture) {
                // TODO delete old image
            //}
            // upload new image
            //const imageID = await uploadImage(currentUserID, true, false, null, req, res);
            //user.image = imageID;
        }

        // save
        const userDoc = await user.save();
        return res.status(200).json({
            success: true,
            msg: `Successfully updated user`,
            user: {
                _id: userDoc._id,
                username: userDoc.username
            }
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error:  ${err}`,
        });
    }
}

// delete current user
const deleteUser = async (req, res) => {
    try {
        const currentUSer = res.locals.username;
        const currentUserID = res.locals.userID;

        // delete user
        await User.findByIdAndDelete(currentUserID);

        // TODO
        // delete all our posts,
        // delete all our outings
        // delete us as member from all out communities
        // delete all our sent friend requests
        // delete us as friend from all our friends
        // delete all our comments & likes

        return res.status(200).json({
            success: true,
            msg: `${currentUser} successfully deleted`
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
}

// get a users friends
const getFriends = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const desiredUsername = req.params.username;

        // check other user exits
        const desiredUser = await existingUsername(desiredUsername, '_id friends');

        // check if we are friends with desired user
        if (currentUser !== desiredUser && !(await areFriendsID(currentUserID, desiredUser._id))) {
            return res.status(401).json({
                success: false,
                msg: `Error: ${currentUser} cannot get ${desiredUsername}'s friends`,
            });
        }

        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);

        // get friends
        friendIDs = desiredUser.friends.slice(skip, skip+limit+1);

        // get username and friendship status for each friend
        let friends = []
        friendsIDS.map(async (id) => {
            const areFriends = await areFriendsID(currentUserID, id);
            const userDoc = await User.findById(id, 'username');
            const friend = {username: userDoc.username, areFriends: areFriends};
            friends.push(friend);
        });

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
}

// send a user a friend request
const sendFriendRequest = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const desiredUsername = req.params.username;

        // check if we're sending ourselves a friend req
        if (currentUser === desiredUser) {
            return res.status(400).json({
                success: false,
                msg: `Error: cannot send yourself a friend request`,
            });
        }

        // check if other user exists
        const desiredUser = await existingUsername(desiredUser, '_id');

        // check if we're sending a friend a friend req
        if (await areFriendsID(currentUserID, desiredUser._id)) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${currentUser} and ${desiredUsername} are already friends`,
            });
        }

        // check if we already sent a friend req
        if (await hasFriendReqID(desiredUser._id, currentUserID)) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${currentUser} already send ${desiredUsername} a friend request`,
            });
        }

        // check if they sent us a friend requsts
        if (await hasFriendReqID(currentUserID, desiredUser._id)) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${desiredUsername} already sent ${currentUser} a friend request`,
            });
        }

        // send friend request
        await User.findByIdAndUpdate(desiredUser._id,
            { $push: { friendRequests: currentUserID }}
        );
        return res.status(200).json({
            success: true,
            msg: `Successfully sent ${desiredUsername} a friend request`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error:  ${err}`,
        });
    }
}

// get current user's friend requests
const getFriendRequests = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);

        // get friend requests
        const user = await User.findById(currentUserID, 'friendRequests').lean()
        friendRequests = user.friendRequests.slice(skip, skip+limit+1);

        // get username for each friend
        let friendUsernames = []
        friendsIDS.map(async (id) => {
            const friend = await User.findById(id, 'username');
            friendUsernames.push(friendUsername);
        });

        return res.status(200).json({
            success: true,
            msg: `successfully got friend requests ${skip}-${limit+skip} for ${currentUser}`,
            friendRequests: friendUsernames,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error:  ${err}`,
        });
    }
}

// accept a user's friend request
const acceptFriendRequest = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const desiredUsername = req.params.username;

        // check if we're adding ourselves
        if (currentUser === desiredUsername) {
            return res.status(400).json({
                success: false,
                msg: "Error: Can't add yourself as a friend",
            });
        }

        // check desired user exists
        const desiredUser = await existingUser(desiredUsername, '_id');

        // fail if already friends
        if ((await areFriendsID(currentUserID, desiredUser._id))) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${currentUser} and ${desiredUsername} are already friends`,
            });
        }

        // check if we have a friend request to accept
        if (!( await hasFriendRequestID(currentUserId, desiredUser._id))) {
            return res.status(401).json({
                success: false,
                msg: `Error: no friend request from ${desiredUsername}. Cannot add friend`,
            });
        }

        // remove friendRequest
        await User.findByIdAndUpdate(currentUserID,
            { $pull: { friendRequests: newFriendID }}
        );

        // add new friend to current user's friends
        await User.findByIdAndUpdate(currentUserID,
            { $push: { friends: desiredUser._id }}
        );

        // add current user to the new friend's friends
        await User.findByIdAndUpdate(desiredUser._id,
            { $push: { friends: currentUserID }}
        );

        return res.status(200).json({
            success: true,
            msg: `${currentUser} and ${desiredUsername} are now friends`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error:  ${err}`,
        });
    }
}

// reject a user's friend request
const rejectFriendRequest = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const desiredUsername = req.params.username;

        // check other user exists
        const desiredUser = existingUsername(desiredUsername, '_id');

        // check if we have a friend request from the user
        if (!(await hasFriendRequestID(currentUserId, desiredUser._id))) {
            return res.status(401).json({
                success: false,
                msg: `Error: no friend request from ${desiredUsername}. Cannot cancel request`,
            });
        }

        // reject friend request
        await User.findByIdAndUpdate(desiredUser._id,
            { $pull: { friendRequests: currentUserID }}
        );
        return res.status(200).json({
            success: false,
            msg: `Successfully rejeted friend request from ${desiredUsername}`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error:  ${err}`,
        });
    }
}

// remove a friend
const removeFriend = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const desiredUsername = req.params.username;

        // check if we're removing ourselves
        if (currentUser === desiredUsername) {
            return res.status(400).json({
                success: false,
                msg: "Error: Can't remove yourself as a friend",
            });
        }

        // check other user exists
        const desiredUser = await existingUsername(desiredUsername, '_id');

        // check if we are friends
        if (!(await areFriends(currentUserID, desiredUser._id))) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${currentUser} and ${desiredUsername} are not friends`,
            });
        }

        // add new friend to current user's friends
        await User.findByIdAndUpdate(currentUserID,
            { $pull: { friends: desiredUser._id }}
        );

        // remove current user to the new friend's friends
        await User.findByIdAndUpdate(desiredUser._id,
            { $pull: { friends: currentUserID }}
        );

        return res.status(200).json({
            success: true,
            msg: `${currentUser} and ${desiredUsername} are no longer friends`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error:  ${err}`,
        });
    }
}

// get current user's feed
const getFeed = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;

        /*
         TODO is populate better? can we populate with a skip and limit?
        const user = await User.findById(currentUserID).populate({
            path: 'friends',
        });
        */

        // get friends
        const user = await User.findById(currentUserID, 'friends');
        const friends = user.friends;

        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);

        // get posts from our friends
        // TODO this is super inneficient
        let feed = await Post.find({owner: {$in: friends}}).sort('timestamp').skip(skip).limit(limit).lean();

        for (let i = 0; i < feed.length; ++i) {
            // calculate comment total
            feed[i].commentCount = feed[i].comments.length;
            // calculate likes total
            feed[i].likesCount = feed[i].likes.length;
            // only send over first 3 comments and likes
            feed[i].comments = feed[i].comments.slice(0, 3);
            feed[i].likes = feed[i].likes.slice(0, 3);
        }

        return res.status(200).json({
            success: true,
            msg: `Successfully got feed`,
            feed: feed
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error:  ${err}`,
        });
    }

}

exports.getUser = getUser;
exports.editUser = editUser;
exports.deleteUser = deleteUser;
exports.getFriends = getFriends;
exports.sendFriendRequest = sendFriendRequest;
exports.getFriendRequests = getFriendRequests;
exports.acceptFriendRequest = acceptFriendRequest;
exports.rejectFriendRequest = rejectFriendRequest;
exports.removeFriend = removeFriend;
exports.getFeed = getFeed;
