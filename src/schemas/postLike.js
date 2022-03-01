const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postLikeSchema = new Schema({
    // user that likes the post
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true},

    // post which is liked
    post: {type: mongoose.Schema.Types.ObjectId, ref: 'Post', index: true, required: true},

});

module.exports = postLikeSchema;
