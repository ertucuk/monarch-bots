const { ActionRowBuilder, StringSelectMenuBuilder, bold, ComponentType, ChannelType } = require("discord.js");
const { SettingsModel } = require('../../../../../Global/Settings/Schemas');

module.exports = async function Meeting(client, interaction, value, ertu) {
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) return interaction.deferUpdate();

    if (value === 'start') {
        const msg = await interaction.reply({
            content: 'Toplantı oluşturmak istediğiniz alanı seçin.',
            ephemeral: true,
            components: createRow(client, interaction.guild, ertu.settings.staffResponsibilities),
            fetchReply: true
        });

        const filter = (i) => i.user.id === interaction.user.id;
        const collector = msg.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 10,
            componentType: ComponentType.StringSelect
        });

        collector.on('collect', async (i) => {
            await i.deferUpdate();

            const role = i.guild.roles.cache.get(i.values[0]);

            const meetingParent = i.guild.channels.cache.get(ertu.settings.meetingParent);
            if (!meetingParent) {
                return i.editReply({
                    content: 'Toplantı oluşturulacak alan bulunamadı.',
                    components: []
                });
            }

            await i.editReply({
                content: `${role} toplantısı oluşturuluyor...`,
                components: []
            });

            const channel = await i.guild.channels.create({
                name: `${role.name.replace('Sorumlusu', 'Toplantısı')}`,
                type: ChannelType.GuildVoice,
                parent: meetingParent.id
            });

            const perms = meetingParent?.permissionOverwrites.cache.map((perm) => ({
                id: perm.id,
                allow: BigInt(perm.allow),
                deny: BigInt(perm.deny),
            }));

            await channel.permissionOverwrites.set([...perms])

            await SettingsModel.updateOne(
                { id: i.guild.id },
                {
                    $push: {
                        meetings: {
                            channel: channel.id,
                            reason: `${role.name.replace('Sorumlusu', 'Toplantısı')}`,
                            date: Date.now(),
                            members: []
                        }
                    }
                },
                { upsert: true }
            )
        });
    }

    if (value === 'end') {
        if (!member.voice.channel) return interaction.reply({ content: 'Bir ses kanalında değilsiniz.', ephemeral: true });

        const document = ertu.meetings.find((c) => c.channel === member.voice.channel.id);
        if (!document) return interaction.reply({ content: 'Şu an bir toplantıda değilsiniz.', ephemeral: true });

        const channel = interaction.guild.channels.cache.get(document.channel);
        if (!channel) return interaction.reply({ content: 'Toplantı kanalı bulunamadı.', ephemeral: true });

        await interaction.reply({
            content: `${document.reason} toplantısı sona erdiriliyor...`,
            ephemeral: true,
            components: []
        });

        const voiceMembers = [...member.voice.channel.members.values()];
        const meetingRole = interaction.guild.roles.cache.get(ertu.settings.meetingRole);
        if (!meetingRole) return interaction.reply({ content: 'Toplantı rolü bulunamadı.', ephemeral: true });

        await SettingsModel.updateOne(
            { id: interaction.guild.id, 'meetings.channel': member.voice.channel.id },
            {
                $set: {
                    'meetings.$.members': voiceMembers.map((m) => m.id),
                }
            }
        );

        for (const member of meetingRole.members.values()) {
            await member.roles.remove(meetingRole);
        }

        for (const m of voiceMembers) {
            await client.staff.checkRank(client, m, ertu, { type: 'MEETING', amount: 1 });
            await m.roles.add(ertu.settings.meetingRole);
        }

        const publicCategory = interaction.guild.channels.cache.filter((c) => c.parentId === ertu.settings.publicParent && c.type === ChannelType.GuildVoice);
        [...interaction.member.voice.channel.members.values()]
            .filter((m) => m.voice.channelId === interaction.member.voice.channelId)
            .forEach((m) => m.voice.setChannel(publicCategory.random().id));

        setTimeout(async () => {
            await channel.delete();
        }, 10000);
    }

    if (value === 'start-private') {
        return interaction.reply({
            content: 'Bu özellik canımın istediği zaman yapıcam',
            ephemeral: true
        })
    }

    if (value === 'end-private') {
        return interaction.reply({
            content: 'Bu özellik canımın istediği zaman yapıcam',
            ephemeral: true
        })
    }
};

function createRow(client, guild, data) {
    const responsibilitys = data.filter((r) => guild.roles.cache.has(r));
    const chunks = client.functions.chunkArray(responsibilitys, 25);
    
    const rows = [];
    let page = 0;
    
    for (const chunk of chunks) {
        page++;
        
        if (page === 3) break;
        rows.push(
            new ActionRowBuilder({
                components: [
                    new StringSelectMenuBuilder({
                        customId: 'responsibility-panel:' + page,
                        placeholder: 'Toplantı oluşturmak için bir alan seçin.',
                        options: chunk.map((r) => {
                            const role = guild.roles.cache.get(r);
                            return {
                                label: `${role?.name.replace('Sorumlusu', 'Toplantı')}`,
                                description: `Sunucunun ${role?.name.replace('Sorumlusu', 'Toplantı')} kanalını oluşturmak için tıklayın.`,
                                value: role?.id,
                            };
                        })
                    })
                ]
            })
        );
    }
    
    return rows;
}