const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const postSchema = new Schema({
    // user which made the post
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true},

    // array of likes for the post
    likes: [{type: mongoose.Schema.Types.ObjectId, ref: 'PostLike'}],

    // array of comments on the post
    comments: [{type: mongoose.Schema.Types.ObjectId, ref: 'PostComment'}],

    // post type: 0 == text post; 1 == picture / video post;
    postType: {type: Number, min: 0, max: 1, required: true},

    // text for text post OR caption for picture post
    postText: {type: String, trim: true, maxLength: 2000},

    // location of post
    postLocation: {type: String, trim: true},

    // the post's picture / video (if applicable)
    postFile: {type: mongoose.Schema.Types.ObjectId, ref: 'StaticFile'},

    // post timestamp
    timestamp: {type: Date, default: Date.now(), index: true, required: true },

});

module.exports = postSchema;
