const Loader = require('./Functions/Loader');
module.exports = {
    Name: 'setup',
    Aliases: ['kur'],
    Description: 'Bot kurulumu',
    Usage: 'setup',
    Category: 'Root',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu) => {
        Loader(client, message)
    },
};