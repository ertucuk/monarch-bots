const { PermissionsBitField: { Flags }, ApplicationCommandOptionType, EmbedBuilder, inlineCode, bold } = require('discord.js');

module.exports = {
    Name: 'detaydenetim',
    Aliases: ['rolstat', 'rolkontrol'],
    Description: 'Belirttiğiniz roldeki üyelerin istatistiklerini gösterir.',
    Usage: 'detaydenetim <@Rol/ID> [gün]',
    Category: 'Admin',
    Cooldown: 0,

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu, embed) => {

        const role = message.mentions.roles.first() || await message.guild.roles.fetch(args[0]);
        if (!role) {
            message.reply({ content: `${await client.getEmoji('mark')} Bir rol belirtmelisin.` }).then(s => setTimeout(() => s.delete().catch(err => { }), 5000));
            return;
        }

        const wantedDay = Number(args[1]) || 7;
        const members = message.guild.members.cache.filter(member => member.roles.cache.has(role.id) && !member.user.bot);
        if (members.size === 0) {
            message.reply({ content: `${await client.getEmoji('mark')} Bu rolde hiç üye bulunmuyor.` }).then(s => setTimeout(() => s.delete().catch(err => { }), 5000));
            return;
        }

        let dataless = [];
        let memberDetails = [];

        await Promise.all(members.map(async member => {
            const document = await member.stats(wantedDay);
            if (!document) {
                dataless.push(member);
                return;
            }

            memberDetails.push({
                member: member,
                document: document,
                voiceTotal: document.voice || 0,
                messageTotal: document.message || 0
            });
        }));

        memberDetails.sort((a, b) => {
            if (b.voiceTotal !== a.voiceTotal) return b.voiceTotal - a.voiceTotal;
            return b.messageTotal - a.messageTotal;
        });

        if (memberDetails.length === 0) {
            message.reply({ content: 'Veri bulunamadı.' });
            return;
        }

        for (const data of memberDetails) {
            const { member, document } = data;
            const userEmbed = new EmbedBuilder({
                color: client.getColor('random'),
                footer: { text: `made by ertu ❤️` },
                description: `${member} (${member.id}) üyesinin veritabanındaki ${wantedDay? `son ${wantedDay} gün` : 'tüm'} verileri:`
            })

            userEmbed.addFields(
                {
                    name: `Toplam Kategori Sıralaması`,
                    value:
                        (await Promise.all(document.category.voice.categories
                            .filter((d) => message.guild?.channels.cache.has(d.id))
                            .map(async (cat) => {
                                const channel = message.guild?.channels.cache.get(cat.id)?.name || '#silinmiş-kanal';
                                return `${await client.getEmoji('point')} #${channel}: ${inlineCode(client.functions.formatDurations(cat.value))}`;
                            })
                        )).slice(0, 5).join('\n') || 'Veri bulunamadı.',
                    inline: false
                },
                {
                    name: `Toplam Ses Kanal Sıralaması (${client.functions.formatDurations(document.voice)})`,
                    value:
                        (await Promise.all(document.channels.voice.channels
                            .filter((d) => message.guild?.channels.cache.has(d.id))
                            .map(async (vc) => {
                                const channel = message.guild?.channels.cache.get(vc.id)?.name || '#silinmiş-kanal';
                                return `${await client.getEmoji('point')} #${channel}: ${inlineCode(client.functions.formatDurations(vc.value))}`;
                            })
                        )).slice(0, 5).join('\n') || 'Veri bulunamadı.',
                    inline: false
                },
                {
                    name: `Toplam Mesaj Kanal Sıralaması (${document.message} Mesaj)`,
                    value:
                        (await Promise.all(document.channels.message.channels
                            .filter((d) => message.guild?.channels.cache.has(d.id))
                            .map(async (mc) => {
                                const channel = message.guild?.channels.cache.get(mc.id)?.name || '#silinmiş-kanal';
                                return `${await client.getEmoji('point')} #${channel}: ${inlineCode(mc.value + ' mesaj')}`;
                            })
                        )).slice(0, 5).join('\n') || 'Veri bulunamadı.',
                    inline: false
                }
            );

            await message.channel.send({ embeds: [userEmbed] });
        }
    }
};