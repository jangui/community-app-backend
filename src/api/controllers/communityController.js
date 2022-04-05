const mongoose = require('mongoose');

const { User, Community, Outing } = require('../db.js');
const { uploadFile } = require('../utils/upload.js');
const { includesID } = require('../utils/includesID.js');

// create a community
const createCommunity = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const communityName = req.body.name;
        const description = req.body.description;
        const open = req.body.open;
        const hidden = req.body.hidden;

        // check if community already exists
        const found = await Community.findOne({name: communityName});
        if (found) {
            return res.status(400).json({
                success: false,
                msg: `Error: Community with name '${communityName}' already exists.`
            });
        }

        // create community
        let community = new Community({
            _id: mongoose.Types.ObjectId(),
            name: communityName,
            open: open,
            hidden: hidden,
            owners: [currentUserID],
            members: [currentUserID],
        });

        // add description if provided
        if (description) {
            community.description = description;
        }

        // add community image
        let staticFileData;
        if (req.files && req.files.communityImage) {
            const staticFile = req.files.communityImage;
            staticFileData = await uploadFile(staticFile, currentUserID, true, true, community._id, req, res);
            community.communityImage = staticFileData._id
        }

        // save to database
        const communityDoc = await community.save();

        return res.status(200).json({
            success: true,
            msg: `Successfully created community ${communityName}`,
            community: { _id: communityDoc._id, name: communityDoc.name, communityImage: staticFileData },
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
}

// get a community's info
const getCommunity = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const communityName = req.params.community;

        // get community
        const community = await Community.findOne(
            {name: communityName},
            'name description communityImage open hidden members'
        ).lean().populate('communityImage', 'fileType');

        // check if community exists
        if (!community) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${communityName} does not exist.`
            });
        }

        // set members to member count
        community.members = community.members.length;

        // return success
        return res.status(200).json({
            success: true,
            msg: `Successfully got ${communityName}`,
            community: community,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
}

// edit a community's info
const editCommunity = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const communityName = req.body.community;
        const newName = req.body.newName;
        const description = req.body.description;
        const open = req.body.open;
        const hidden = req.body.hidden;

        // get community
        const community = await Community.findOne(
            {name: communityName},
            'name description communityImage open hidden owners'
        ).populate('communityImage', 'fileType');

        // check if community exists
        if (!community) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${communityName} does not exist.`
            });
        }

        // check if we have permissions to edit community
        if (!includesID(currentUserID, community.owners)) {
            return res.status(403).json({
                success: false,
                msg: `Error: ${currentUser} cannot edit community '${communityName}'`
            });
        }

        // edit commmunity
        if (newName) {
            // check if name taken
            const existingCommunity = await Community.findOne({name: newName}, 'name').lean();
            if (existingCommunity) {
                return res.status(409).json({
                    success: false,
                    msg: `Error: community name '${newName}' is already taken`
                });
            }
            community.name = newName;
        }

        if (description) {
            community.description = description;
        }

        if (open) {
            community.open = open;
        }

        if (hidden) {
            community.hidden = hidden;
        }

        // edit community image
        let staticFileData = community.communityImage;
        if (req.files && req.files.communityImage) {
            // TODO delete old community image if there is one
            const staticFile = req.files.communityImage;
            staticFileData = await uploadFile(staticFile, currentUserID, true, true, community._id, req, res);
            community.communityImage = staticFileData._id
        }

        // save edits
        await community.save();

        // return success
        return res.status(200).json({
            success: true,
            msg: `Successfully edited ${communityName}`,
            community: {
                _id: community._id,
                name: community.name,
                description: community.description,
                open: community.open,
                hidden: community.hidden,
                communityImage: staticFileData
            },
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
}

// delete a community
const deleteCommunity = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const communityName = req.params.community;

        // check community exists
        const community = await Community.findOne({name: communityName}, 'owners').lean();
        if (!community) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${communityName} does not exists`
            });
        }

        // check if we have permissions to delete community
        if (!includesID(currentUserID, community.owners)) {
            return res.status(403).json({
                success: false,
                msg: `Error: ${currentUser} cannot delete community '${communityName}'`
            });
        }

        // TODO
        // delete all the communities outings
        // remove community from user's communities
        // delete picture

        // delete the community
        await Community.findOneAndDelete({name: communityName});

        return res.status(200).json({
            success: true,
            msg: `Succesfully deleted community '${communityName}'`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
}

const getMembers = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const communityName = req.body.community;
        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);

        // get community
        const community = await Community.findOne(
            { name: communityName },
            'members -_id'
        ).lean().populate({
            path: 'members',
            select: 'username friends -_id',
            populate: {
                path: 'friends',
                select: 'username -_id'
            },
        });

        // check if community exists
        if (!community) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${communityName} does not exist.`
            });
        }

        // slice members according to how many requests
        members = community.members.slice(skip, skip+limit);

        console.log(members[0]);

        // add friendship status to each member
        for (let i = 0; i < members.length; ++i) {
            const member = members[i]
            if (member.username == currentUser) { delete member.friends; continue; }
            areFriends = false;

            for (let j = 0; j < member.friends.length; ++j) {
                const friend = member.friends[j];
                if (friend.username == currentUser) { areFriends = true; break; }
            }
            member.areFriends = areFriends;
            delete member.friends
        }

        return res.status(200).json({
            success: true,
            msg: `successfully got members ${skip}-${limit+skip-1} for community '${communityName}'`,
            members: members,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
}

// invite a user to a community
const inviteUser = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const communityName = req.body.community;
        const invitedUsername = req.body.invitedUser;

        // check user exists
        const invitedUser = await User.findOne({username: invitedUsername}, 'communityRequests').lean();
        if (!invitedUser) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${invitedUsername} does not exist.`
            });
        }

        // check community exists
        const community = await Community.findOne({name: communityName}, 'owners members').lean();
        if (!community) {
            return res.status(409).json({
                success: false,
                msg: `Error: ${communityName} does not exists`
            });
        }

        // check if we have permissions to send a user a community invite
        if (!includesID(currentUserID, community.owners)) {
            return res.status(403).json({
                success: false,
                msg: `Error: ${currentUser} cannot send community invites for community '${communityName}'`
            });
        }

        // check if invited user is already a member
        if (includesID(invitedUser._id, community.members)) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${invitedUsername} is already a member`
            });
        }

        // check if invited user already has an invite
        if (includesID(community._id, invitedUser.communityRequests)) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${invitedUsername} already has an invite`
            });
        }

        // send user an invite
        await User.findOneAndUpdate({username: invitedUsername},
            { $push: { communityRequests: community._id }}
        );

        return res.status(200).json({
            success: true,
            msg: `Succesfully sent ${invitedUsername} a request to join ${communityName}`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
}

// accept a community invite
const acceptInvite = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const communityName = req.body.community;

        // get user info
        const user = await User.findById(currentUserID, 'communityRequests').lean();
        if (!user) {
            return res.status(500).json({
                success: false,
                msg: `Error: error getting ${currentUser}'s info`
            });
        }

        // check community exists
        const community = await Community.findOne({name: communityName}, '_id').lean();
        if (!community) {
            return res.status(409).json({
                success: false,
                msg: `Error: ${communityName} does not exists`
            });
        }

        // check if user has an invite
        if (!includesID(community._id, user.communityRequests)) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${currentUser} does not have an invite to community '${communityName}'`
            });
        }

        // add community to user's communities and remove user invite
        await User.findOneAndUpdate({username: currentUser}, {
            $push: { communities: community._id },
            $pull: { communityRequests: community._id },
        });

        // add user to community
        await Community.findOneAndUpdate({name: communityName},
            { $push: { members: currentUserID }}
        );

        // return success
        return res.status(200).json({
            success: true,
            msg: `successfully accepted invite to community '${communityName}'`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
}


// join a community or send a private community a join request
const joinCommunity = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const communityName = req.body.communityName;

        // check community exists
        const community = await Community.findOne({name: communityName}, 'members open memberRequests').lean();
        if (!community) {
            return res.status(409).json({
                success: false,
                msg: `Error: ${communityName} does not exists`
            });
        }

        // check user already a member
        if (includesID(currentUserID, community.members)) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${currentUser} is already a member of community '${communityName}'`
            });
        }

        // send community request if private
        if (!community.open) {
            // check if we already sent member request
            if (includesID(currentUserID, community.memberRequests)) {
                return res.status(400).json({
                    success: false,
                    msg: `Error: ${currentUser} already sent a member request to community '${communityName}'`
                });
            }

            // send community request to join
            await Community.findByIdAndUpdate(community._id,
                { $push: { memberRequests: currentUserID }}
            );

            return res.status(200).json({
                success: true,
                msg: `Succesfully sent join request to community ${communityName}`,
            });
        }

        // if public
        // add ourselves as a member
        await Community.findByIdAndUpdate(community._id,
            { $push: { members: currentUserID }}
        );

        // add community to our communities
        await User.findByIdAndUpdate(currentUserID,
            { $push: {communities: community._id }}
        );

        return res.status(200).json({
            success: true,
            msg: `Succesfully joined community ${communityName}`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
}

// accept a user to a private community
const acceptUser = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const communityName = req.body.community;
        const invitedUsername = req.body.username;

        // get user info
        const invitedUser = await User.findOne({username: invitedUsername}, '_id').lean();
        if (!invitedUser) {
            return res.status(500).json({
                success: false,
                msg: `Error: ${invitedUsername} does not exists.`
            });
        }

        // check community exists
        const community = await Community.findOne({name: communityName}, 'memberRequests owners members').lean();
        if (!community) {
            return res.status(409).json({
                success: false,
                msg: `Error: ${communityName} does not exists`
            });
        }

        // check community has a join request from user
        if (!includesID(invitedUser._id, community.memberRequests)) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${invitedUsername} has not requested to join community '${communityName}'`
            });
        }

        // check user already a member
        if (includesID(invitedUser._id, community.members)) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${invitedUsername} is already a member of community '${communityName}'`
            });
        }

        // check if we have permisions to accept user
        if (!includesID(currentUserID, community.owners)) {
            return res.status(401).json({
                success: false,
                msg: `Error: insufficient permissions to accept users into community '${communityName}'`
            });
        }

        // add user to community and remove member request
        await Community.findOneAndUpdate({name: communityName}, {
            $push: { members: invitedUser._id },
            $pull: { memberRequests: invitedUser._id },
        });

        // community to user's communities
        await User.findOneAndUpdate({username: invitedUsername}, {
            $push: { communities: community._id },
        });

        // return success
        return res.status(200).json({
            success: true,
            msg: `successfully accepted user '${invitedUsername}' to community '${communityName}'`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
}


// leave communtiy
const leaveCommunity = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const communityName = req.body.community;

        // check community exists
        const community = await Community.findOne({name: communityName}, 'owners members').lean();
        if (!community) {
            return res.status(409).json({
                success: false,
                msg: `Error: ${communityName} does not exists`
            });
        }

        // check if we own the community
        if (includesID(currentUserID, community.owners)) {
            return res.status(401).json({
                success: false,
                msg: `Error: Cannot leave a community you own`
            });
        }

        // check if we are a memmber
        if (!includesID(currentUserID, community.members)) {
            return res.status(401).json({
                success: false,
                msg: `Error: Cannot leave a community you are not part of.`
            });
        }

        // remove ourselves as a member
        await Community.findByIdAndUpdate(community._id,
            { $pull: { members: currentUserID }}
        );

        // remove community from our communities
        await User.findByIdAndUpdate(currentUserID,
            { $pull: { communities: community._id }}
        );

        // TODO
        // delete our outings from community
        // remove our comments and votes from outings

        return res.status(200).json({
            success: true,
            msg: `Succesfully left community ${communityName}`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
}

// get community's outings
const getOutings = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const communityName = req.body.community;
        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);

        // get community
        const community = await Community.findOne({name: communityName},'_id').lean();

        // check if community exists
        if (!community) {
            return res.status(400).json({
                success: false,
                msg: `Error: community '${communityName}' does not exist.`
            });
        }

        // get outings for community
        const outings = await Outing.find(
            { community: community._id },
            'owner title canRSVP visibleRSVP location start end attendees interested comments polls timestamp',
        ).sort(
            { timestamp: 1 },
        ).skip(skip).limit(limit).lean();

        // modify return data
        outings.forEach( (outing) => {
            outing.attendees = outing.attendees.length;
            outing.interested = outing.interested.length;
            outing.comments = outing.comments.length;
        });


        return res.status(200).json({
            success: true,
            msg: `successfully got outings ${skip}-${limit+skip-1} for community '${communityName}'`,
            outings: outings,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
}

const searchCommunities = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const searchQuery = req.body.search;
        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);

        // search
        const communities = await Community
            .find(
                { name: {"$regex": searchQuery, "$options": "i" } },
                 'name description open hidden communityImage members'
            ).skip(skip)
            .limit(limit)
            .lean()
            .populate('communityImage', 'fileType');

        if (!communities) {
            return res.status(500).json({
                success: false,
                msg: `Error: error searching for communities.`
            });
        }

        // calc member count per community
        communities.forEach( (community) => {
            community.members = community.members.length;
        });

        return res.status(200).json({
            success: true,
            msg: `successfully got results ${skip}-${limit+skip-1} for community search '${searchQuery}'`,
            communities: communities,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
}

exports.createCommunity = createCommunity;
exports.getCommunity = getCommunity;
exports.editCommunity = editCommunity;
exports.deleteCommunity = deleteCommunity;
exports.getMembers = getMembers;
exports.inviteUser = inviteUser;
exports.acceptInvite = acceptInvite;
exports.joinCommunity = joinCommunity;
exports.acceptUser = acceptUser;
exports.leaveCommunity = leaveCommunity;
exports.getOutings = getOutings;
exports.searchCommunities = searchCommunities;
