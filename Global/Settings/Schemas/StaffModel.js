const mongoose = require('mongoose');

const model =  mongoose.model('New-Staff', mongoose.Schema({
    user: { type: String, required: true },

    startAt: { type: Number, default: Date.now() },
    roleStartAt: { type: Number, default: Date.now() },

    hasOrientation: { type: Boolean, default: false },
    totalIndividualMeeting: { type: Number, default: 0 },
    totalStaffMeeting: { type: Number, default: 0 },
    totalGeneralMeeting: { type: Number, default: 0 },

    responsibilities: { type: Array, default: [] },
    oldRanks: { type: Array, default: [] },
    badges: { type: Array, default: [] },
    
    excuses: { type: Array, default: [] },
    inviteds: { type: Array, default: [] },
    staffs: { type: Array, default: [] },
    taggeds: { type: Array, default: [] },
    bonuses: { type: Array, default: [] },
    notes: { type: Array, default: [] },

    authBlock: { type: Boolean, default: false },
    authBlockReason: { type: String, default: '' },
    authBlockDate: { type: Number, default: 0 },
    authBlockStaff: { type: String, default: '' },

    dailyPoints: { type: Number, default: 0 },
    bonusPoints: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    registerPoints: { type: Number, default: 0 },
    publicPoints: { type: Number, default: 0 },
    afkPoints: { type: Number, default: 0 },
    streamerPoints: { type: Number, default: 0 },
    activityPoints: { type: Number, default: 0 },
    messagePoints: { type: Number, default: 0 },
    invitePoints: { type: Number, default: 0 },
    staffPoints: { type: Number, default: 0 },
    taggedPoints: { type: Number, default: 0 },
    badgePoints: { type: Number, default: 0 },
  })
);

module.exports = model;