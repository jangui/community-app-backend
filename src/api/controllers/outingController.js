const { User, Community, Outing, OutingComment, OutingAttendee } = require('../db.js');
const { uploadFile } = require('../utils/upload.js');
const { includesID } = require('../utils/includesID.js');

// create an outing
const createOuting = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const communityName = req.body.community;
        const outingTitle = req.body.title;
        const startTime = req.body.startTime;
        const endTime = req.body.endTime;
        const outingLocation = req.body.location;
        const canRSVP = req.body.canRSVP;
        const visibleRSVP = req.body.visibleRSVP;

        // get community ID
        const community = await Community.findOne({name: communityName}, '_id members').lean();
        const communityID = community._id;

        // check if we have permissions for posting outing
        if (!includesID(currentUserID, community.members)) {
            return res.status(409).json({
                sucess: false,
                msg: `Error ${currentUser} permission to post outings in community  '${communityName}'`
            });
        }

        // create outing
        let outing = new Outing({
            title: outingTitle,
            community: communityID,
            owner: currentUserID,
        });

        // add optional parameters
        if (startTime) { outing.start = Date.parse(startTime); }
        if (endTime) { outing.end = Date.parse(endTime); }
        if (outingLocation) { outing.location = outingLocation; }
        if (canRSVP) { outing.canRSVP = canRSVP; }
        if (visibleRSVP) { outing.visibleRSVP = visibleRSVP; }

        // save to database
        const outingDoc = await outing.save();

        // add outing to community's outings
        await Community.findByIdAndUpdate(communityID,
            { $push: { outings: outingDoc._id }}
        );

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
        const outing = await Outing.findById(
            outingID,
            'start end location canRSVP visibleRSVP attendees interested comments polls timestamp title community'
        ).populate(
            'community', 'name members'
        ).populate({
            path: 'owner',
            select: 'username profilePicture',
            populate: {
                path: 'profilePicture',
                select: 'fileType',
            }
        }).lean();

        // check if outing exists
        if (!outing) {
            return res.status(400).json({
                sucess: false,
                msg: `Error: outing w/ ID: ${outingID} does not exist`
            });
        }

        // check if user has access to outing
        if (!includesID(currentUserID, outing.community.members)) {
            return res.status(409).json({
                sucess: false,
                msg: `Error ${currentUsername} does not have access to outings from community '${outing.community.name}'`
            });
        }

        // modify return data
        delete outing.community.members;
        outing.attendees = outing.attendees.length;
        outing.interested = outing.interested.length;
        outing.comments = outing.comments.length;
        if (outing.location === "") { outing.location = null; }
        let epoch = new Date(0);
        if (outing.start.getTime() == epoch.getTime()) { outing.start = null; }
        if (outing.end.getTime() == epoch.getTime()) { outing.end = null; }
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
        const outingID = req.body.outingID;
        const outingTitle = req.body.title;
        const startTime = req.body.start;
        const endTime = req.body.end;
        const outingLocation = req.body.location;

        // check outing exists
        const outing = await Outing.findById(outingID, 'owner title location start end');
        if (!outing) {
            return res.status(400).json({
                success: false,
                msg: `Error: outing w/ id '${outingID}' does not exist`,
            });
        }

        // check owner is making edit to outing
        if (outing.owner.toString() !== currentUserID) {
            return res.status(403).json({
                success: false,
                msg: `Error: Unauthorized. ${currentUser} does not own outing ${outingID}`,
            });
        }

        // get updates
        if (outingTitle) { outing.title = outingTitle }
        if (outingLocation) { outing.locationg = outingLocation }
        if (startTime) { outing.start = startTime }
        if (endTime) { outing.end = endTime }

        // save updates
        await outing.save();

        return res.status(200).json({
            success: true,
            msg: `Success! outing ${outingID} updated.`,
            outing: outing,
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
                msg: `Error: outing withID: ${outingID} does not exists`
            });
        }

        // check if user owns outing
        if (outing.owner != currentUserID) {
            return res.status(409).json({
                success: false,
                msg: `Error: ${currentUser} does not own outing with ID '${outingID}'`
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
        const outing = await Outing.findById(outingID, 'owner community').lean().populate('community', 'members');
        if (!outing) {
            return res.status(400).json({
                success: false,
            msg: `Error: outing with id '${outingID}' does not exist.`,
            })
        }

        // check if user has permission to make comment
        if (!includesID(currentUserID, outing.community.members)) {
            return res.status(403).json({
                success: false,
                msg: `Error: Unauthorized. ${currentUser} cannot comment on outing w/ id '${outingID}'`,
            });
        }

        // make comment
        const outingComment = new OutingComment({
            owner: currentUserID,
            outing: outingID,
            comment: comment
        });
        const outingCommentDoc = await outingComment.save();
        const outingCommentID = outingCommentDoc._id;

        // add comment to post
        await Outing.findByIdAndUpdate(outingID,
            { $push: { comments: outingCommentID }}
        );

        return res.status(200).json({
            success: true,
            msg: `Success! ${currentUser} commented on outing ${outingID}`,
            comment: outingCommentDoc,
        });

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
        const outingID = req.body.outingID;
        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);

        // check post exists
        const outing = await Outing.findById(outingID, 'community comments').lean().populate('community', 'members');
        if (!outing) {
            return res.status(400).json({
                success: false,
                msg: `Error: outing with id '${outingID}' does not exist.`,
            });
        }

        // check user has permissions to get outing's comments
        if (!includesID(currentUserID, outing.community.members)) {
            return res.status(403).json({
                success: false,
                msg: `Error ${currentUser} cannot get comments for outing w/ id '${outingID}'`
            });
        }

        // get comments
        const comments = await OutingComment.find(
            { outing: outing._id }
        ).select(
            'comment owner'
        ).sort(
            { timestamp: 1 }
        ).skip(skip).limit(limit).lean().populate({
            path: 'owner',
            select: 'username -_id',
            populate: {
                path: 'profilePicture',
                select: 'fileType',
            }
        });

        return res.status(200).json({
            success: true,
            msg: `successfully got post comments ${skip}-${limit+skip-1} for outing ${outingID}`,
            comments: comments,
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

        // check current user is editting their own comment
        if (comment.owner.toString() !== currentUserID) {
            return res.status(403).json({
                success: false,
                msg: `Error: ${currentUser} cannot edit someone else's comment`,
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

        // make sure user is deleting their own comment
        const comment = await OutingComment.findById(commentID, 'owner').lean();
        if (comment.owner.toString() !== currentUserID) {
            return res.status(403).json({
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
        const outingID = req.body.outingID;
        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);

        // check outing exists
        const outing = await Outing.findById(outingID, 'community comments').lean().populate('community', 'members');
        if (!outing) {
            return res.status(400).json({
                success: false,
                msg: `Error: outing with id '${outingID}' does not exist.`,
            });
        }

        // check if we have permissions to get attendees
        if (!includesID(currentUserID, outing.community.members)) {
            return res.status(403).json({
                success: false,
                msg: `Error ${currentUser} cannot get attendees for outing w/ id '${outingID}'`
            });
        }

        // get attendees
        const attendees = await OutingAttendee.find(
            { outing: outing._id }
        ).select(
            'attendee -_id'
        ).sort(
            { timestamp: 1 }
        ).skip(skip).limit(limit).lean().populate({
            path: 'attendee',
            select: 'username friends -_id',
            populate: {
                path: 'profilePicture',
                select: 'fileType',
            },
        });

        // check friendship status with each attendee
        attendees.map(async (currentAttendee, ind) => {
            // set like username and profile picture
            currentAttendee.username = currentAttendee.attendee.username;
            currentAttendee.profilePicture = currentAttendee.attendee.profilePicture;

            // check if user is friends with the friends of the attendee
            if (includesID(currentUserID, currentAttendee.attendee.friends)) {
                currentAttendee.areFriends = true;
                delete currentLike.attendee; // dont return current attendee's extra info
                return;
            }

            currentAttendee.areFriends = false;
            delete currentAttendee.attendee; // dont return current attendee's extra info
        });

        // return attendees
        return res.status(200).json({
            success: true,
            msg: `successfully got outing attendees ${skip}-${limit+skip-1} for outing ${outingID}`,
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
        const outingID = req.body.outingID;

        // check outing exists
        const outing = await Outing
                .findById(outingID, 'community attendees')
                .lean()
                .populate('attendees', 'attendee')
                .populate('community', 'members');
        if (!outing) {
            return res.status(400).json({
                success: false,
                msg: `Error: outing with id '${outingID}' does not exist.`,
            });
        }

        // check if we have permissions to attende outing
        if (!includesID(currentUserID, outing.community.members)) {
            return res.status(403).json({
                success: false,
                msg: `Error: Unauthorized. ${currentUser} cannot attend outing w/ id '${outingID}'`,
            });
        }

        // check if outing already attended
        for (let i = 0; i < outing.attendees.length; ++i) {
            if (outing.attendees[i].attendee == currentUserID) {
                return res.status(400).json({
                    success: false,
                    msg: `Error! ${currentUser} already mark attending outing w/ id '${outingID}'`,
                });
            }
        }

        // create attendee
        attendee = new OutingAttendee({
            attendee: currentUserID,
            outing: outingID,
        });
        const attendeeDoc = await attendee.save();

        // add attendee to outing
        await Outing.findByIdAndUpdate(outingID,
            { $push: { attendees: attendeeDoc._id }}
        );

        return res.status(200).json({
            success: true,
            msg: `Success! ${currentUser} marked attendeding outing with id '${outingID}`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
}

// mark unattending outing
const unattendOuting = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const outingID = req.body.outingID;

        // check outing exists
        const outing = await Outing
                .findById(outingID, 'community attendees')
                .lean()
                .populate('attendees', 'attendee')
                .populate('community', 'members');
        if (!outing) {
            return res.status(400).json({
                success: false,
                msg: `Error: outing with id '${outingID}' does not exist.`,
            });
        }

        // check if we have permissions to outing
        if (!includesID(currentUserID, outing.community.members)) {
            return res.status(403).json({
                success: false,
                msg: `Error: Unauthorized. ${currentUser} cannot attend outing w/ id '${outingID}'`,
            });
        }

        // delete attendee
        attendee = await OutingAttendee.findOneAndDelete({attendee: currentUserID, outing: outingID});
        if (!attendee) {
            return res.status(400).json({
                success: false,
                msg: `Error! ${currentUser} cannot unattend an outing they don't attend (outing id: ${outingID})`,
            });
        }

        // remove attendee from outing
        await Outing.findByIdAndUpdate(outingID,
            { $pull: { attendees: attendee._id }}
        );

        return res.status(200).json({
            success: true,
            msg: `Success! ${currentUser} marked unattendeding outing with id '${outingID}`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
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
