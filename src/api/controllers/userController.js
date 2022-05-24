const bcrypt = require('bcrypt');

const { User, Post, Notification } = require('../db.js');
const { uploadFile } = require('../utils/upload.js');
const { genAccessToken } = require('../utils/auth.js');
const { includesID } = require('../utils/includesID.js');

// get a user's info
const getUser = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const desiredUsername = req.params.username;

        // get desired user info
        const desiredUser = await User.findOne(
            {username: desiredUsername},
            'username name profilePicture posts friends friendRequests'
        ).lean().populate('profilePicture', 'fileType');

        if (!(desiredUser)) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${desiredUsername} does not exist`,
            });
        }

        if (currentUser !== desiredUsername) {
            let hasFriendReq = false;
            let sentFriendReq = false;
            let friends = false;

            // check if users are friends
            if (includesID(currentUserID, desiredUser.friends)) { friends = true }

            // check if either user has sent a friend request
            if (!friends) {
                // check if desired user has sent us a friend request
                if (includesID(currentUserID, desiredUser.friendRequests)) { hasFriendReq = true }

                // check if we have sent desired user a friend request
                const user = await User.findById(currentUserID, 'friendRequests').lean();
                if (includesID(desiredUser._id, user.friendRequests)) { sentFriendReq = true }
            }

            // add friend ship and request status to object we are returning
            desiredUser.areFriends = friends;
            desiredUser.hasFriendReq = hasFriendReq;
            desiredUser.sentFriendReq = sentFriendReq;
        }

        // add friends and post count to desiredUser obj
        desiredUser.friendsCount = desiredUser.friends.length;
        desiredUser.postCount = desiredUser.posts.length;

        // remove fields from object we are returning
        delete desiredUser.friendRequests;
        delete desiredUser.friends;
        delete desiredUser.posts;

        // check if profile picture set
        if (!desiredUser.profilePicture) { desiredUser.profilePicture = null; }

        // return success
        return res.status(200).json({
            success: true,
            msg: `successfully got ${desiredUsername}`,
            user: desiredUser,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error:  ${err}`,
        });
    }
}

const getNotifications = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);

        const notifications = await Notification.find(
            { notifee: currentUserID }
        ).select(
            '-__v'
        ).sort(
            { timestamp: -1 }
        ).populate(
            'image', 'fileType'
        ).populate({
            path: 'notifier',
            select: 'username profilePicture',
            populate: {
                path: 'profilePicture',
                select: 'fileType',
            },
        }).skip(skip).limit(limit).lean();

        // return notifications
        return res.status(200).json({
            success: true,
            msg: `successfully got notifications ${skip}-${limit+skip-1} for user ${currentUser}`,
            notifications: notifications,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
}

// edit current user
const editUser = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;


        // get auth token ( in case of username change )
        const authHeader = req.headers['authorization'];
        let accessToken = authHeader && authHeader.split(' ')[1];

        // get user doc
        const user = await User.findById(currentUserID).populate('profilePicture', '_id fileType');
        if (!user) {
            return res.status(500).json({
                success: false,
                msg: `Error: error getting user details`,
            })
        }

        // update username
        if (req.body.username) {
            // check if username valid
            const takenUser = await User.findOne({username: req.body.username}).lean();
            if (takenUser) {
                return res.status(400).json({
                    success: false,
                    msg: `Error: username '${req.body.username}' is not available`,
                })
            }
            user.username = req.body.username;

            // gen access token for new username
            accessToken = await genAccessToken(currentUserID, req.body.username);
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
        let staticFileData = user.profilePicture;
        if (req.files && req.files.profilePicture) {
            // TODO delete old image if there is one
            const staticFile = req.files.profilePicture;
            staticFileData = await uploadFile(staticFile, currentUserID, true, false, null, req, res);
            user.profilePicture = staticFileData._id;
        }

        // save
        const userDoc = await user.save();

        // if we updated profile picture, add all profile picture data to updated user document
        if (req.files && req.files.profilePicture) {
            userDoc.profilePicture = staticFileData;
        }


        // return user w/ updated info
        return res.status(200).json({
            success: true,
            msg: `Successfully updated user`,
            user: {
                _id: userDoc._id,
                username: userDoc.username,
                name: userDoc.name,
                email: userDoc.email,
                countryCode: userDoc.countryCode,
                phoneNumber: userDoc.phoneNumber,
                profilePicture: staticFileData,
            },
            accessToken: accessToken,
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
        const currentUser = res.locals.username;
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

// get a user's communities
const getCommunities = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const desiredUsername = req.body.username;
        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);

        let sameUser = false;
        if (currentUser === desiredUsername) { sameUser = true }

        // check other user exits
        const desiredUser = await User.findOne(
            {username: desiredUsername},
            'communities friends')
        .lean().populate({
            path: 'communities',
            select: 'name description open hidden members owners communityImage',
            populate: {
                path: 'communityImage',
                select: 'fileType'
            }
        });
        if (!(desiredUser)) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${desiredUsername} does not exist`,
            });
        }

        // check if we are friends with desired user
        if (!(sameUser) && !(includesID(currentUserID, desiredUser.friends))) {
            return res.status(401).json({
                success: false,
                msg: `Error: ${currentUser} cannot get ${desiredUsername}'s communities`,
            });
        }

        // slice communities according to skip and limit params
        const communities = desiredUser.communities.slice(skip, skip+limit);

        // update info for communities
        communities.forEach( (community) => {
            console.log(community)
            if (!community.communityImage) { community.communityImage = null; }

            isAdmin = false;
            if (includesID(currentUserID, community.owners)) { isAdmin = true; }
            community.isAdmin = isAdmin;

            isMember = false;
            if (includesID(currentUserID, community.members)) { isMember = true; }
            community.isMember = isMember;

            community.members = community.members.length;
            delete community.owners;
        });

        return res.status(200).json({
            success: true,
            msg: `successfully got communities ${skip}-${limit+skip-1} for ${desiredUsername}`,
            communities: communities,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error:  ${err}`,
        });
    }
}

// get a users friends
const getFriends = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const desiredUsername = req.body.username;
        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);

        let sameUser = false;
        if (currentUser === desiredUsername) { sameUser = true }

        // check other user exits
        const desiredUser = await User.findOne(
            {username: desiredUsername},
            'friends')
        .lean().populate('friends', 'username friends');
        if (!(desiredUser)) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${desiredUsername} does not exist`,
            });
        }

        // check if we are friends with desired user
        let friendship = false;
        for (let i = 0; i < desiredUser.friends.length; ++i) {
            if (desiredUser.friends[i]._id.toString() == currentUserID) {
                friendship = true;
                break;
            }
        }

        // check if we have permissions to get friends
        if (!sameUser && !friendship) {
            return res.status(401).json({
                success: false,
                msg: `Error: ${currentUser} cannot get ${desiredUsername}'s friends`,
            });
        }

        // get friends
        const friends = desiredUser.friends.slice(skip, skip+limit);

        // check current user's friendship status with each of desired User's friends
        let currentUserInd = -1;
        friends.map(async (friend, ind) => {
            // if user is getting their own friends, we know they are friends with all their friends
            if (sameUser) {
                friend.areFriends = true;
                delete friend.friends; // dont return friend's friend's
                delete friend._id // dont return friend's friend's id
                return;
            }

            // get the index of current user in their friend's list
            if (friend._id == currentUserID) {
                currentUserInd = ind;
                return;
            }

            // check if user is friends with the friends of the desiredUser
            if (includesID(currentUserID, friend.friends)) {
                friend.areFriends = true;
                delete friend.friends; // dont return friend's friend's
                delete friend._id // dont return friend's friend's id
                return; }

            friend.areFriends = false;
            delete friend.friends; // dont return friend's friend's
            delete friend._id // dont return friend's friend's id
        });

        // remove current user from friends' list
        if (currentUserInd != -1) { friends.splice(currentUserInd, 1); }

        return res.status(200).json({
            success: true,
            msg: `successfully got friends ${skip}-${limit+skip-1} for ${desiredUsername}`,
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
        const desiredUsername = req.body.username;

        // check if we're sending ourselves a friend req
        if (currentUser === desiredUsername) {
            return res.status(400).json({
                success: false,
                msg: `Error: cannot send yourself a friend request`,
            });
        }

        // check other user exits
        const desiredUser = await User.findOne({username: desiredUsername}, 'friends friendRequests').lean();
        if (!(desiredUser)) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${desiredUsername} does not exist`,
            });
        }

        // check if we're sending a friend a friend req
        if (includesID(currentUserID, desiredUser.friends)) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${currentUser} and ${desiredUsername} are already friends`,
            });
        }

        // check if we already sent a friend req
        if (includesID(currentUserID, desiredUser.friendRequests)) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${currentUser} already sent ${desiredUsername} a friend request`,
            });
        }

        // check if they sent us a friend requsts
        const user = await User.findById(currentUserID, 'friendRequests').lean();
        if (includesID(desiredUser._id, user.friendRequests)) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${desiredUsername} already sent ${currentUser} a friend request`,
            });
        }

        // send friend request
        await User.findByIdAndUpdate(desiredUser._id,
            { $push: { friendRequests: currentUserID }}
        );

        // create notification to user
        const notification = new Notification({
            notifee: desiredUser._id,
            notifier: currentUserID,
            referenceType: 0, // reference to a user
            referenceID: currentUserID,
            notificationType: 0
        });
        await notification.save();

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

        // get current user's friend reqs
        const user = await User.findById(
            currentUserID,
            'friendRequests'
        ).lean().populate('friendRequests', 'username');
        friendRequests = user.friendRequests.slice(skip, skip+limit);

        return res.status(200).json({
            success: true,
            msg: `successfully got friend requests ${skip}-${limit+skip-1} for ${currentUser}`,
            friendRequests: friendRequests,
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
        const desiredUsername = req.body.username;

        // check if we're adding ourselves
        if (currentUser === desiredUsername) {
            return res.status(400).json({
                success: false,
                msg: "Error: Can't add yourself as a friend",
            });
        }

        // check desired user exists
        const desiredUser = await User.findOne({username: desiredUsername}, 'friends').lean();
        if (!desiredUser) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${desiredUsername} does not exists`,
            });
        }

        // fail if already friends
        if (includesID(currentUserID, desiredUser.friends)) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${currentUser} and ${desiredUsername} are already friends`,
            });
        }

        // make sure we have a friend request to accept
        const user = await User.findById(currentUserID, 'friendRequests').lean();
        if (!(includesID(desiredUser._id, user.friendRequests))) {
            return res.status(401).json({
                success: false,
                msg: `Error: no friend request from ${desiredUsername}. Cannot add friend`,
            });
        }

        // remove friendRequest
        await User.findByIdAndUpdate(currentUserID,
            { $pull: { friendRequests: desiredUser._id }}
        );

        // add new friend to current user's friends
        await User.findByIdAndUpdate(currentUserID,
            { $push: { friends: desiredUser._id }}
        );

        // add current user to the new friend's friends
        await User.findByIdAndUpdate(desiredUser._id,
            { $push: { friends: currentUserID }}
        );

        // create notification
        const notification = new Notification({
            notifee: currentUserID,
            notifier: desiredUser._id,
            referenceType: 0, // reference to a user
            referenceID: desiredUser._id,
            notificationType: 0
        });
        await notification.save();

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
        const desiredUsername = req.body.username;

        // check if we are rejecting our own friend req
        if (currentUser === desiredUsername) {
            return res.status(401).json({
                success: false,
                msg: `Error: cannot reject friend request from yourself`,
            });
        }

        // check other user exists
        const desiredUser = await User.findOne({username: desiredUsername}, 'username').lean();
        if (!(desiredUser)) {
            return res.status(401).json({
                success: false,
                msg: `Error: ${desiredUsername} does not exists`,
            });
        }

        // check if we have a friend request from the user
        const user = await User.findById(currentUserID, 'friendRequests').lean();
        if (!(includesID(desiredUser._id, user.friendRequests))) {
            return res.status(400).json({
                success: false,
                msg: `Error: no friend request from ${desiredUsername}. Cannot reject request`,
            });
        }

        // reject friend request
        await User.findByIdAndUpdate(currentUserID,
            { $pull: { friendRequests: desiredUser._id }}
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

const cancelFriendRequest = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const desiredUsername = req.body.username;

        // check if we are rejecting our own friend req
        if (currentUser === desiredUsername) {
            return res.status(401).json({
                success: false,
                msg: `Error: cannot cancel friend request from yourself`,
            });
        }

        // check other user exists
        const desiredUser = await User.findOne({username: desiredUsername}, 'username friendRequests').lean();
        if (!(desiredUser)) {
            return res.status(401).json({
                success: false,
                msg: `Error: ${desiredUsername} does not exists`,
            });
        }

        // check if we send a friend request to the user
        if (!(includesID(currentUserID, desiredUser.friendRequests))) {
            return res.status(400).json({
                success: false,
                msg: `Error: no friend request to ${desiredUsername}. Cannot cancel request`,
            });
        }

        // cancel friend request
        await User.findByIdAndUpdate(desiredUser._id,
            { $pull: { friendRequests: currentUserID }}
        );
        return res.status(200).json({
            success: false,
            msg: `Successfully cancelled friend request to ${desiredUsername}`,
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
        const desiredUsername = req.body.username;

        // check if we're removing ourselves
        if (currentUser === desiredUsername) {
            return res.status(400).json({
                success: false,
                msg: "Error: Can't remove yourself as a friend",
            });
        }

        // check other user exists
        const desiredUser = await User.findOne({username: desiredUsername}, 'friends').lean();
        if (!desiredUser) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${desiredUsername} does not exists`,
            });
        }

        // check if we are friends
        if (!includesID(currentUserID, desiredUser.friends)) {
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
        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);

        // get friends
        const user = await User.findById(currentUserID, 'friends communities');
        if (!user) {
            return res.status(500).json({
                success: false,
                msg: `Error: error getting current user info`,
            });
        }
        const friends = user.friends;

        // get posts from our friends
        let feed = await Post.find({
                $or: [
                    { owner: {$in: friends} },
                    { $and: [
                        { communityPost: true },
                        { community: {$in: user.communities }},
                        { owner: {$ne: currentUserID}}
                    ]}
                ]
            }).populate(
                'postFile', 'fileType'
            ).populate(
                'community', 'name'
            ).populate(
                'likes', 'owner'
            ).populate({
                path: 'owner',
                select: 'username profilePicture',
                populate: {
                    path: 'profilePicture',
                    select: 'fileType',
                },
            }).sort(
                { timestamp: -1 }
            ).skip(skip).limit(limit).lean();

        // modify return data
        feed.forEach( (post) => {
            // check if post already liked
            post.hasLiked = false;
            for (let i = 0; i < post.likes.length; ++i) {
                like = post.likes[i];
                if (like.owner == currentUserID) {
                    post.hasLiked = true;
                    break;
                }
            }
            post.commentCount = post.comments.length;
            post.likesCount = post.likes.length;
            delete post.comments;
            delete post.likes;
            delete post.__v;
            if (post.comunityPost) { post.community = post.community.name; } else { post.community = null; }
            if (post.postType == '0') { post.postFile = null; }
            if (!post.owner.profilePicture) { post.owner.profilePicture = null; }
        });

        return res.status(200).json({
            success: true,
            msg: `Successfully got feed elements ${skip}-${limit+skip-1}`,
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
exports.getNotifications = getNotifications;
exports.editUser = editUser;
exports.deleteUser = deleteUser;
exports.getCommunities = getCommunities;
exports.getFriends = getFriends;
exports.sendFriendRequest = sendFriendRequest;
exports.getFriendRequests = getFriendRequests;
exports.acceptFriendRequest = acceptFriendRequest;
exports.rejectFriendRequest = rejectFriendRequest;
exports.cancelFriendRequest = cancelFriendRequest;
exports.removeFriend = removeFriend;
exports.getFeed = getFeed;
