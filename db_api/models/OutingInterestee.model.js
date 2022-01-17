const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const outingInteresteeSchema = new Schema({
    // user's ID that is interested in the outing
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true},

    // the user's username
    username: {type: String, trim: true, required: true, minLength: 1, maxLength: 30, required: true },

    // outing in reference
    outing: {type: mongoose.Schema.Types.ObjectId, ref: 'Outing', index: true, required: true},

    });

const OutingInterestee = mongoose.model('OutingInterestee', outingInteresteeSchema);

module.exports = OutingInterestee;
