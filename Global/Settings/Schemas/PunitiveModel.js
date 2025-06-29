const mongoose = require('mongoose');

const model = mongoose.model('New-Punitive', mongoose.Schema({
    id: { type: String },
    type: { type: String },
    user: { type: String, required: true },
    staff: { type: String, required: true },
    remover: { type: String, default: undefined },
    reason: { type: String, required: true },
    removeReason: { type: String, default: undefined },

    active: { type: Boolean, default: true },
    visible: { type: Boolean, default: true },

    image: { type: Object, default: undefined },
    createdTime: { type: Number, default: Date.now() },
    finishedTime: { type: Number, default: undefined },
    removedTime: { type: Number, default: undefined },
    roles: { type: Array, default: undefined },
}));

module.exports = model;