const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: [{
        firstName: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
        },
        lastName: {
            type: String,
            required: false,
            trim: true,
            minlength: 1,
        }
    }],
    instagram: {
        type: String,
        required: false,
        trim: true,
        minlength: 1
    },
    contact: [{
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
        }
    }],
    email: {
        type: String,
        trim: true,
        unique: true,
        match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, "Please use a valid email."]
    },
    county: String,
    city: String,

});

userSchema.index({ "contact.countryCode": 1, "contact.phoneNumber": 1 }, { unique: true });

const user = mongoose.model('User', userSchema);

module.exports = User;
