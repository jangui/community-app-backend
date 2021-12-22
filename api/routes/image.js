const router = require('express').Router();

const User = require('../models/User.model');
const ImageModel = require('../models/ImageModel.model');
const { areFriends } = require('../utils');

router.route('/:imageID').get( async (req, res) => {
    const currentUser = res.locals.username;
    const currentUserID = res.locals.userID;
    const imageID = req.params.imageID;

    try {
        // get image filepath
        const image = await ImageModel.findById(imageID).lean();
        const owner = image.owner;
        const imageDirectory = process.env.IMAGE_DIR;
        const filepath = `${imageDirectory}/${owner}/${imageID}`;

        // return image if public
        if (image.isPublic) {
            return res.status(200).sendFile(filepath);
        }

        // check if community image
        if (image.communityImage) {
            // check if user is in image's community
            user = await User.findById(currentUserID, 'communities').lean();
            if (user.communities.includes(image.community)) {
                return res.status(200).sendFile(filepath);
            } else {
                return res.status(409).json({
                    success: false,
                    msg: `Error: ${currentUser} does not have access to community ${image.community}`
                });
            }
        }

        // send image if we are friends w/ owner
        if (areFriends(currentUserID, image.owner)) {
            return res.status(200).sendFile(filepath);
        }

        return res.status(409).json({
            success: false,
            msg: `Error: ${currentUser} does not have access to image ${image._id}`
        });
    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
});


module.exports = router;

