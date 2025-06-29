const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    Name: 'yetkilidenetim',
    Aliases: ['staffsay', 'ysay', 'ytsay'],
    Description: 'Sunucudaki yetkilileri kontrol eder.',
    Usage: 'ysay',
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

        const roleGroups = {
            kurucu: ['990329649605275688', '1007011332408754236'],
            ustYonetim: ['1343686681785667707', '1221094169422860379'],
            ortaYonetim: ['1382148807378079816', '1382148245437939712', '923154956159176754'],
            altYonetim: ['1343688607214604330', '904188905954373682', '904188905971146792', '904188905971146794'],
            yetkili: ['904188905933377598', '904188905954373679']
        };

        const groupLabels = {
            kurucu: 'Kurucular',
            ustYonetim: 'Üst Yönetim',
            ortaYonetim: 'Orta Yönetim',
            altYonetim: 'Alt Yönetim',
            yetkili: 'Genel Yetkili'
        };

        const groupMembers = {};
        const addedMembers = new Set();

        for (const [groupName, roleIds] of Object.entries(roleGroups)) {
            groupMembers[groupName] = new Map();

            for (const roleId of roleIds) {
                const role = message.guild.roles.cache.get(roleId);
                if (!role) continue;

                const members = role.members.filter(m =>
                    message.guild.members.cache.has(m.id) &&
                    !addedMembers.has(m.id) &&
                    !m.user.bot
                );

                members.forEach(member => {
                    groupMembers[groupName].set(member.id, member);
                    addedMembers.add(member.id);
                });
            }
        }

        const getOfflineVoiceData = (members) =>
            Array.from(members.values()).filter(m =>
                !m.voice.channelId &&
                m.presence &&
                m.presence.status !== 'offline'
            );

        for (const [groupName, members] of Object.entries(groupMembers)) {
            const displayName = groupLabels[groupName];
            const offlineVoice = getOfflineVoiceData(members);
            const mentionList = offlineVoice.map(m => m.toString()).join(', ') || `${displayName} grubunda seste olmayan yok.`;

            const block = [
                `**${displayName}: ${members.size} kişi**`,
                `Ses Kanalında Olmayanlar: ${offlineVoice.length} kişi`,
                '-------------------------------',
                mentionList,
                '-------------------------------'
            ].join('\n');

            const button = new ButtonBuilder()
                .setCustomId(`care_${groupName}`)
                .setLabel('İlgileniyorum')
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder().addComponents(button);

            const sentMsg = await message.channel.send({
                content: block,
                components: [row]
            });

            const collector = sentMsg.createMessageComponentCollector({ time: 7200000 });

            collector.on('collect', async (i) => {
                await i.deferUpdate();

                await sentMsg.edit({
                    content: block,
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`care_${groupName}`)
                                .setLabel(`${i.user.username} ilgileniyor`)
                                .setStyle(ButtonStyle.Success)
                                .setDisabled(true)
                        )
                    ]
                });
            });
        }
    },
};