const { PermissionsBitField: { Flags }, bold, inlineCode, roleMention, EmbedBuilder, ComponentType } = require('discord.js');
const { UserModel } = require('../../../../Global/Settings/Schemas');

const dangerNames = [
    'bot',
    'mute',
    'developer',
    'developed',
    'lideri',
    'denetleyici',
    'sorumlusu',
    'underworld',
    'cezalı',
    'lideri',
    'sorumlusu',
    'denetleyici',
    'ultimate',
    'sorun',
    'lider',
    'yetkili alım',
    'emperor',
    'founder',
    '▬▬▬',
    'stars',
    'cash',
    'best',
    'mutlu',
    'reklam',
    'yeni',
    'yasaklı',
    'katılmadı',
    'katıldı',
    'susturuldu',
    'mazeret',
    'bireysel',
    'toplantı',
    'uyarı'
];

const dangerPerms = [
    Flags.Administrator,
    Flags.KickMembers,
    Flags.ManageGuild,
    Flags.BanMembers, 
    Flags.ManageRoles,
    Flags.ManageWebhooks,
    Flags.ManageNicknames,
    Flags.ManageChannels,
];

module.exports = {
    Name: 'rol',
    Aliases: [],
    Description: 'Belirttiğiniz üyeye rol verip çıkarırsınız.',
    Usage: 'rol <@User/ID>',
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

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) return client.embed(message, 'Geçerli bir üye belirtmelisiniz.');

        const guildRoles = message.guild?.roles.cache
            .filter(role =>
                role.name !== '@everyone' &&
                !dangerNames.some(name => role.name.toLowerCase().includes(name)) &&
                !dangerPerms.some(perm => role.permissions.has(perm)) &&
                !ertu.settings.staffs.some(x => x === role.id)
            )
            .sort((a, b) => b.position - a.position)
            .map(role => role.id);

        const chunkSize = 25;
        let currentPage = 1;

        const generatePage = (page) => {
            const start = (page - 1) * chunkSize; 
            const paginatedRoles = guildRoles.slice(start, start + chunkSize);
            const navigation = `${inlineCode(' 0 ')} ${bold('İşlemi iptal et.')} | Sayfa ${page}/${Math.ceil(guildRoles.length / chunkSize)}`;

            return `${navigation}\n\n${paginatedRoles.map((role, index) =>
                `${inlineCode(` ${start + index + 1}. `)} ${roleMention(role)} ${member.roles.cache.has(role) ? '✅' : '❌'}`
            ).join('\n')}` || 'Bu sayfada gösterilecek rol bulunamadı.';
        };
       
        const totalPages = Math.ceil(guildRoles.length / chunkSize);
        const initialEmbed = await message.channel.send({
            embeds: [embed.setDescription(generatePage(currentPage))],
            components: [client.getButton(currentPage, totalPages)]
        });

        const collector = initialEmbed.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: i => i.user.id === message.author.id,
            time: 1000 * 60 * 5
        });

        const messageCollector = message.channel.createMessageCollector({
            filter: m => m.author.id === message.author.id,
            time: 1000 * 60 * 5
        });

        collector.on('collect', async (i) => {
            i.deferUpdate();
          
            if (i.customId === 'first') currentPage = 1;
            if (i.customId === 'previous') currentPage -= 1;
            if (i.customId === 'next') currentPage += 1;
            if (i.customId === 'last') currentPage = totalPages;

            await initialEmbed.edit({  
                embeds: [embed.setDescription(generatePage(currentPage))],
                components: [client.getButton(currentPage, totalPages)]
            });
        });

        messageCollector.on('collect', async (m) => {
            if (m.content === '0') {
                collector.stop('cancelled');
                messageCollector.stop('cancelled');
                return;
            }

            const roleNumbers = m.content.split(' ').filter(r => !isNaN(parseInt(r)));
            if (!roleNumbers.length) {
                message.channel.send('Geçerli bir rol numarası belirtmelisiniz.').then(msg => setTimeout(() => msg.delete(), 5000));
                collector.stop('cancelled');
                messageCollector.stop('cancelled');
                return;
            }

            const selectedRoles = roleNumbers.map(r => guildRoles[parseInt(r) - 1]).filter(Boolean);
            const addedRoles = selectedRoles.filter(r => !member.roles.cache.has(r));
            const removedRoles = selectedRoles.filter(r => member.roles.cache.has(r));
            const now = Date.now();

            const addedLog = await client.getChannel(client.data.logs.roleAdd, message)
            const removedLog = await client.getChannel(client.data.logs.roleRemove, message);
            if (!addedLog || !removedLog) return;

            if (addedRoles.length) {
                await member.roles.add(addedRoles).catch(() => { });
                await UserModel.updateOne({ id: member.id }, { $push: { roleLogs: { type: 'add', roles: addedRoles, staff: message.author.id, date: Date.now() } } });

                addedLog.send({
                    flags: [4096],
                    embeds: [
                        new EmbedBuilder({
                            color: client.getColor('green'),
                            title: `Rol Değişim Kaydı (.rol)`,
                            thumbnail: { url: member.displayAvatarURL({ size: 2048, extension: 'png' }) },
                            description: [
                                `→ Kullanıcı: ${member} (${inlineCode(member.id)})`,
                                `→ Yetkili: ${message.author} (${inlineCode(message.author.id)})`,
                                `→ Eklenen Roller: ${addedRoles.map(r => roleMention(r)).join(', ')}`,
                                `→ Tarih: ${client.timestamp(now)}`
                            ].join('\n'),
                        })
                    ]
                });
            }

            if (removedRoles.length) {
                await member.roles.remove(removedRoles).catch(() => { });
                await UserModel.updateOne({ id: member.id }, { $push: { roleLogs: { type: 'remove', roles: removedRoles, staff: message.author.id, date: Date.now() } } });

                removedLog.send({
                    flags: [4096],
                    embeds: [
                        new EmbedBuilder({
                            color: client.getColor('red'),
                            title: `Rol Değişim Kaydı (.rol)`,
                            thumbnail: { url: member.displayAvatarURL({ size: 2048, extension: 'png' }) },
                            description: [
                                `→ Kullanıcı: ${member} (${inlineCode(member.id)})`,
                                `→ Yetkili: ${message.author} (${inlineCode(message.author.id)})`,
                                `→ Kaldırılan Roller: ${removedRoles.map(r => roleMention(r)).join(', ')}`,
                                `→ Tarih: ${client.timestamp(now)}`
                            ].join('\n'),
                        })
                    ]
                });
            }

            const resultMessage = [
                addedRoles.length ? `Eklenen Roller: ${addedRoles.map(r => roleMention(r)).join(', ')}` : '',
                removedRoles.length ? `Kaldırılan Roller: ${removedRoles.map(r => roleMention(r)).join(', ')}` : ''
            ].filter(Boolean).join('\n');

            initialEmbed.edit({
                embeds: [embed.setDescription(resultMessage || 'Belirttiğiniz roller zaten mevcut durumda.')],
                components: []
            });

            messageCollector.stop('cancelled');
        });

        collector.on('end', (_, reason) => {
            if (reason === 'cancelled') {
                initialEmbed.delete().catch(() => { });
            } else {
                initialEmbed.delete().catch(() => { });
            }
        });

        messageCollector.on('end', (_, reason) => {
            if (reason === 'cancelled') return;
            initialEmbed.delete().catch(() => { });
        });
    },
};