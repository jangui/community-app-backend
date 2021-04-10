const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const eventSchema = new Schema({
    name: { type: String, required: true },
    start: { type: Date, required: true },
    end: Date,
    city: { type: String, required: true },
    country: String,
    capacity:  Number,
    visible: { type: Boolean, default: false },
});

eventSchema.index({ name: 1, start: 1 }, { unique: true });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
