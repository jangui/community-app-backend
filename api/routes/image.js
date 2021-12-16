const router = require('express').Router();

const ImageModel = require('../models/ImageModel.model');

router.route('/:imageID').get( async (req, res) => {
    const currentUser = res.locals.username;
    const currentUSerID = res.locals.userID;
    const imageID = req.params.imageID;

    try {
        // get image filepath
        const image = await ImageModel.findById(imageID).lean();
        const owner = image.owner;
        const imageDirectory = process.env.IMAGE_DIR;
        const filepath = `${imageDirectory}/${owner}/${imageID}`;

        return res.status(200).sendFile(filepath);

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
});


module.exports = router;

