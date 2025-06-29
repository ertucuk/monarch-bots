const { ActivityType } = require('discord.js');

module.exports = {
    serverID: '',
    ownerID: [],
    channelID: '',
    database: '',

    Presence: {
        Status: 'online',
        Type: ActivityType.Playing,
        Message: [
            'made by ertu ❤️',
            'en iyisi 😁'
        ]
    },

    Main: {
        Management: '',
        Registerian: '',
        Statistics: '',
        Kingdom: '',
        Prefix: ['.'],
    },

    Welcome: {
        Tokens: [],
        Channels: [],
    },
};