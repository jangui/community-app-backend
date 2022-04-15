const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    // user getting notified
    notifee: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true},

    // user causing notification
    notifier: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},

    // has the notification be read
    unread: { type: Boolean, default: true },

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

    // type of notification
    // referenceType 0: (User)
    //  notificationType 0: notifer sent notifee a friend request
    //  notificationType 1: notifer accepted notifee's friend request
    //
    // referenceType 1: (Community)
    //  notificationType 0: notifier requests to join notifee's community
    //  notificationType 1: notifee is accepted into the referenced community
    //  notificationType 2: notifee is invited to the referenced community
    //  notificationType 3: notifer is accepted invite to the referenced community
    //
    // referenceType 2: (Post)
    //  notificationType 0: notifier commented on notifee's post
    //  notificationType 1: notifier liked notifee's post
    //
    // referenceType 3: (Outing)
    //  notificationType 0: notifier commented on notifee's outing
    //  notificationType 1: notifier is attending notifee's outing
    //
    notificationType: {type: Number, min: 0, default: 0},

    // notification time stamp
    timestamp: {type: Date, default: Date.now(), index: true, required: true },
});

module.exports = notificationSchema;
