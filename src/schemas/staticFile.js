const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const staticFileSchema = new Schema({
    // owner of static file
    owner: {type: mongoose.Types.ObjectId, ref: 'User', required: true},

    // boolean whether static file is public or not
    isPublic: {type: Boolean, default: false, required: true},

    // file type
    fileType: {type: String, trim: true, required: true},

    // boolean whether this static file belongs to a community
    communityFile: {type: Boolean, default: false},

    // community static file belongs to (if applicable)
    community: {type: mongoose.Types.ObjectId, ref: 'Community'},
});

module.exports = staticFileSchema;
