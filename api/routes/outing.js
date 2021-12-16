const router = require('express').Router;

const Outing = require('../models/Outing.model');
const OutingComment = require('../models/OutingComment.model');
const OutingAttendee = require('../models/OutingAttendee.model');
const OutingInterestee = require('../models/OutingInterestee.model');
const User = require('../models/User.model');
const Community = require('../models/Community.model');

router.route('/:outingID').post( async (req, res) => {
    const currentUsername = res.locals.username;
    const currentUserID = res.locals.userID;
    const outingID = req.params.outingID;

    try {
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

        // check if we have access to outing
        const user = User.findById(currentUserID, 'communities').lean();
        if (currentUsername != outing.owner && (!user.communities.includes(outing.community))) {
            return res.status(409).json({
                sucess: false,
                msg: `Error ${currentUser} does not have access to ${outingID}`
            });
        }

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
});


router.route('/new').post( async (req, res) => {
    const currentUsername = res.locals.username;
    const currentUserID = res.locals.userID;
    const outingName = req.body.name;
    const communityName = req.body.community;

    try {
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

});

router.route('/:outingID').delete( async (req, res) => {
    const currentUsername = res.locals.username;
    const currentUserID = res.locals.userID;
    const outingID = req.params.outingID;

    try {
        // check if user created outing
        const outing = await Outing.findById(outingID, 'owner').lean()
        if (outing.owner != currentUserID) {
            return res.status(409).json({
                success: false,
                msg: `Error: ${currentUsername} does not own outing ${outingID}`
            });
        }

        // TODO
        // Delete Outing Comments
        // Delete Outing from community outings

        // delete outing
        await Outing.findByIdAndDelete(outingId);

        return res.status(200).json({
            sucess: true,
            msg: `Successfully deleted outing ${name}!`,
            outing: {_id: outingDoc.id, name: outingDoc.name}
        });
    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
});

router.route('/:comments/:outingID').post( async (req, res) => {
    const currentUsername = res.locals.username;
    const currentUserID = res.locals.userID;
    const outingID = req.params.outingID;

    try {
        // check if we have access to community outing belongs to
        const outing = await Outing.findById(outingID, 'community').lean();
        const user = await User.findById(userID, 'communities');
        if (!user.communities.include(outing.community)) {
            return res.status(409).json({
                success: false,
                msg: `Error: ${currentUsername} does not have access to community ${outing.community}`
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

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
});

router.route('/:attendies/:outingID').post( async (req, res) => {
    const currentUsername = res.locals.username;
    const currentUserID = res.locals.userID;
    const outingID = req.params.outingID;

    try {
        // check if we have access to community outing belongs to
        const outing = await Outing.findById(outingID, 'community').lean();
        const user = await User.findById(userID, 'communities');
        if (!user.communities.include(outing.community)) {
            return res.status(409).json({
                success: false,
                msg: `Error: ${currentUsername} does not have access to community ${outing.community}`
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
});

router.route('/interested/:outingID').post( async (req, res) => {
    const currentUsername = res.locals.username;
    const currentUserID = res.locals.userID;
    const outingID = req.params.outingID;

    try {
        // check if we have access to community outing belongs to
        const outing = await Outing.findById(outingID, 'community').lean();
        const user = await User.findById(userID, 'communities');
        if (!user.communities.include(outing.community)) {
            return res.status(409).json({
                success: false,
                msg: `Error: ${currentUsername} does not have access to community ${outing.community}`
           });
        }

        // get interested users
        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);
        const interested = await OutingInterestee.aggregate([
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
            msg: `successfully got interested users ${skip}-${limit+skip} for outing ${outingID}`,
            interested: interested,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
});

/*
router.route('/interest/:outingID').post( async (req, res) => {});
router.route('/disinterest/:outingID').post( async (req, res) => {});
router.route('/attend/:outingID').post( async (req, res) => {});
router.route('/unattend/:outingID').post( async (req, res) => {});
*/

model.exports = router
