module.exports = {
    Name: 'tag',
    Aliases: [],
    Description: 'Sunucunun tagını gösterir.',
    Usage: 'tag',
    Category: 'Global',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu, embed) => {
        const tag = ertu.settings.tag;
        message.channel.send(tag || 'Tag ayarlanmamış.');
    }
};