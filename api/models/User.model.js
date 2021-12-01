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
        required: true, },

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
    confirmedEmail: {type: Boolean, default: false},

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
    confirmedPhone: {type: Boolean, default: false},


    // instagram handle
    instagram: {
        type: String,
        trim: true,
        minLength: 1,
        maxLength: 30,
    },

    // profile picture save location
    profilePicLocation: {
        type: String,
        default: "",
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

    // array of notifications
    notifications: [{type: mongoose.Schema.Types.ObjectId, ref: 'Notification'}],
});

// add a compound unique index
// this makes is that all user's country code + phone number's aggregate must be unique
userSchema.index({countryCode: 1, phoneNumber: 1}, { unique: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
