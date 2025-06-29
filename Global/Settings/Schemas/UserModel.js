const mongoose = require('mongoose');

const model = mongoose.model('New-User', mongoose.Schema({
    id: { type: String },
    name: { type: String },
    gender: { type: String },

    penalPoint: { type: Number, default: 0 },
    monarchCoin: { type: Number, default: 0 },

    day: { type: Number, default: 1 },
    lastDayTime: { type: Number, default: () => new Date().setHours(0, 0, 0, 0) },

    voices: { type: Object, default: {} },
    messages: { type: Object, default: {} },
    streams: { type: Object, default: {} },
    cameras: { type: Object, default: {} },

    lastVoice: { type: Number, default: 0 },
    lastMessage: { type: Number, default: 0 },

    inviter: { type: String, default: null },
    register: { type: String, default: null },

    nameLogs: { type: [Object], default: [] },
    roleLogs: { type: [Object], default: [] },
    voiceLogs: { type: [Object], default: [] },
    warnLogs: { type: [Object], default: [] },
    solversData: { type: [Object], default: [] },
    invitesData: { type: Object, default: {} },

    records: { type: [Object], default: [] },
    invites: { type: [Object], default: [] },
    taggeds: { type: [Object], default: [] },
    staffs: { type: [Object], default: [] },
}));

module.exports = model; 