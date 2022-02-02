const Outing = require('../models/Outing.model.js');
const OutingComment = require('../models/OutingComment.model');
const OutingAttendee = require('../models/OutingAttendee.model');
const User = require('../models/User.model');
const Community = require('../models/Community.model');

// create an outing
const createOuting = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const outingName = req.body.name;
        const communityName = req.body.community;

        // get community ID
        const community = await Community.findOne({name: communityName}, '_id').lean();
        const communityID = community._id;

        // check if we have access to create outing for this community
        const user = User.findById(currentUserID, 'communities').lean();
        if ((user.communities.includes(communityID))) {
            return res.status(409).json({
                sucess: false,
                msg: `Error ${currentUser} does not have access to community ${community}`
            });
        }

        // create outing
        let outing = new Outing({
            outingName: req.body.name,
            community: req.body.communityID,
            canRSVP: req.body.canRSVP,
        });

        // add optional parameters
        if (req.body.place) { outing.place = req.body.place; }
        if (req.body.visibleRSVP) { outing.visibleRSVP = req.body.visibleRSVP; }
        if (req.body.start) { outing.start = Date.parse(req.body.start); }
        if (req.body.end) { outing.end = Date.parse(req.body.end); }

        // save to database
        const outingDoc = await outing.save();

        return res.status(200).json({
            sucess: true,
            msg: `Successfully created outing ${name}!`,
            outing: {_id: outingDoc.id, name: outingDoc.name}
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }

}

// get outing info
const getOuting = async (req, res) => {
    try {
        const currentUsername = res.locals.username;
        const currentUserID = res.locals.userID;
        const outingID = req.params.outingID;

        // get outing
        const outing = (await Outing.aggregate([
            { $match: {
                "_id": outingID,
            }},
            { $project: {
                "_id": "$_id",
                "owner": "$owner",
                "community": "$community",
                "start": "$start",
                "end": "$end",
                "RSVP": "$RSVP",
                "visibleRSVP": "$visibleRSVP",
                "commentsCount": {$size: "$comments"},
                "interestedCount": {$size: "$interested"},
                "attendiesCount": {$size: "$attendies"},
                "timestamp": "$timestamp",
            }},
        ]))[0];

        // check if outing exists
        if (!outing) {
            return res.status(400).json({
                sucess: false,
                msg: `Error: outing w/ ID: ${outingID} does not exists`
            });
        }

        // check if we have access to outing
        const user = User.findById(currentUserID, 'communities').lean();
        if (currentUsername != outing.owner && (!user.communities.includes(outing.community))) {
            return res.status(409).json({
                sucess: false,
                msg: `Error ${currentUser} does not have access to ${outingID}`
            });
        }

        // TODO
        // get poll options
        // get vote count for each option

        return res.status(200).json({
            sucess: true,
            msg: `Successfully got outing ${outingID}!`,
            outing: outing
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
}

// edit an outing
const editOuting = async (req, res) => {}

// delete an outing
const deleteOuting = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const outingID = req.params.outingID;

        // check if outing exists
        const outing = await Outing.findById(outingID, 'name owner').lean()
        if (!outing) {
            return res.status(400).json({
                sucess: false,
                msg: `Error: outing w/ ID: ${outingID} does not exists`
            });
        }

        // check if user owns outing
        if (outing.owner != currentUserID) {
            return res.status(409).json({
                success: false,
                msg: `Error: ${currentUser} does not own outing ${outingID}`
            });
        }

        // TODO
        // Delete Outing Comments
        // Delete Outing from community outings
        // delete outing poll & votes

        // delete outing
        await Outing.findByIdAndDelete(outingID);

        return res.status(200).json({
            sucess: true,
            msg: `Successfully deleted outing ${outing.name}!`,
            outing: {_id: outing._id, name: outing.name}
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
}


// TODO
// comment on outing
const makeOutingComment = async (req, res) => {}

// get outing comments
const getOutingComments = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const outingID = req.params.outingID;

        // check outing exists
        const outing = await Outing.findById(outingID, 'community').lean();
        if (!outing) {
            return res.status(400).json({
                sucess: false,
                msg: `Error: outing w/ ID: ${outingID} does not exists`
            });
        }

        // check if we have access to community outing belongs to
        const user = await User.findById(userID, 'communities');
        if (!user.communities.include(outing.community)) {
            return res.status(409).json({
                success: false,
                msg: `Error: ${currentUser} does not have access to community ${outing.community}`
           });
        }

        // get comments
        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);

        // get comments
        const comments = await OutingComment.aggregate([
            { $match: {
                post: mongoose.Types.ObjectId(outingID),
            }},
            { $skip: skip},
            { $limit: limit},
            { $sort: { timestamp: 1 }},
            { $project: {
                "_id": "$_id",
                "userID": "$owner",
                "username": "$username",
                "comment": "$comment",
                "timestamp": "$timestamp",
            }},
        ]);

        // return comments & success
        return res.status(200).json({
            success: true,
            msg: `Successfully got comments`,
            comments: comments
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
}


// TODO
// edit outing comment
const editOutingComment = async (req, res) => {}

// TODO
// delete an outing commente
const deleteOutingComment = async (req, res) => {}

// get attendies for outing
const getAttendees = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const outingID = req.params.outingID;

        // check outing exists
        const outing = await Outing.findById(outingID, 'community').lean();
        if (!outing) {
            return res.status(400).json({
                sucess: false,
                msg: `Error: outing w/ ID: ${outingID} does not exists`
            });
        }

        // check if we have access to community outing belongs to
        const user = await User.findById(currentUserID, 'communities');
        if (!user.communities.include(outing.community)) {
            return res.status(409).json({
                success: false,
                msg: `Error: ${currentUser} does not have access to community ${outing.community}`
           });
        }

        // get attendies
        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);
        const attendees = await OutingAttendee.aggregate([
            { $match: {
                outing: mongoose.Types.ObjectId(outingID),
            }},
            { $skip: skip},
            { $limit: limit},
            { $sort: { timestamp: 1 }},
            { $project: {
                "_id": "$_id",
                "username": "$username",
                "userID": "$owner",
            }},
        ]);

        return res.status(200).json({
            success: true,
            msg: `successfully got outing attendees ${skip}-${limit+skip} for outing ${outingID}`,
            attendees: attendees,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
}

// TODO
// mark as attending outing
const attendOuting = async (req, res) => {}

// TODO
// makr as unattending outing
const unattendOuting = async (req, res) => {}

exports.createOuting = createOuting;
exports.getOuting = getOuting;
exports.editOuting = editOuting;
exports.deleteOuting = deleteOuting;
exports.makeOutingComment = makeOutingComment;
exports.getOutingComments = getOutingComments;
exports.editOutingComment = editOutingComment;
exports.deleteOutingComment = deleteOutingComment;
exports.getAttendees = getAttendees;
exports.attendOuting = attendOuting;
exports.unattendOuting = unattendOuting;
