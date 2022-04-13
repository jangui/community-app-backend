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

    // is the post a community post
    communityPost:  { type: Boolean, default: false },

    // (if a community post) which community does the post belong to
    community: {type: mongoose.Schema.Types.ObjectId, ref: 'Community', index: true},

    // post timestamp
    timestamp: {type: Date, default: Date.now(), index: true, required: true },

});

module.exports = postSchema;
