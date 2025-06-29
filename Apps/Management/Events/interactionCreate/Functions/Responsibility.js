const { ActionRowBuilder, ButtonBuilder, ButtonStyle, inlineCode, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { SettingsModel } = require('../../../../../Global/Settings/Schemas');

module.exports = async function Responsibility(client, interaction, route, ertu) {
    const member = interaction.guild?.members.cache.get(interaction.user.id)
    if (!member) return;


    if (!isNaN(Number(route))) {
        const { currentRank } = client.staff.getRank(member, ertu);
        if (!currentRank) return interaction.reply({ content: `${await client.getEmoji('mark')} Bu komutu kullanabilmek için yetkili olmalısınız.`, ephemeral: true });

        const document = await SettingsModel.findOne({ id: interaction.guild.id, responsibilityApplications: { $elemMatch: { user: member.user.id } } });
        if (document) {
            const userApplications = document.responsibilityApplications.filter(x => x.user === member.user.id);

            const alreadyApplied = userApplications.some(x =>
                x.responsibility.some(res =>
                    interaction.values.some(val =>
                        interaction.guild?.roles.cache.get(val)?.name === res
                    )
                )
            );

            if (alreadyApplied) {
                return interaction.reply({ content: `${await client.getEmoji('mark')} Zaten bu sorumluluğa başvurdunuz.`, ephemeral: true });
            }
        }

        let maximumSelect = 0;

        if (currentRank?.type === 'sub') maximumSelect = 2
        if (currentRank?.type === 'middle') maximumSelect = 3
        if (currentRank?.type === 'top') maximumSelect = 3

        const currentStaffResponsibilityRoles = member.roles.cache.filter(role =>
            ertu.settings.staffResponsibilities.includes(role.id)
        );

        if (currentStaffResponsibilityRoles.size >= maximumSelect) {
            return interaction.reply({
                content: `${await client.getEmoji('mark')} Lütfen en fazla ${maximumSelect} adet sorumluluk seçebilirsiniz.`,
                ephemeral: true
            });
        };

        const role = interaction.values.map((v) => interaction.guild?.roles.cache.get(v));
        if (member.roles.cache.has(role[0]?.id)) return interaction.reply({ content: `${await client.getEmoji('mark')} Zaten bu sorumluluğa sahipsiniz.`, ephemeral: true });
        const roleName = role[0]?.name.split(' ')[1];

        let controller = ''
        let leader = ''

        if (roleName === 'Yetkili') {
            controller = interaction.guild?.roles.cache.find(r => r.name.includes('Yetkili Alım Denetleyici'));
            leader = interaction.guild?.roles.cache.find(r => r.name.includes('Yetkili Alım Lideri'));
        } else if (roleName === 'Rol') {
            controller = interaction.guild?.roles.cache.find(r => r.name.includes('Rol Denetim Denetleyici'));
            leader = interaction.guild?.roles.cache.find(r => r.name.includes('Rol Denetim Lideri'));
        } else {
            controller = interaction.guild?.roles.cache.find(r => r.name.includes(`${roleName} Denetleyici`));
            leader = interaction.guild?.roles.cache.find(r => r.name.includes(`${roleName} Lideri`));
        }

        const row = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    custom_id: 'responsibility:care',
                    label: 'İlgilen',
                    style: ButtonStyle.Primary,
                }),
            ]
        });

        const logChannel = await client.getChannel(client.data.logs.responsibilites, interaction)
        if (!logChannel) return;

        const msg = await logChannel.send({
            content: `${controller || ''} ${leader || ''}`,
            components: [row],
            flags: [4096],
            embeds: [
                new EmbedBuilder({
                    color: client.getColor('random'),
                    title: `${interaction.values.map((v) => interaction.guild?.roles.cache.get(v)?.name)} Başvurusu`,
                    description: [
                        `→ Kullanıcı: ${member?.user} (${inlineCode(member?.user.id)})`,
                        `→ Mevcut Yetki: ${interaction.guild?.roles.cache.get(currentRank?.role || 'Ertu') || 'Bulunamadı'}`,
                        `→ Sunucuya Katılım: ${client.functions.date(member?.joinedTimestamp || 0)}`,
                        `→ Tarih: ${client.functions.date(Date.now())}`,
                        '',
                        'Seçilen Sorumluluk:',
                        interaction.values.map((v) => `→ ${interaction.guild?.roles.cache.get(v)}`).join('\n'),
                    ].join('\n'),
                })
            ]
        });

        await SettingsModel.updateOne(
            { id: interaction.guild.id },
            {
                $push: {
                    responsibilityApplications: {
                        messageId: msg.id,
                        user: member.user.id,
                        responsibility: interaction.values.map((v) => interaction.guild?.roles.cache.get(v)?.name),
                        date: Date.now(),
                    }
                }
            },
            { upsert: true }
        )

        return interaction.reply({
            content: `${await client.getEmoji('check')} Sorumluluk başvurunuz alınmıştır. Yetkililer tarafından incelenecektir.`,
            ephemeral: true
        });
    }

    if (route === 'care') {
        const admin = interaction.guild?.members.cache.get(interaction.user.id)

        const message = interaction.message;
        if (!message) return interaction.deferUpdate().catch(() => { });

        const document = await SettingsModel.findOne({
            id: interaction.guild.id,
            'responsibilityApplications.messageId': message.id
        });

        if (!document) return interaction.reply({ content: `${await client.getEmoji('mark')} Bu başvuru bulunamadı.`, ephemeral: true });

        const data = document.responsibilityApplications.find(x => x.messageId === message.id);
        const roleName = data.responsibility[0].split(' ')[1];
        const controller = interaction.guild?.roles.cache.find(r => r.name.includes(`${roleName} Denetleyici`));
        const leader = interaction.guild?.roles.cache.find(r => r.name.includes(`${roleName} Lideri`));

        if (!admin?.permissions.has(PermissionsBitField.Flags.Administrator) && !ertu.settings.founders.some(x => admin.roles.cache.has(x)) && !admin.roles.cache.has(controller?.id) && !admin.roles.cache.has(leader?.id)) return interaction.deferUpdate().catch(() => { });

        message.edit({
            components: [
                new ActionRowBuilder({
                    components: [
                        new ButtonBuilder({
                            custom_id: 'responsibility:care',
                            label: `${interaction.user.username} İlgileniyor`,
                            style: ButtonStyle.Success,
                            disabled: true
                        }),
                    ]
                })
            ]
        });

        const user = interaction.guild?.members.cache.get(data.user);
        if (!user) return interaction.reply({ content: `${await client.getEmoji('mark')} Bu kullanıcı bulunamadı.`, ephemeral: true });

        const responsibilityName = data.responsibility.join(', ');

        user.send({
            content: `Selam ${user}! \n\n${interaction.user} adlı yetkili ${responsibilityName} sorumluluğu için seninle DM üzerinden iletişime geçicektir.\n\n**Sevgiler, Monarch Ekibi 💖**`
        })

        await SettingsModel.updateOne(
            { id: interaction.guild.id },
            {
                $pull: {
                    responsibilityApplications: {
                        messageId: message.id,
                    }
                }
            },
            { upsert: true }
        );

        interaction.reply({
            content: `${await client.getEmoji('check')} Sorumluluk başvurusu başarıyla onaylandı.`,
            ephemeral: true
        });
    }
}