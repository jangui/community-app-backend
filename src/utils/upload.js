const { StaticFile } = require('../db.js');

const uploadFile = (staticFile, owner, isPublic, communityFile, community, req, res) => {
    return new Promise( async (resolve, reject) => {
        try {
            // check if files received
            if (!(staticFile)) {
                reject("Error: no files to upload");
                return;
            }

            // get file type
            const fileType = staticFile.mimetype.split("/")[1];

            // check if valid file
            if (!validFile(fileType)) {
                reject(`invalid file type ${fileType}`);
            }

            // create file
            const file = new StaticFile({
                owner: owner,
                isPublic: isPublic,
                fileType: fileType,
            });

            // set community if applicable
            if (communityFile) {
                staticFile.communityFile = true;
                staticFile.community = community;
            }

            // save file details to db
            const staticFileDoc = await file.save();
            const fileID = staticFileDoc._id;

            // store uploaded file
            staticFile.mv(`/static/${fileID}.${fileType}`);

            // resolve proimse w/ image doc
            resolve({_id: fileID, fileType: fileType});

        } catch(err) {
            reject(err);
        }
    });
};

const validFile = (fileType) => {
    switch(fileType) {
        case "png":
        case "jpeg":
        case "jpg":
        case "gif":
        case "mp4":
        case "mpeg":
        case "mp2t":
            return true;
        default:
            return false;
    }
}

exports.uploadFile = uploadFile;
