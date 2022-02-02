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
        const communityName = req.body.community;
        const outingTitle = req.body.title;
        const startTime = req.body.start;
        const endTime = req.body.end;
        const loc = req.body.loc;
        const canRSVP = req.body.canRSVP;
        const visibleRSVP = req.body.visibleRSVP;

        // get community ID
        const community = await Community.findOne({name: communityName}, '_id').lean();
        const communityID = community._id;

        // check if we have access to create outing for this community
        const user = User.findById(currentUserID, 'communities').lean();
        if ((user.communities.includes(communityID))) {
            return res.status(409).json({
                sucess: false,
                msg: `Error ${currentUser} does not have access to community ${communityName}`
            });
        }

        // create outing
        let outing = new Outing({
            title: outingTitle,
            community: communityID,
        });

        // add optional parameters
        if (startTime) { outing.start = Date.parse(startTime); }
        if (endTime) { outing.end = Date.parse(endTime); }
        if (loc) { outing.loc = req.body.loc; }
        if (canRSVP) { outing.canRSVP = canRSVP; }
        if (visibleRSVP) { outing.visibleRSVP = visibleRSVP; }

        // save to database
        const outingDoc = await outing.save();

        return res.status(200).json({
            sucess: true,
            msg: `Successfully created outing ${outingTitle}!`,
            outing: {_id: outingDoc.id, title: outingDoc.title},
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
                "title": "$title",
                "start": "$start",
                "end": "$end",
                "loc": "$loc",
                "canRSVP": "$canRSVP",
                "visibleRSVP": "$visibleRSVP",
                "commentsCount": {$size: "$comments"},
                "interestedCount": {$size: "$interested"},
                "attendeesCount": {$size: "$attendees"},
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
const editOuting = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const outingTitle = req.body.title;
        const startTime = req.body.start;
        const endTime = req.body.end;
        const loc = req.body.loc;

        // make sure we have permission to edit outing
        const oldOuting = await Outing.findById(postID, 'owner title community loc start end').lean();
        if (oldOuting.owner.toString() !== currentUserID) {
            return res.status(409).json({
                success: false,
                msg: `Error: Unauthorized. ${currentUser} does not own outing '${oldOuting.title}'`,
            });
        }

        // get updates
        if (!title) { title = oldPost.title }
        if (!loc) { loc = oldPost.loc }
        if (!startTime) { startTime = oldPost.postText }
        if (!endTime) { endTime = oldPost.postText }

        // update posts
        const updatedOuting = await Outing.findByIdAndUpdate(outingID, {
            title: title,
            loc: loc,
            start: startTime,
            end: endTime
        }).select('owner _id title loc start end').lean();

        return res.status(200).json({
            success: true,
            msg: `Success! Outing ${outingID} updated.`,
            post: updatedOuting,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
}

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


// comment on outing
const makeOutingComment = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const outingID = req.body.outingID;
        const comment = req.body.comment;

        // check outing exists
        const outing = Outing.findById(outingID, 'community').lean();
        if (!outing) {
            return res.status(400).json({
                success: false,
                msg: `Error: outing ${outingID} does not exist`
            });
        }

        // check current user is part of community outing belongs to
        const community = outing.community;
        const user = User.findById(currentUserID, 'communties').lean();
        if (!user.communities.includes(community)) {
            return res.status(400).json({
                success: false,
                msg: `Error: ${currentUser} does not have access to outing ${outingID}`
            });
        }

        // make comment
        const outingComment = new OutingComment({
            owner: currentUserID,
            username: currentUser,
            outing: outingID,
            comment: comment
        });
        const outingCommentDoc = await postComment.save();

        // add comment to post
        await Outing.findByIdAndUpdate(outingID,
            { $push: { comments: outingCommentDoc._id }}
        );

        return res.status(200).json({
            success: true,
            msg: `Success! ${currentUser} commented on outing ${outingID}`,
            comment: {_id: outingCommentDoc._id},
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
}

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


// edit outing comment
const editOutingComment = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const commentID = req.body.commentID;
        const updatedComment = req.body.updatedComment;

        // check theres an updated comment
        if (!updatedComment) {
            return res.status(400).json({
                success: false,
                msg: `Error: please provided updated comment`,
            });
        }

        // check comment exists
        let comment = await OutingComment.findById(commentID);
        if (!comment) {
            return res.status(400).json({
                success: false,
                msg: `Error: comment ${commentID} does not exists`,
            });
        }
        // check current user own's comment they want to update
        if (comment.owner.toString() !== currentUserID) {
            return res.status(409).json({
                success: false,
                msg: `Error: user ${currentUser} cannot edit someone else's comment`,
            });
        }

        // update comment
        comment.comment = updatedComment;
        await comment.save();

        return res.status(200).json({
            success: true,
            msg: `Comment succesfully updated!`,
            comment: comment,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
}

// delete an outing commente
const deleteOutingComment = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const commentID = req.body.commentID;

        // make sure we are deleting our own comment
        const comment = await OutingComment.findById(commentID, 'owner').lean();
        if (comment.owner.toString() !== currentUserID) {
            return res.status(409).json({
                success: false,
                msg: `Error: Unauthorized. ${currentUser} does not own comment ${commentID}`,
            });
        }

        // delete comment
        await OutingComment.findByIdAndDelete(commentID);

        return res.status(200).json({
            success: true,
            msg: `Success! Comment ${commentID} deleted.`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
}

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

// mark as attending outing
const attendOuting = async (req, res) => {
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

        // attend outing
        attendee = new OutingAttendee({
            attendee: currentUserID,
            username: currentUser,
            outing: postID,
        });
        const attendeeDoc = await attendee.save();

        // add attendance to outing
        await Outing.findByIdAndUpdate(outingID,
            { $push: { attendees: attendeeDoc._id }}
        );

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }

}

// mark unattending outing
const unattendOuting = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const outingID = req.params.outingID;

        // check outing exists
        const outing = await Outing.findById(outingID, 'community attendees').lean();
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

        // check if are attending outing
        var attendee = await OutingAttendee.findOne({outing: outingID, owner: currentUserID}, '_id').lean();
        if (!attendee) {
            return res.status(400).json({
                success: false,
                msg: `Error! ${currentUser} is not attending outing ${outingID}`,
            });
        }

        // delete attendance
        await OutingAttendee.findOneAndDelete({owner: currentUserID, outing: outingID});

        // remove attendance from outing
        await Outing.findByIdAndUpdate(outingID,
            { $pull: { attendees: attendee._id }}
        );

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
}

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
