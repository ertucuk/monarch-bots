const { PermissionFlagsBits, roleMention, channelMention, userMention, inlineCode, ActionRowBuilder, UserSelectMenuBuilder, StringSelectMenuBuilder } = require('discord.js');
const { SettingsModel } = require('../../../../../Global/Settings/Schemas');

module.exports = async function StreamerRoom(client, interaction, route, ertu) {
    const member = interaction.guild?.members.cache.get(interaction.user.id)
    if (!member) return;

    const streamerController = interaction.guild?.roles.cache.find(r => r.name === '† Streamer Denetleyici');
    const streamerLeader = interaction.guild?.roles.cache.find(r => r.name === '† Streamer Lideri');
    const streamerResponsibility = interaction.guild?.roles.cache.find(r => r.name === '† Streamer Sorumlusu');

    if (!member.permissions.has(PermissionFlagsBits.Administrator) && !ertu.settings.founders.some(x => member.roles.cache.has(x)) && !member.roles.cache.has(ertu.settings.streamerRole) && !member.roles.cache.has(streamerController?.id) && !member.roles.cache.has(streamerLeader?.id) && !member.roles.cache.has(streamerResponsibility?.id)) {
        interaction.reply({ content: `Bu işlemi gerçekleştirmek için ${roleMention(ertu.settings.streamerRole)} rolüne sahip olmalısınız.`, ephemeral: true });
        return;
    }

    if (!member.voice.channelId) {
        interaction.reply({ content: 'Herhangi bir ses kanalında olmalısınız.', ephemeral: true });
        return;
    }

    const channel = member.voice.channel
    if (channel.parentId !== ertu.settings.streamerParent) {
        interaction.reply({ content: 'Streamer odalarında bulunmuyorsunuz.', ephemeral: true });
        return;
    }

    const hasAnotherOwner = ertu.streamerRooms.find((c) => c.channel === channel.id);
    const owneredChannel = ertu.streamerRooms.find(
        (room) => room.channel === channel.id && room.owner === interaction.user.id
    );

    if (route === 'owner') {
        if (!owneredChannel) {
            interaction.reply({
                content: 'Odanın sahibi sen değilsin.',
                ephemeral: true,
            });
            return;
        }

        if (channel.members.size < 2) {
            interaction.reply({
                content: 'Odanızda başka bir üye bulunmuyor.',
                ephemeral: true,
            });
            return;
        }

        const row = new ActionRowBuilder({
            components: [
                new UserSelectMenuBuilder({
                    customId: 'select',
                    placeholder: 'Yeni sahibi seçin',
                    max_values: 1,
                    min_values: 1
                })
            ]
        })

        await interaction.reply({
            content: 'Aşağıdan yeni sahibi seçin.',
            components: [row],
            ephemeral: true
        });

        const collector = interaction.channel.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 60000
        });

        collector.on('collect', async i => {
            if (i.customId === 'select') {
                const newOwner = i.values[0];
                const target = interaction.guild.members.cache.get(newOwner);
                if (!target) return;

                if (!target.voice.channel) {
                    i.reply({ content: 'Belirttiğin kişi herhangi bir ses kanalında bulunmuyor.', ephemeral: true });
                    return;
                }

                if (target.voice.channel.id !== channel.id) {
                    i.reply({ content: 'Belirttiğin kişi odada bulunmuyor.', ephemeral: true });
                    return;
                }

                if (!target.permissions.has(PermissionFlagsBits.Administrator) && !ertu.settings.founders.some(x => target.roles.cache.has(x)) && !target.roles.cache.has(ertu.settings.streamerRole) && !target.roles.cache.has(streamerController?.id) && !target.roles.cache.has(streamerLeader?.id) && !target.roles.cache.has(streamerResponsibility?.id)) {
                    i.reply({ content: `Belirttiğin kişide ${roleMention(ertu.settings.streamerRole)} rolü bulunmamaktadır.`, ephemeral: true });
                    return;
                }

                await SettingsModel.updateOne(
                    { id: interaction.guild.id },
                    { $set: { 'streamerRooms.$[elem].owner': newOwner } },
                    { arrayFilters: [{ 'elem.channel': channel.id }] }
                );

                channel.permissionOverwrites.cache.forEach(p => p.edit({ MuteMembers: false }));
                channel.permissionOverwrites.delete(interaction.user.id);
                channel.permissionOverwrites.create(target.id, { MuteMembers: true });

                i.reply({
                    content: `${channel} adlı odanın sahibi artık ${userMention(newOwner)} (${inlineCode(newOwner)})`,
                    ephemeral: true
                });
            }
        });
    }

    if (route === 'permission') {
        if (!owneredChannel) {
            interaction.reply({
                content: 'Odanın sahibi sen değilsin.',
                ephemeral: true,
            });
            return;
        }

        const row = new ActionRowBuilder({
            components: [
                new UserSelectMenuBuilder({
                    customId: 'select',
                    placeholder: 'Yayın izni verilecek kişiyi seçin',
                    max_values: 1,
                    min_values: 1
                })
            ]
        })

        await interaction.reply({
            content: 'Aşağıdan yayın izni verilecek kişiyi seçin.',
            components: [row],
            ephemeral: true
        });

        const collector = interaction.channel.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 60000
        });

        collector.on('collect', async i => {
            if (i.customId === 'select') {
                const newOwner = i.values[0];
                const target = interaction.guild.members.cache.get(newOwner);
                if (!target) return;
                if (target.id === interaction.user.id) {
                    i.reply({ content: 'Kendine yayın izni veremezsin.', ephemeral: true });
                    return;
                }

                if (!target.voice.channel) {
                    i.reply({ content: 'Belirttiğin kişi herhangi bir ses kanalında bulunmuyor.', ephemeral: true });
                    return;
                }

                if (target.voice.channel.id !== channel.id) {
                    i.reply({ content: 'Belirttiğin kişi odada bulunmuyor.', ephemeral: true });
                    return;
                }

                if (!target.permissions.has(PermissionFlagsBits.Administrator) && !ertu.settings.founders.some(x => target.roles.cache.has(x)) && !target.roles.cache.has(ertu.settings.streamerRole) && !target.roles.cache.has(streamerController?.id) && !target.roles.cache.has(streamerLeader?.id) && !target.roles.cache.has(streamerResponsibility?.id)) {
                    i.reply({ content: `Belirttiğin kişide ${roleMention(ertu.settings.streamerRole)} rolü bulunmamaktadır.`, ephemeral: true });
                    return;
                }

                const permission = channel.permissionOverwrites.cache.get(target.id);
                if (permission && permission.allow.has('Stream')) {
                    channel.permissionOverwrites.edit(target.id, { Stream: false });
                    i.reply({ content: `${userMention(newOwner)} (${inlineCode(newOwner)}) adlı kullanıcının yayın yapma izni kaldırıldı.`, ephemeral: true });
                } else {
                    channel.permissionOverwrites.edit(target.id, { Stream: true });
                    i.reply({ content: `${userMention(newOwner)} (${inlineCode(newOwner)}) adlı kullanıcıya yayın yapma izni verildi.`, ephemeral: true });
                }
            }
        });
    }

    if (route === 'info') {
        if (!hasAnotherOwner) {
            interaction.reply({
                content: 'Bu oda için herhangi bir kayıt bulunmamaktadır.',
                ephemeral: true,
            });
            return;
        }

        const owner = interaction.guild.members.cache.get(hasAnotherOwner.owner);
        if (!owner) {
            interaction.reply({
                content: 'Odanın sahibi bulunamadı.',
                ephemeral: true,
            });
            return;
        }
        interaction.reply({
            content: `Oda sahibi: ${userMention(owner.id)} (${inlineCode(owner.id)})\nOda adı: ${channel.name}\nOda ID: ${inlineCode(channel.id)}`,
            ephemeral: true,
        });
    }
}