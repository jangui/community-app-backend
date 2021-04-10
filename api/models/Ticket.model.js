const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ticketSchema = new Schema({
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    eventName: { type: Schema.Types.ObjectId, ref: 'Event' },
    scanned: { type: Date }
});

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
