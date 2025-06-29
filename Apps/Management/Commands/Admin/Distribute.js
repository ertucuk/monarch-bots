const { PermissionsBitField: { Flags }, ChannelType } = require('discord.js');

module.exports = {
    Name: 'dağıt',
    Aliases: ['dagıt', 'distribute', 'dagit'],
    Description: 'Bulunduğunuz ses kanalındaki üyeleri public odalara dağıtmaya yarar.',
    Usage: 'dağıt',
    Category: 'Admin',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu) => {
        if (!message.member.voice.channel) {
            message.reply({ content: `${await client.getEmoji('mark')} Bir ses kanalında olmanız gerekiyor.` }).then(s => setTimeout(() => s.delete().catch(err => { }), 5000));
            return;
        }

        const publicCategory = message.guild.channels.cache.filter((c) => c.parentId === ertu.settings.publicParent && c.type === ChannelType.GuildVoice);

        [...message.member.voice.channel.members.values()]
            .filter((m) => m.voice.channelId === message.member.voice.channelId)
            .forEach((m) => m.voice.setChannel(publicCategory.random().id));

        message.react(await client.getEmoji('check'));
        message.channel.send({ content: `${await client.getEmoji('check')} Başarıyla kanaldaki tüm kullanıcılar public odalara dağıtıldı.` }).then(s => setTimeout(() => s.delete().catch(err => { }), 15000));
    },
};