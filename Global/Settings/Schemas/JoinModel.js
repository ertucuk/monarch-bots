const mongoose = require('mongoose');

const model = mongoose.model('New-Joined', mongoose.Schema({
    id: String,
    voice: Number,
    stream: Number,
    camera: Number,
}));

module.exports = model;