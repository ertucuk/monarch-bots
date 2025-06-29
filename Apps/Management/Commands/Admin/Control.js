const { PermissionsBitField: { Flags }, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, roleMention, EmbedBuilder, inlineCode, bold } = require('discord.js');
const { StaffModel, UserModel } = require('../../../../Global/Settings/Schemas')

const taskTitle = {
  VOICE: 'Ses Kanalları',
  MESSAGE: 'Metin Kanalları',
  PUBLIC: 'Public Kanalları',
  STREAMER: 'Streamer Kanalları',
  RETURN: 'Return',
  ROLE: 'Rol Denetim',
  SOLVE: 'Sorun Çözme',
  STAFF: 'Yetkili Çekme',
  ORIENTATION: 'Oryantasyon',
  MEETING: 'Toplantı',
  TAGGED: 'Taglı',
  REGISTER: 'Kayıt',
  INVITE: 'Davet'
};

module.exports = {
    Name: 'denetim',
    Aliases: [],
    Description: 'Rozet denetimi komutu.',
    Usage: 'denetim',
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

        const role = message.mentions.roles.first() || await message.guild.roles.fetch(args[0]);
        if (!role) {
            message.reply({ content: `${await client.getEmoji('mark')} Bir rol belirtmelisin.` }).then(s => setTimeout(() => s.delete().catch(err => { }), 5000));
            return;
        }

        const members = await message.guild.members.fetch();
        const membersWithRole = members.filter(member => member.roles.cache.has(role.id) && !member.user.bot);
        if (membersWithRole.size === 0) {
            message.reply({ content: `${await client.getEmoji('mark')} Belirtilen rolde üye bulunamadı.` }).then(s => setTimeout(() => s.delete().catch(err => { }), 5000));
            return;
        }

        membersWithRole.forEach(async (member) => {
            const staffDocument = await StaffModel.findOne({ user: member.id });
            const document = await UserModel.findOne({ id: member.id });
            if (!staffDocument) return;
            if (!staffDocument.badges || staffDocument.badges.length === 0) return;

            const firstNonCompletedBadge = staffDocument.badges.findIndex((t) => !t.completed);
            const currentBadge = staffDocument.badges[firstNonCompletedBadge];

            const totalResponsibilities = currentBadge.tasks.find(t => t.isResponsibility === true)
            const completedResponsibilities = currentBadge.tasks.filter((t) => t.isResponsibility && t.completed).length;

            const totalTasks = currentBadge.tasks?.length;
            const completedTasks = currentBadge?.tasks?.filter((t) => t.completed)?.length;

            const totalActivity = totalResponsibilities + totalTasks;
            const completedActivity = completedResponsibilities + completedTasks;

            const { currentRank, currentIndex } = client.staff.getRank(member, ertu);
            if (!currentRank || currentIndex === -1) return;

            const role = message.guild.roles.cache.get(currentRank.role);

            let badgeContent = '';

            const roleEmojiMap = {
                'Revoir': ['1_', '1_'],
                'King': ['2_', '3_'],
                'Führer': ['4_', '5_'],
                'God Tier': ['6_', '7_'],
                'The Rinnegan': ['8_', '9_'],
                'Dante': ['10', '11']
            };

            if (role.name === 'Revoir') {
                badgeContent = `${currentBadge.badge === 1 ? `${await client.getEmoji('1_')} ${roleMention(currentRank.badges.find((b) => b.badge === 1)?.role)} (${await client.getEmoji('1_')} ${roleMention(currentRank.badges.find((b) => b.badge === 1)?.role)} )` : 'Bilinmiyor'}`;
            } else if (roleEmojiMap[role.name]) {
                const [emoji1, emoji2] = roleEmojiMap[role.name];
                const badge1 = currentRank.badges.find((b) => b.badge === 1);
                const badge2 = currentRank?.badges.find((b) => b.badge === 2);

                let content = '';

                if (badge1) content += `${await client.getEmoji(emoji1)} ${roleMention(badge1.role)}`;
                if (badge2) {
                    if (content) content += ' ';
                    content += `${await client.getEmoji(emoji2)} ${roleMention(badge2.role)}`;
                }

                if (currentBadge.badge === 1 && badge1) {
                    content += ` (${await client.getEmoji(emoji1)} ${roleMention(badge1.role)})`;
                } else if (currentBadge.badge === 2 && badge2) {
                    content += ` (${await client.getEmoji(emoji2)} ${roleMention(badge2.role)})`;
                }

                badgeContent = content;
            }

            const percentages = calculatePercantage(currentBadge);

            const row = new ActionRowBuilder({
                components: [
                    new ButtonBuilder({
                        custom_id: 'badgeUpgrade:' + member.id,
                        label: 'Rozet Yükselt',
                        style: ButtonStyle.Success,
                        emoji: { id: await client.getEmojiID('up') },
                    }),

                    new ButtonBuilder({
                        custom_id: 'badgeRemove:' + member.id,
                        label: 'Rozet Düşür',
                        style: ButtonStyle.Danger,
                        emoji: { id: await client.getEmojiID('down') },
                    }),

                    new ButtonBuilder({
                        custom_id: 'badgeRestart:' + member.id,
                        label: 'Rozete Baştan Başlat',
                        style: ButtonStyle.Secondary,
                        emoji: { id: await client.getEmojiID('restart') },
                    })
                ]
            })

            const row2 = new ActionRowBuilder({
                components: [
                    new ButtonBuilder({
                        custom_id: 'staffUpgrade:' + member.id,
                        label: 'Yetki Yükselt',
                        style: ButtonStyle.Success,
                        emoji: { id: await client.getEmojiID('up') },
                    }),

                    new ButtonBuilder({
                        custom_id: 'staffRemove:' + member.id,
                        label: 'Yetki Düşür',
                        style: ButtonStyle.Danger,
                        emoji: { id: await client.getEmojiID('down') },
                    }),

                    new ButtonBuilder({
                        custom_id: 'staffRestart:' + member.id,
                        label: 'Yetkiye Baştan Başlat',
                        style: ButtonStyle.Secondary,
                        emoji: { id: await client.getEmojiID('restart') },
                    })
                ]
            })

            const illusion = new EmbedBuilder({
                color: client.getColor('random'),
                description: [
                    `${member} adlı yetkilinin rozet durumu;`,
                    ' ',
                    `${await client.getEmoji('arrow')} ${bold('Genel Bilgiler;')}`,
                    ' ',
                    `${await client.getEmoji('point')} ${inlineCode('Seçim Tarihi  :')} ${currentBadge.date ? client.timestamp(new Date(currentBadge.date)) : bold('Görev almamış.')}`,
                    `${await client.getEmoji('point')} ${inlineCode('Son Görülme   :')} ${document?.lastVoice ? `${await client.getEmoji('voice')} ${client.timestamp(document.lastVoice)}` : `${await client.getEmoji('voice')} Bilinmiyor`} / ${document?.lastMessage ? `${await client.getEmoji('message')} ${client.timestamp(document.lastMessage)}` : `${await client.getEmoji('message')} Bilinmiyor`}`,
                    `${await client.getEmoji('point')} ${inlineCode('İlerleme      :')} ${currentBadge.name ? await client.functions.createBar(client, percentages.totalPercentage, 100) : bold('Görev almamış.')} (%${percentages.totalPercentage})`,
                    `${await client.getEmoji('point')} ${inlineCode('Seçtiği Görev :')} ${currentBadge.name + ' Görevi' ?? 'Görev almamış.'}`,
                    ' ',
                    `${await client.getEmoji('arrow')} ${bold('Görevler;')}`,
                    ...(await Promise.all(currentBadge?.tasks.map(async (task) => {
                        return await controlTask(client, task);
                    }))),
                    ' ',
                    `${await client.getEmoji('point')} ${inlineCode('Rozet        :')} ${badgeContent}`,
                    `${await client.getEmoji('point')} ${inlineCode('Rozet Süresi :')} ${currentBadge.name ? calculateBadgeDuration(currentBadge.date, currentRank.day) : bold('Görev almamış.')}`,
                    `${await client.getEmoji('point')} ${inlineCode('Görev        :')} ${currentBadge.name ? await client.functions.createBar(client, percentages.normalPercentage, 100) : bold('Görev almamış.')} (%${percentages.normalPercentage})`,
                    `${await client.getEmoji('point')} ${inlineCode('Sorumluluk   :')} ${await client.functions.createBar(client, percentages.respPercentage, 100)} (%${percentages.respPercentage})`,
                    `${await client.getEmoji('point')} ${inlineCode('Durum        :')} ${currentBadge.name ? completedActivity === totalActivity ? bold('Tamamlandı') : `Devam etmelisin (Kalan: ${(100 - Number(percentages.totalPercentage)).toFixed(2)})` : bold('Görev almamış.')}`,
                ].join('\n'),
            })

            const question = await message.channel.send({
                embeds: [illusion],
                components: [row, row2]
            });
        });
    },
};

function calculateBadgeDuration(startDate, finishDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(finishDate).getTime();
    const now = Date.now();

    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const passedDays = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
    const remainingDays = Math.max(0, totalDays - passedDays);

    const percent = ((passedDays / totalDays) * 100).toFixed(2);

    return `%${percent} (${remainingDays} Gün)`;
}

function calculatePercantage(staffDocument) {
    let normalTotal = 0, normalCount = 0;
    let respTotalCount = 0, respTotalRequired = 0;

    staffDocument.tasks.forEach((task) => {
        const required = Number(task.required);
        const count = Number(task.count);

        if (task.isResponsibility) {
            respTotalCount += count > required ? required : count;
            respTotalRequired += required;
        } else {
            normalTotal += (count >= required ? required : count) / required * 100;
            normalCount++;
        }
    });

    const normalPercentage = normalCount ? (normalTotal / normalCount) : 0;
    const respPercentage = respTotalRequired ? (respTotalCount / respTotalRequired) * 100 : 0;
    const totalPercentage = normalCount && respTotalRequired
        ? ((normalPercentage + respPercentage))
        : (normalCount ? normalPercentage : respPercentage);

    return {
        totalPercentage: totalPercentage.toFixed(2),
        normalPercentage: normalPercentage.toFixed(2),
        respPercentage: respPercentage.toFixed(2)
    };
}

async function controlTask(client, task) {
    const { count, required, name } = task;
    const isTimeBased = required >= 60 * 60 * 1000;
    const currentData = isTimeBased ? formatDurations(count) : count;
    const requiredData = isTimeBased ? formatDurations(required) + ' saat' : `${required} adet`;

    let taskStatus = `${await client.getEmoji('point')} ${inlineCode((taskTitle[name] || '').padEnd(19, ' ') + ':')}`;

    if (task.completed) {
        taskStatus += `${await client.getEmoji('check')}`;
    } else {
        taskStatus += `${currentData} / ${requiredData}`;
    }
    return taskStatus;

}

function formatDurations(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    return `${String(hours).padStart(2, '')}`;
}