const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { PunitiveModel } = require('../../../../../Global/Settings/Schemas/')
const moment = require('moment');
moment.locale('tr');

module.exports = {
    Name: 'af',
    Aliases: ['cezaaf'],
    Description: 'Belirlenen üyenin cezalarını kaldırır.',
    Usage: 'af <@User/ID>',
    Category: 'Moderation',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu) => {

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
            client.embed(message, 'Kullanıcı bulunamadı!')
            return;
        }

        if (member.id === message.author.id) {
            client.embed(message, 'Kendi cezanızı kaldıramazsınız.')
            return;
        }

        const document = await PunitiveModel.find({ user: member.id, active: true });
        if (!document.length) {
            client.embed(message, 'Kullanıcının cezası yok.');
            return;
        }

        const reverseData = document.reverse();
        const options = reverseData.map((x, i) => {
            return {
                label: `${i + 1} - [${x.type}]`,
                description: `Sebep: ${x.reason}`,
                value: x.id.toString(),
                author: message.guild.members.cache.get(x.staff) ? message.guild.members.cache.get(x.staff).user : 'Bilinmiyor',
                reason: x.reason,
                remainingTime: x.finishedTime ? moment.duration(x.finishedTime - Date.now()).humanize() : 'Süresiz.',
            };
        });

        const row = new StringSelectMenuBuilder({
            customId: 'amnesty',
            placeholder: 'Bir ceza seçin...',
            options: options,
        })

        const list = options.map((option) => {
            return `${option.label} ${option.author}: ${option.reason} - Kalan Süre: ${option.remainingTime}`;
        }).join('\n');

        const embed = new EmbedBuilder({
            color: client.getColor('random'),
            author: { name: member.displayName, iconURL: member.displayAvatarURL() },
            footer: { text: 'made by ertu ❤️' },
            timestamp: Date.now(),

            description: `${await client.getEmoji('arrow')} ${member} adlı kullanıcının cezalarını kaldırmak için aşağıdaki menüyü kullanabilirsiniz.`,
            fields: [
                { name: 'Ceza Bilgileri', value: list, inline: true },
            ]
        })

        const question = await message.reply({
            embeds: [embed],
            components: [new ActionRowBuilder().addComponents(row)],
        });

        const filter = (i) => i.user.id === message.author.id;
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 2,
            max: 1
        });

        collector.on('collect', async (i) => {
            i.deferUpdate();

            const select = options.find((option) => option.value === i.values[0]);
            if (!select) {
                question.edit({ content: 'Geçersiz bir seçim yaptınız.', components: [] });
                return;
            }

            const data = await PunitiveModel.findOne({ id: select.value });
            if (!data) {
                question.edit({ content: 'Geçersiz bir seçim yaptınız.', components: [] });
                return;
            }

            if (data.type === 'ChatMute') {
                member.roles.remove(ertu.settings.chatMuteRole);
            } else if (data.type === 'VoiceMute') {
                if (member.voice.channel) member.voice.setMute(false);
                member.roles.remove(ertu.settings.voiceMuteRole);
            } else if (data.type === 'Event') {
                member.roles.remove(ertu.settings.eventPenaltyRole);
            } else if (data.type === 'Streamer') {
                member.roles.remove(ertu.settings.streamerPenaltyRole);
            } else if (data.type === 'Underworld') {
                member.setRoles(data.roles);
            } else if (data.type === 'Quarantine') {
                member.setRoles(data.roles);
            }

            await PunitiveModel.updateOne({ id: select.value }, { active: false, finishedTime: Date.now(), remover: message.author.id, removeReason: 'Ceza affedildi. (.af)' });
            await question.edit({
                components: question.components.map(row =>
                    new ActionRowBuilder({
                        components: row.components.map(component => {
                            if (component.type === 3) {
                                return new StringSelectMenuBuilder({
                                    customId: component.customId,
                                    placeholder: 'Başarılı bir şekilde ceza affedildi.',
                                    options: component.options,
                                    disabled: true
                                })
                            }

                            return component;
                        })
                    })
                )
            });
        });
    },
};