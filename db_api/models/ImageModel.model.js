const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const pictureSchema = new Schema({
    // owner of picture (if applicable)
    owner: {type: mongoose.Types.ObjectId, ref: 'User'},

    // boolean whether picture is public or not
    isPublic: {type: Boolean, default: false},

    // boolean whether this picture belongs to a community
    communityImage: {type: Boolean, default: false},

    // community image belongs to (if applicable)
    community: {type: mongoose.Types.ObjectId, ref: 'Community'},
});

const Picture = mongoose.model('Picture', pictureSchema);

module.exports = Picture;
