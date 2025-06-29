module.exports = {
    Name: 'banaf',
    Aliases: [],
    Description: 'Botun pingini gösterir.',
    Usage: 'ping',
    Category: 'Root',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu, embed) => {
        const bans = await message.guild.bans.fetch();
        bans.forEach(async (banInfo) => {
            const user = banInfo.user;
            await message.guild.bans.remove(user, 'Ban Affı');
        });

        await message.reply({ content: `Sunucudaki tüm yasaklar kaldırıldı.` });
    },
};