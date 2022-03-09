const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    // explicity defining object id
    // object ids MUST be explicity generated when creating a new user
    _id: mongoose.Types.ObjectId,

    // username
    username: {
        type: String,
        required: true,
        trim: true,
        minLength: 4,
        maxLength: 20,
        unique: true,
        match: [/^(?=[a-zA-Z0-9._]{4,20}$)(?!.*[_.]{2})[^_.].*[^_.]$/, 'Invalid username']

    },

    // user's password
    // passwords should be hashed before stored
    password: {
        type: String,
        required: true,
    },

    // display name
    name: {
        type: String,
        required: true,
        trim: true,
        minLength: 1,
        maxLength: 30,
    },

    // user's email
    email: {
        type: String,
        trim: true,
        minLength: 5,
        unique: true,
        required: true,
        match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, "Please use a valid email."],
    },

    // email verification status
    verifiedEmail: {type: Boolean, default: false},

    // user's phone
    countryCode: {
            type: String,
            trim: true,
            required: [true, "Country Code is a required field."],
            match: [/^([1-9]{1}\-)?([0-9]{1,3})$/, "Please use a valid country code."],
    },
    phoneNumber: {
            type: String,
            trim: true,
            required: [true, "Phone Number is a required field."],
            match: [/^[0-9-(),]{6,14}$/, "Please use a valid phone number."],
    },

    // phone verification status
    verifiedPhone: {type: Boolean, default: false},

    // profile picture
    profilePicture: {type: mongoose.Schema.Types.ObjectId, ref: 'StaticFile'},

    // array of Users which are friends
    friends: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],

    // array of users which want to be friends
    friendRequests: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],

    // array of communities we belong to
    communities: [{type: mongoose.Schema.Types.ObjectId, ref: 'Community'}],

    // array of communities which have sent us a request to join
    communityRequests: [{type: mongoose.Schema.Types.ObjectId, ref: 'Community'}],

    // array of user's posts
    posts: [{type: mongoose.Schema.Types.ObjectId, ref: 'Post'}],
});

// add a compound unique index
// this makes is that all user's country code + phone number's aggregate must be unique
userSchema.index({countryCode: 1, phoneNumber: 1}, { unique: true });

module.exports = userSchema;

