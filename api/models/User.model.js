const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    // username
    username: {
        type: String,
        required: true,
        trim: true,
        minLength: 1,
        maxLength: 30,
        unique: true,
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
    // instagram handle
    instagram: {
        type: String,
        required: false,
        trim: true,
        minLength: 1,
        maxLength: 30,
    },

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

    // user's email
    email: {
        type: String,
        trim: true,
        unique: true,
        match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, "Please use a valid email."],
    },

    // profile picture save location
    profilePicLocation: {
        type: String,
        required: false,
        default: "", //TODO default save loc for default user pic
    },

    // array of Users which are friends
    friends: [ this ],  // friends is a list of users aka 'this' model

    // array of users which want to be friends
    friendRequests: [ this ],

    // array of communities we belong to
    communities: [{type: mongoose.Schema.Types.ObjectId, ref: 'Community'}],

    // array of communities which have sent us a request to join
    communityRequests: [{type: mongoose.Schema.Types.ObjectId, ref: 'Community'}],

    // array of user's posts
    posts: [{type: mongoose.Schema.Types.ObjectId, ref: 'Post'}],
});

const User = mongoose.model('User', userSchema);

module.exports = User;
