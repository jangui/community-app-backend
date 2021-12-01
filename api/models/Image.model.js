const mongoose = require('mongoose');

const schema = mongoose.Schema;

/*
 * The image schema has no fields defined explicitly because
 * mongoose automatically inserts a '_id' field.
 * The id field is unique and 12 bytes long.
 * Since all we need for an image is a unique ID,
 * there is no need to define any field members.
 */
const imageSchema = new Schema();

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;
