const mongoose = require('mongoose');

const { User, Community } = require('../db.js');
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
        let staticFileData = "";
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
        const community = (await Community.aggregate([
            { $match: {
                "name": communityName,
            }},
            { $project: {
                "_id": "$_id",
                "name": "$name",
                "description": "$description",
                "image": "$image",
                "open": "$open",
                "visible": "$visible",
                "membersCount": {$size: "$members"},
                "outingsCount": {$size: "$outings"},
            }},
        ]))[0];

        // check if community exists
        if (!community) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${communityName} does not exist.`
            });
        }

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
const editCommunity = async (req, res) => {} // TODO

// delete a community
const deleteCommunity = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const communityName = req.params.communityName;

        // check community exists
        const community = await Community.findOne({name: communityName}, 'owners').lean();
        if (!community) {
            return res.status(409).json({
                success: false,
                msg: `Error: ${communityName} does not exists`
            });
        }

        // check we own the community
        const owners = community.owners;
        let own = false;
        owners.map(owner => {
            if (owner.toString() === currentUserID) {
                own = true; return;
            }
        });
        if (!own) {
            return res.status(409).json({
                success: false,
                msg: `Error: ${currentUser} does not own community ${communityName}`
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
            msg: `Succesfully delete community ${communityName}`,
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
        const communityName = req.body.communityName;
        const invitedUsername = req.body.invitedUsername;

        // check user exists
        const invitedUser = await User.findOne({username: invitedUsername}, 'communityRequests').lean();
        if (!requestedUser) {
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

        // check we own the community in order to send other user a request
        const owners = community.owners;
        let own = false;
        owners.map(owner => {
            if (owner.toString() === currentUserID) {
                own = true; return;
            }
        });
        if (!own) {
            return res.status(409).json({
                success: false,
                msg: `Error: Cannot invite users to a community you don't own.`
            });
        }

        // check requested user is not already a member
        const members = community.members;
        let isMember = false;
        members.map(member => {
            if (member.toString() === invitedUser._id) {
                isMember = true; return;
            }
        });
        if (isMember) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${invitedUsername} is already a member of ${cummunityName}`,
            });
        }

        // check request has not already been sent to user
        const requests = invitedUser.communityRequests;
        let sentRequest = false;
        requests.map( req => {
            if (req.toString() === community._id.toString()) {
                sentRequest = true; return;
            }
        });
        if (sentRequest) {
            return res.status(400).json({
                success: false,
                msg: `Error: requests already sent to ${invitedUser}`,
            });
        }

        // send user a request
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

// join a community or send a private community a join request
const joinCommunity = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const communityName = req.body.communityName;

        // check community exists
        const community = await Community.findOne({name: communityName}, 'members open').lean();
        if (!community) {
            return res.status(409).json({
                success: false,
                msg: `Error: ${communityName} does not exists`
            });
        }

        // check if we are a memmber
        const members = community.members;
        let isMember = false;
        members.map(member => {
            if (member.toString() === currentUserID) {
                isMember = true; return;
            }
        });
        if (isMember) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${currentUser} is already a member of ${communityName}`
            });
        }

        // send community request if private
        if (!community.open) {
            // send community request to join
            await Community.findByIdAndUpdate(community._id,
                { $push: { memberRequests: currentUserID }}
            );

            return res.status(200).json({
                success: true,
                msg: `Succesfully send join request to community ${communityName}`,
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

// TODO
// accept a user to a private community
const acceptUser = async (req, res) => {}

// leave communtiy
const leaveCommunity = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const communityName = req.body.communityName;

        // check community exists
        const community = await Community.findOne({name: communityName}, 'owners members').lean();
        if (!community) {
            return res.status(409).json({
                success: false,
                msg: `Error: ${communityName} does not exists`
            });
        }

        // check we own the community
        const owners = community.owners;
        let own = false;
        owners.map(owner => {
            if (owner.toString() === currentUserID) {
                own = true; return;
            }
        });
        if (own) {
            return res.status(409).json({
                success: false,
                msg: `Error: Cannot leave a community you own.`
            });
        }

        // check if we are a memmber
        const members = community.members;
        let isMember = false;
        members.map(member => {
            if (member.toString() === currentUserID) {
                isMember = true; return;
            }
        });
        if (!isMember) {
            return res.status(400).json({
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
            msg: `Succesfully delete community ${communityName}`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
}

// TODO
// get community's outings
const getOutings = async (req, res) => {}

exports.createCommunity = createCommunity;
exports.getCommunity = getCommunity;
exports.editCommunity = editCommunity;
exports.deleteCommunity = deleteCommunity;
exports.inviteUser = inviteUser;
exports.joinCommunity = joinCommunity;
exports.acceptUser = acceptUser;
exports.leaveCommunity = leaveCommunity;
exports.getOutings = getOutings;
