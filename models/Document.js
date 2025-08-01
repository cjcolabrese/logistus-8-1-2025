const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate');
const { Schema } = mongoose;

const DocumentSchema = new mongoose.Schema({
    downloadUrl: { type: String, required: true },
    description: String,
    uploadDate: { type: Date, default: Date.now },
});
module.exports = mongoose.model('Document', DocumentSchema);


