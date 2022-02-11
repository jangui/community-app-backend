const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const communitySchema = new Schema({
    // community name
    name: {
        type: String,
        required: true,
        trim: true,
        minLength: 1,
        unique: true,
    },

    // community description
    description: {
        type: String,
        default: "",
        trim: true,
    },

    // community picture
    image: {type: mongoose.Schema.Types.ObjectId, ref: 'ImageModel'},

    // community privacy
    // open == true (public); open == false (private)
    open: {type: Boolean, default: false},

    // community visibility
    visible: {type: Boolean, default: true},

    // array of community outings
    outings: [{type: mongoose.Schema.Types.ObjectId, ref: 'Outing'}],

    // array of community owners (users)
    owners: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],

    // array of community members (users)
    members: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],

    // array of users wanting to join community (only if private)
    memberRequests: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],

});

const Community = mongoose.model('Community', communitySchema);

module.exports = Community;
