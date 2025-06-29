const { EmbedBuilder, spoiler, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { SettingsModel, UserModel } = require('../../../../../Global/Settings/Schemas');
const ms = require('ms');
const moment = require('moment');
moment.locale("tr");

module.exports = async function Solver(client, interaction, route, ertu) {

    const member = interaction.guild?.members.cache.get(interaction.user.id)
    if (!member) return;

    if (route === 'request') {

        if (!member.voice.channel) return interaction.reply({ content: 'Lütfen sorun çözme odasına katılın.', ephemeral: true });
        if (member.voice.channel.parentId !== ertu.settings.problemSolveParent) return interaction.reply({ content: 'Lütfen sorun çözme odasına katılın.', ephemeral: true });

        const solverChannel = interaction.guild.channels.cache.find((x) => x.name === 'sorun-çözme-çağrısı');
        if (!solverChannel) return interaction.reply({ content: 'Sorun çözme kanalı bulunamadı.', ephemeral: true });

        const limit = client.functions.checkLimit(interaction, interaction.user.id, 'Solver', 1, ms('1h'));
        if (limit.hasLimit) return interaction.reply({ content: `Bu butonu ${limit.time} kullanabilirsin.`, ephemeral: true });

        interaction.reply({ content: 'Başarıyla sorun çözücü çağırdın.', ephemeral: true });

        solverChannel.send({
            content: `${spoiler(ertu.settings.solvingStaffs.map(x => `<@&${x}>`).join(', '))}`,
            embeds: [
                new EmbedBuilder({
                    color: client.getColor('random'),
                    title: 'Yeni Sorun Çözme Çağrısı!',
                    description: `${member} tarafından sorun çözme çağrısı yapıldı. Lütfen bir sorun çözücü atanarak ilgilenin.`,
                })
            ],
            components: [
                new ActionRowBuilder({
                    components: [
                        new ButtonBuilder({
                            custom_id: 'solver:care',
                            label: 'İlgileniyorum',
                            style: ButtonStyle.Secondary
                        })
                    ]
                })
            ]
        })
    }

    if (route === 'care') {
        const message = interaction.channel.messages.cache.get(interaction.message.id);
        if (!message) return;

        member.send({ content: `Sorun Çözmeniz ile ${interaction.user} ilgileniyor. Yakında size dönüş yapılacaktır.` }).catch(() => null);
        message.edit({
            content: `${interaction.user} tarafından ilgileniliyor.`,
            components: message.components.map(row =>
                new ActionRowBuilder().addComponents(
                    row.components.map(component => {
                        if (component.type === 2) {
                            return new ButtonBuilder().setCustomId('solver:care').setLabel(`${interaction.user.username} İlgileniyor`).setStyle(ButtonStyle.Success).setDisabled(true);
                        }
                        return component;
                    })
                )
            )
        });

        interaction.reply({ content: 'İşlem başarılı!', ephemeral: true });
    }

    if (route === 'start') {
        if (!member.voice.channel || member.voice.channel.parentId !== ertu.settings.problemSolveParent) return interaction.reply({ content: 'Lütfen sorun çözme odasına katılın.', ephemeral: true });
        if (!ertu.settings.solvingStaffs.some(x => member.roles.cache.has(x))) return interaction.reply({ content: 'Bu butonu sadece sorun çözücü rolüne sahip kişiler kullanabilir.', ephemeral: true });

        const users = interaction.guild.members.cache.filter(x => x.voice.channel && x.voice.channel.id == interaction.member.voice.channel.id).map(x => x.id);
        if (!users.includes(interaction.user.id)) return interaction.reply({ content: 'Lütfen sorun çözme odasına katılın.', ephemeral: true });
        if (users.length < 2) return interaction.reply({ content: 'Sorun çözme odasında en az 2 kişi olmalısınız.', ephemeral: true });

		const document = (ertu.solvers || []).find(x => x.id === interaction.user.id && x.active === true);
        if (document) return interaction.reply({ content: 'Hala devam eden bir çözülecek sorununuz bulunmakta, lütfen önce onu bitirin.', ephemeral: true });

        const logChannel = await client.getChannel(client.data.logs.solver, interaction)
        if (!logChannel) return interaction.reply({ content: 'Sorun çözme rapor kanalı bulunamadı.', ephemeral: true });

        const embed = new EmbedBuilder({
            color: client.getColor('random'),
            author: { name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) },
            thumbnail: { url: interaction.guild.iconURL({ dynamic: true }) },
            title: 'Sorun Çözme Başlatıldı',
            description: [
                `→ Sorun Çözücü: ${interaction.user} (\`${interaction.user.id}\`)`,
                `→ Sorunu Olan Üyeler: ${users.filter(x => x !== interaction.user.id).map(x => `<@${x}>`).join(', ')}`,
                `→ Başlangıç: ${moment(Date.now()).locale('tr').format('LLL')}`
            ].join('\n')
        })

        const message = await logChannel.send({
            embeds: [embed]
        });

        message.guild?.updateSettings({
            $push: {
                solvers: {
                    id: interaction.user.id,
                    startedAt: Date.now(),
                    endedAt: null,
                    members: users,
                    messageId: message.id,
                    active: true,
                    problem: null,
                    solution: null
                }
            }
        });

        interaction.reply({ content: 'Sorun çözme işlemi başarıyla başlatıldı.', ephemeral: true });
    }

    if (route === 'end') {

        const document = (ertu.solvers || []).find(x => x.id === interaction.user.id && x.active === true);
        if (!document) return interaction.reply({ content: 'Aktif bir sorun çözme işleminiz bulunmamaktadır.', ephemeral: true });

        const logChannel = await client.getChannel(client.data.logs.solver, interaction)
        if (!logChannel) return interaction.reply({ content: 'Sorun çözme rapor kanalı bulunamadı.', ephemeral: true });

        const message = await logChannel.messages.fetch(document.messageId).catch(() => null);
        if (!message) return interaction.reply({ content: 'Sorun çözme raporu bulunamadı.', ephemeral: true });

        message.edit({
            embeds: [
                new EmbedBuilder({
                    color: client.getColor('random'),
                    thumbnail: { url: interaction.guild.iconURL({ dynamic: true }) },
                    title: 'Sorun Çözme İşlemi Sonlandırıldı',
                    description: [
                        `→ Sorun Çözücü: ${interaction.user} (\`${interaction.user.id}\`)`,
                        `→ Sorunu Olan Üyeler: ${document.members.filter(x => x !== interaction.user.id).map(x => `<@${x}>`).join(', ')}`,
                        `→ Başlangıç: ${moment(document.startedAt).locale('tr').format('LLL')}`,
                        `→ Bitiş: ${moment(Date.now()).locale('tr').format('LLL')}`,
                    ].join('\n')
                })
            ],
            components: [
                new ActionRowBuilder({
                    components: [
                        new ButtonBuilder({
                            custom_id: 'solver:formButton',
                            label: 'Sorun Çözme Bitirme Formu',
                            style: ButtonStyle.Secondary
                        })
                    ]
                })
            ]
        })
         
        await SettingsModel.updateOne(
            { 
                id: member.guild.id,
                'solvers.id': interaction.user.id,
            },
            {
                $set: {
                    'solvers.$.endedAt': Date.now(),
                }
            }

        );

        interaction.reply({ content: 'Sorun çözme işlemi başarıyla sonlandırıldı.', ephemeral: true });
    }

    if (route === 'formButton') {
        const document = (ertu.solvers || []).find(x => x.id === interaction.user.id && x.active === true);
        if (!document) return interaction.reply({ content: 'Aktif bir sorun çözme işleminiz bulunmamaktadır.', ephemeral: true });
        if (document.id != interaction.user.id && !ertu.settings.solvingStaffs.some(x => member.roles.cache.has(x))) return interaction.reply({ content: 'Bu formu sadece başlatan kişi doldurabilir!', ephemeral: true })

        const row = new ModalBuilder()
            .setTitle('Sorun Çözme Bitirme Forumu')
            .setCustomId('solverForm')
            .setComponents(
                new ActionRowBuilder().setComponents(new TextInputBuilder().setCustomId('problem').setLabel('Problem').setStyle(TextInputStyle.Paragraph).setRequired(true)),
                new ActionRowBuilder().setComponents(new TextInputBuilder().setCustomId('solution').setLabel('Çözüm').setStyle(TextInputStyle.Paragraph).setRequired(true))
            );

        interaction.showModal(row)

        const modalCollected = await interaction.awaitModalSubmit({ time: 1000 * 60 * 2 });
        const problem = modalCollected.fields.getTextInputValue('problem');
        const solution = modalCollected.fields.getTextInputValue('solution');
        if (modalCollected) {
            const logChannel = await client.getChannel(client.data.logs.solver, interaction)
            if (!logChannel) return;

            const embed = new EmbedBuilder({
                color: client.getColor('random'),
                thumbnail: { url: interaction.guild.iconURL({ dynamic: true }) },
                title: 'Sorun Çözme Raporu',
                description: [
                    `→ Sorun Çözücü: ${interaction.user} (\`${interaction.user.id}\`)`,
                    `→ Sorunu Olan Üyeler: ${document.members.filter(x => x !== interaction.user.id).map(x => `<@${x}>`).join(', ')}`,
                    `→ Başlangıç: ${moment(document.startedAt).locale('tr').format('LLL')}`,
                    `→ Bitiş: ${moment(Date.now()).locale('tr').format('LLL')}`,
                    `→ Problem: ${problem}`,
                    `→ Çözüm: ${solution}`
                ].join('\n')
            });

            await client.staff.checkRank(client, interaction.user, ertu, { type: 'SOLVER', amount: 1, user: member.id });

            const message = document.messageId ? await logChannel.messages.fetch(document.messageId).catch(() => null) : null;
            if (message) {
                message.edit({
                    embeds: [embed],
                    components: []
                });
            }

            await SettingsModel.updateOne(
                { 
                    id: member.guild.id,
                    'solvers.messageId': document.messageId,
                },
                {
                    $set: {
                        'solvers.$.active': false,
                        'solvers.$.problem': problem,
                        'solvers.$.solution': solution,
                    }
                }
            );

            await UserModel.updateOne(
                { id: interaction.user.id },
                {
                    $push: {
                        solversData: {
                            problem,
                            solution,
                            startedAt: document.startedAt,
                            endedAt: Date.now(),
                            members: document.members
                        }
                    }
                }
            );

            modalCollected.reply({ content: 'Sorun çözme formu başarıyla gönderildi.', ephemeral: true });
        }
    }
}