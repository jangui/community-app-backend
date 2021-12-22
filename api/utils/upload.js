const mongoose = require('mongoose');

const ImageModel = require('../models/ImageModel.model');

const uploadImage = (owner, isPublic, communityImage, community, req, res) => {
    return new Promise( async (resolve, reject) => {
        try {
            // check if files received
            if (!(req.files.image)) {
                reject("Error: no files to upload");
                return;
            }

            // create image
            const image = new ImageModel({
                userImage: userImage,
                isPublic: isPublic,
                image.owner = mongoose.Types.ObjectId(owner);
            });

            // set community if applicable
            if (communityImage) {
                image.communityImage = true;
                image.community = mongoose.Types.ObjectId(community);
            }

            // save image details to db
            const imageDoc = await image.save();
            const imageID = imageDoc._id;

            // make sure img directory set
            const imageDirectory = process.env.IMAGE_DIR;
            if (!imageDirectory) {
                rej("Error: image directory env var not set");
                return;
            }

            // store uploaded image
            req.files.image.mv(`${imageDirectory}/${owner}/${imageID}`);

            // resolve proimse w/ image id on success
            resolve(imageID);

        } catch(err) {
            reject(err);
        }
    });
};

exports.uploadImage = uploadImage;
