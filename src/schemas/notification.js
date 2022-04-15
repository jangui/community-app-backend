const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    // user getting notified
    notifier: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},

    // user causing notification
    notifee: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true},

    // has the notification be read
    unread: { type: Boolean, default: true },

    // notification message
    message: { type: String, required: true },

    // notification preview image
    image: {type: mongoose.Schema.Types.ObjectId, ref: 'StaticFile'},

    // what the notification refers to
    // 0 == user
    // 1 == community
    // 2 == post
    // 3 == outing
    referenceType: { type: Number, min: 0 },

    // ID of what the notifcation refers to
    referenceID: {type: mongoose.Schema.Types.ObjectId},

    // whether you can take action on this notification ( accept / reject invite or request of some sort)
    action: {type: Boolean, default: false },

    // type of action
    // ** dependent on reference type **
    // referenceType 0:
    //  actionType 0: friend request
    //
    // referenceType 1:
    //  actionType 0: invite to community
    //  actionType 1: request to join community
    //
    // referenceType 2:
    //  no actions for this reference
    //
    // referenceType 3:
    //  no actions for this reference
    actionType: {type: Number, min: 0, default: 0},

    // notification time stamp
    timestamp: {type: Date, default: Date.now(), index: true, required: true },
});

module.exports = notificationSchema;
