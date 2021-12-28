const router = require('express').Router();
const mongoose = require('mongoose');

const Community = require('../models/Community.model');
const User = require('../models/User.model');
const { uploadImage } = require('../utils');

router.route('/:community').get( async (req, res) => {
    const currentUser = res.locals.username;
    const currentUserID = res.locals.userID;
    const communityName = req.params.community;

    try {
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
});

router.route('/new/').post( async (req, res) => {
    const currentUser = res.locals.username;
    const currentUserID = res.locals.userID;
    const communityName = req.body.name;
    const description = req.body.description;
    const open = req.body.open;
    const visible = req.body.visible;

    try {
        // check if community already exists
        const found = await Community.findOne({name: communityName});
        if (found) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${communityName} already exists.`
            });
        }

        // create community
        let community = new Community({
            name: communityName,
            open: open,
            visibile: visible,
            owners: [currentUserID],
            members: [currentUserID],
        });

        // add description if provided
        if (description) {
            community.description = description;
        }

        // add image if provided
        if (req.files && req.files.image) {
            const imageID = await uploadImage(currentUser, req, res);
            community.image = imageID;
        }

        // save to database
        const communityDoc = await community.save();


        return res.status(200).json({
            success: true,
            msg: `Successfully created community ${communityName}`,
            community: { _id: communityDoc._id, name: communityDoc.name},
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
});

router.route('/:communityName').delete( async (req, res) => {
    const currentUser = res.locals.username;
    const currentUserID = res.locals.userID;
    const communityName = req.params.communityName;

    try {
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
});

router.route('/leave/').post( async (req, res) => {
    const currentUser = res.locals.username;
    const currentUserID = res.locals.userID;
    const communityName = req.body.communityName;

    try {
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
});

router.route('/join/').post( async (req, res) => {
    const currentUser = res.locals.username;
    const currentUserID = res.locals.userID;
    const communityName = req.body.communityName;

    try {
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
});

router.route('/sendRequest').post( async (req, res) => {
    const currentUser = res.locals.username;
    const currentUserID = res.locals.userID;
    const communityName = req.body.communityName;
    const requestedUsername = req.body.requestedUsername;

    try {
        // check user exists
        const requestedUserDoc = await User.findOne({username: requestedUsername}, 'communityRequests').lean();
        if (!requestedUserDoc) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${requestedUsername} does not exist.`
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
            if (member.toString() === requestedUserDoc._id) {
                isMember = true; return;
            }
        });
        if (isMember) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${requestedUsername} is already a member of ${cummunityName}`,
            });
        }

        // check request has not already been sent to user
        const requests = requestedUserDoc.communityRequests;
        let sentRequest = false;
        requests.map( req => {
            if (req.toString() === community._id.toString()) {
                sentRequest = true; return;
            }
        });
        if (sentRequest) {
            return res.status(400).json({
                success: false,
                msg: `Error: requests already sent to ${requestedUsername}`,
            });
        }

        // send user a request
        await User.findOneAndUpdate({username: requestedUsername},
            { $push: { communityRequests: community._id }}
        );

        return res.status(200).json({
            success: true,
            msg: `Succesfully sent ${requestedUsername} a request to join ${communityName}`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
});

router.route('/edit/:communityID').post( async (req, res) => {});

module.exports = router;
