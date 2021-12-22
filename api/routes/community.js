const router = require('express').Router();

const Community = require('../models/Community.model');
const { uploadImage } = require('../utils');

router.route('/:community').get( async (req, res) => {
    const currentUser = res.locals.username;
    const currentUserID = res.locals.userID;
    const communityName = res.params.community;

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

        return res.status(200).json({
            success: true,
            msg: `Successfully got ${communityName}`
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
    const communityName = res.body.name;
    const description = res.body.description;
    const open = res.body.open;
    const visible = res.body.visible;

    try {
        // create community
        let community = new Community({
            name: communityName,
            open: open,
            visibile: visible,

        });

        // add description if provided
        if (description) {
            community.description = description;
        }

        // add image if provided
        if (req.files.image) {
            const imageID = uploadImage(currentUser, req, res);
            community.image = imageID;
        }

        // upload image
        if (postType === '1') {
            const imageID = await uploadImage(userID, req, res);
            post.image = imageID;
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

router.route('/:communityID').delete( async (req, res) => {
    const currentUser = res.locals.username;
    const currentUserID = res.locals.userID;
    const communityID = res.params.communityID;

    try {
        // check we own the community
        const community = await Community.findById(communityID, 'owners').lean();
        const owners = community.owners;
        if (!owners.includes(currentUserID)) {
            return res.status(409).json({
                success: false,
                msg: `Error: ${currentUsername} does not own community ${communityID}`
            });
        }

        // TODO
        // delete all the communities outings
        // remove community from user's communities
        // delete picture

        // delete the community
        await Community.findByIdAndDelete(communityID);



    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
});

router.route('/edit/:communityID').post( async (req, res) => {});

module.exports = router;
