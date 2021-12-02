const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const notificationSchema = new Schema ({
    // user whom is being notified
    notifee: {type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true},

    // user whom caused notification
    notifier: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},

    // notification message
    message: {type: String, trim: true, minLength: 1, maxLength: 300 },

    // type of notification
    // 0 == liked post; 1 == comment on post; 2 == recievd friend req
    // 3 == accepted friend request 4 == community join req;
    // 5 == user joined your community;
    // 6 == sugested outing in a community you belong to
    // 7 == user is attending your outing; 8 == user interest in your outing
    // 9 == user voted on your outing;
    notificationType: {type: Number, min: 0, max: 9},

    // picture preview for notification (if applicable)
    image: {type: mongoose.Schema.Types.ObjectId, ref: 'Image'},

    // community which notification applies to (if applicable)
    community: {type: mongoose.Schema.Types.ObjectId, ref: 'Community'},

    // outing which notification applies to (if applicable)
    outing: {type: mongoose.Schema.Types.ObjectId, ref: 'Outing'},

    // notification timestamp
    timestamp: {type: Date, default: Date.now(), index: true},

});

const Notification = mongoose.model('Notification', notificationSchema);

const module.exports = Notification;
