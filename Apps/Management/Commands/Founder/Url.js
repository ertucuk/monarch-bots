const { PermissionsBitField: { Flags }, bold } = require('discord.js');

module.exports = {
    Name: 'url',
    Aliases: ['link'],
    Description: 'Sunucunun url kullanımını gösterir.',
    Usage: 'url',
    Category: 'Founder',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu) => {

        if (!message.guild.vanityURLCode) {
            client.embed(message, 'Sunucuda özel url ayarlanmamış.');
            return;
        }

        const link = await message.guild.fetchVanityData();

        message.reply({
            content: `https://discord.gg/${message.guild.vanityURLCode} (**${link.uses} kez kullanıldı.**)`
        })
    },
};