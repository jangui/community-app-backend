const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const pictureSchema = new Schema({
    owner: {type: mongoose.Types.ObjectId, ref: 'User'},
});

const Picture = mongoose.model('Picture', pictureSchema);

module.exports = Picture;
