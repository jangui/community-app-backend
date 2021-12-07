const mongoose = require('mongoose');

const ImageModel = require('../models/ImageModel.model');

const uploadImage = (owner, req, res) => {
    return new Promise( async (resolve, reject) => {
        try {
            if (!(req.files.image)) {
                reject("Error: no files to upload");
                return;
            }

            // get unique image id
            const image = new ImageModel({owner: mongoose.Types.ObjectId(owner)});
            const imageDoc = await image.save();
            const imageID = imageDoc._id;


            // make sure img directory set
            const imageDirectory = process.env.IMAGE_DIR;
            if (!imageDirectory) {
                rej("Error: image directory env var not set");
                return;
            }

            // move uploaded image to appropriate location
            req.files.image.mv(`${imageDirectory}/${owner}/${imageID}`);

            // resolve proimse w/ image id on success
            resolve(imageID);

        } catch(err) {
            reject(err);
        }

    });
};

exports.uploadImage = uploadImage;
