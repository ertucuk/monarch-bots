const {
    ContainerBuilder,
    MessageFlags,
    SectionBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    bold
} = require('discord.js');

module.exports = {
    Name: 'sesli',
    Aliases: ['seslisay'],
    Description: 'Sunucuda seslide kaç kişi olduğunu söyler.',
    Usage: 'sesli',
    Category: 'Admin',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu, embed) => {

        const minStaffRole = message.guild?.roles.cache.get(ertu.settings.minStaffRole)
        if (!minStaffRole) return client.embed(message, 'Sunucuda en düşük yetkili rolü ayarlanmamış.');

        const voiceMembers = message.guild?.members.cache.filter((m) => m.voice.channel);
        const taggedMembers = voiceMembers.filter(m => m.user.displayName.includes(ertu.settings.tag));
        const staffMembers = voiceMembers.filter((m) => m.roles.highest.position >= minStaffRole.position && !m.user.bot);
        const streamMembers = voiceMembers.filter(m => m.voice.streaming);
        const mutedMembers = voiceMembers.filter(m => m.voice.channel && m.voice.mute);
        const deafenedMembers = voiceMembers.filter(m => m.voice.channel && m.voice.deaf);

        const publicMembers = voiceMembers.filter(m => m.voice.channel.parentId === ertu.settings.publicParent);
        const streamerMembers = voiceMembers.filter(m => m.voice.channel.parentId === ertu.settings.streamerParent);
        const registerMembers = voiceMembers.filter(m => m.voice.channel.parentId === ertu.settings.registerParent);
        const secretMembers = voiceMembers.filter(m => m.voice.channel.parentId === ertu.settings.privateRoomParent);
        const funParents = voiceMembers.filter(m => m.voice.channel.parentId === ertu.settings.activityParent);

        const categoryCounts = {};

        message.guild.channels.cache
            .filter(c => c.isVoiceBased() && c.parent)
            .forEach(c => {
                const name = c.parent.name;
                categoryCounts[name] = (categoryCounts[name] || 0) + c.members.size;
            });

        const top = Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count], i) => `**${i + 1}.** #${name} (${count} üye)`)
            .join('\n');

        const container = new ContainerBuilder();

        const title = new TextDisplayBuilder().setContent('# Sunucu Sesli Bilgileri')
        container.addTextDisplayComponents(title);

        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            [
                `${await client.getEmoji('point')} Toplam ${bold(voiceMembers.size.toString())} üye ses kanallarında.`,
                `${await client.getEmoji('point')} Toplam ${bold(taggedMembers.size.toString())} taglı üye ses kanallarında.`,
                `${await client.getEmoji('point')} Toplam ${bold(staffMembers.size.toString())} yetkili ses kanallarında.`,
                `${await client.getEmoji('point')} Toplam ${bold(streamMembers.size.toString())} üye yayın yapıyor.`,
                `${await client.getEmoji('point')} Toplam ${bold(mutedMembers.size.toString())} üyenin mikrofonu kapalı.`,
                `${await client.getEmoji('point')} Toplam ${bold(deafenedMembers.size.toString())} üyenin kulaklığı kapalı.`,
            ].join('\n')
        ))

        container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));

        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            [
                `${await client.getEmoji('point')} Toplam ${bold(publicMembers.size.toString())} üye public odalarda.`,
                `${await client.getEmoji('point')} Toplam ${bold(streamerMembers.size.toString())} üye streamer odalarda.`,
                `${await client.getEmoji('point')} Toplam ${bold(registerMembers.size.toString())} üye register odalarda.`,
                `${await client.getEmoji('point')} Toplam ${bold(secretMembers.size.toString())} üye secret odalarda.`,
                `${await client.getEmoji('point')} Toplam ${bold(funParents.size.toString())} üye eğlence odalarda.`,
            ].join('\n')
        ))

        container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));

        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(top))

        message.reply({
            components: [container],
            flags: [MessageFlags.IsComponentsV2]
        })
    },
};