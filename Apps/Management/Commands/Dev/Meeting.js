module.exports = {
    Name: 'katıldıver',
    Aliases: [],
    Description: 'Botun pingini gösterir.',
    Usage: '',
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

        const voiceMembers = [...message.member.voice.channel.members.values()];
        const meetingRole = message.guild.roles.cache.get(ertu.settings.meetingRole);
        if (!meetingRole) return message.reply({ content: 'Toplantı rolü bulunamadı.', ephemeral: true });

        for (const member of meetingRole.members.values()) {
            await member.roles.remove(meetingRole);
        }

        for (const m of voiceMembers) {
            await m.roles.add(ertu.settings.meetingRole);
        }
    },
};