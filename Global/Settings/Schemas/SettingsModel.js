const mongoose = require('mongoose');

const model = mongoose.model('New-Settings', mongoose.Schema({
    id: { type: String, required: true },

    privateRooms: { type: [Object], default: [] },
    locaRooms: { type: [Object], default: [] },
    streamerRooms: { type: [Object], default: [] },
    specialCmds: { type: [Object], default: [] },
    snipesData: { type: [Object], default: [] },
    board: { type: [Object], default: [] },
    cmdPerms: { type: Object, default: {} },
    teams: { type: [Object], default: [] },
    responsibilityApplications: { type: [Object], default: [] },
    meetings: { type: [Object], default: [] },
    solvers: { type: [Object], default: [] },

    staffRanks: { type: [Object], default: [] },

    staffLeaves: { type: [Object], default: [] },
    tagLeaves: { type: [Object], default: [] },

    systems: {
        register: { type: Boolean, default: true },
        invasion: { type: Boolean, default: false },
        needName: { type: Boolean, default: true },
        needAge: { type: Boolean, default: true },
        compliment: { type: Boolean, default: true },
        autoRegister: { type: Boolean, default: false },
    },

    settings: {
        tag: { type: String, default: '' },
        secondTag: { type: String, default: '' },
        bannedTags: { type: [String], default: [] },
        teams: { type: [Object], default: [] },
        minAge: { type: Number, default: 0 },
        name: { type: String, default: 'İsim | Yaş' },

        muteLimit: { type: Number, default: 0 },
        jailLimit: { type: Number, default: 0 },
        unregisteredLimit: { type: Number, default: 0 },
        banLimit: { type: Number, default: 0 },

        minStaffRole: { type: String, default: '' },
        moveAuth: { type: [String], default: [] },
        staffs: { type: [String], default: [] },
        founders: { type: [String], default: [] },
        solvingStaffs: { type: [String], default: [] },
        staffUpdateAuth: { type: [String], default: [] },
        registerStaffs: { type: [String], default: [] },
        staffResponsibilities: { type: [Object], default: [] },

        unregisterRoles: { type: [String], default: [] },
        manRoles: { type: [String], default: [] },
        womanRoles: { type: [String], default: [] },
        registeredRole: { type: String, default: '' },
        meetingRole: { type: String, default: '' },
        vipRole: { type: String, default: '' },
        streamerRole: { type: String, default: '' },
        camRole: { type: String, default: '' },
        familyRole: { type: String, default: '' },
        richRole: { type: String, default: '' },

        bannedTagRole: { type: String, default: '' },
        quarantineRole: { type: String, default: '' },
        chatMuteRole: { type: String, default: '' },
        voiceMuteRole: { type: String, default: '' },
        underworldRole: { type: String, default: '' },
        suspectedRole: { type: String, default: '' },
        warnRoles: { type: [Object], default: [] },
        adsRole: { type: String, default: '' },
        eventPenaltyRole: { type: String, default: '' },
        publicPenaltyRole: { type: String, default: '' },
        streamerPenaltyRole: { type: String, default: '' },

        chatChannel: { type: String, default: '' },
        botCommandChannels: { type: [String], default: [] },
        staffChat: { type: String, default: '' },
        mentionChannels: { type: [String], default: [] },
        registerChannel: { type: String, default: '' },
        inviteChannel: { type: String, default: '' },
        privateRoomChannel: { type: String, default: '' },

        registerParent: { type: String, default: '' },
        meetingParent: { type: String, default: '' },
        problemSolveParent: { type: String, default: '' },
        streamerParent: { type: String, default: '' },
        publicParent: { type: String, default: '' },
        customRoomParent: { type: String, default: '' },
        locaParent: { type: String, default: '' },
        privateRoomParent: { type: String, default: '' },
        activityParent: { type: String, default: '' },
    },
}));

module.exports = model;