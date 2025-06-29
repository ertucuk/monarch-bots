const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, ModalBuilder, RoleSelectMenuBuilder, StringSelectMenuBuilder, AttachmentBuilder, TextInputBuilder, TextInputStyle, bold, codeBlock, roleMention } = require('discord.js')
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

module.exports = {
    Name: 'ekip',
    Aliases: ['team'],
    Description: 'Sunucudaki ekip sistemini yönetir.',
    Usage: 'ekip',
    Category: 'Founder',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu) => {
        const teams = (ertu.teams || []).filter((t) => message.guild?.roles.cache.has(t.role));

        const row = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    custom_id: 'create-team',
                    label: 'Ekip Oluştur',
                    style: ButtonStyle.Success,
                }),
                new ButtonBuilder({
                    custom_id: 'team-list',
                    label: 'Ekip Listesi',
                    style: ButtonStyle.Success,
                }),
                new ButtonBuilder({
                    custom_id: 'team-ranking',
                    label: 'Ekip Sıralama',
                    style: ButtonStyle.Success,
                }),
            ],
        });

        const question = await message.channel.send({
            content: `Aşağı taraftan yapacağın işlemi seç.`,
            components: [row],
        });

        const filter = (i) => i.user.id === message.author.id;
        const collector = await question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 2,
            componentType: ComponentType.Button,
        })

        collector.on('collect', async (i) => {
            if (i.customId === 'create-team') {
                if (teams.length === 25) {
                    i.reply({
                        content: 'Ekip mi alıyorsunuz kurbanlık danaya mı giriyorsunuz bi siktirin gidin mk.',
                        ephemeral: true,
                    });
                    return;
                }

                const rowOne = new ActionRowBuilder({
                    components: [
                        new TextInputBuilder({
                            custom_id: 'name',
                            label: 'Ekip Adı',
                            min_length: 4,
                            placeholder: '1337',
                            style: TextInputStyle.Short,
                        }),
                    ],
                });

                const rowTwo = new ActionRowBuilder({
                    components: [
                        new TextInputBuilder({
                            custom_id: 'owners',
                            label: 'Ekip Sahipleri',
                            min_length: 4,
                            placeholder: '1205649213539749958, 1205649213539749958',
                            style: TextInputStyle.Paragraph,
                        }),
                    ],
                });

                const rowThree = new ActionRowBuilder({
                    components: [
                        new TextInputBuilder({
                            custom_id: 'tags',
                            label: 'Ekip Tagları',
                            min_length: 1,
                            placeholder: 'a, b, c',
                            style: TextInputStyle.Paragraph,
                        }),
                    ],
                });

                const modal = new ModalBuilder({
                    custom_id: 'team-modal',
                    title: 'Yeni Ekip Ekle',
                    components: [rowOne, rowTwo, rowThree],
                });
                await i.showModal(modal);

                const modalCollected = await i.awaitModalSubmit({
                    filter: (i) => i.user.id === message.author.id,
                    time: 1000 * 60 * 5,
                });
                if (modalCollected) {
                    const teamName = modalCollected.fields.getTextInputValue('name');
                    const hasTeam = teams.find((team) => team.name === teamName.toLowerCase());
                    if (hasTeam) {
                        modalCollected.reply({
                            content: `${await client.getEmoji('mark')} Belirttiğin isime sahip ekip zaten mevcut.`,
                            ephemeral: true,
                        });
                        return;
                    }

                    const teamTags = modalCollected.fields
                        .getTextInputValue('tags')
                        .trim()
                        .split(',')
                        .map((t) => t.toLowerCase());
                    const hasTag = teams.find((team) => team.tags.some((t) => teamTags.includes(t.toLowerCase())));
                    if (hasTag) {
                        modalCollected.reply({
                            content: `${await client.getEmoji('mark')} Belirttiğin taga sahip ekip zaten mevcut.`,
                            ephemeral: true,
                        });
                        return;
                    }

                    const teamOwners = modalCollected.fields
                        .getTextInputValue('owners')
                        .trim()
                        .split(',')
                        .filter((o) => modalCollected.guild?.members.cache.get(o));
                    if (!teamOwners.length) {
                        modalCollected.reply({
                            content: `${await client.getEmoji('mark')} Belirttiğin kurucular sunucuda bulunmuyor veya öyle bir hesap yok.`,
                            ephemeral: true,
                        });
                        return;
                    }

                    const roleSelect = new ActionRowBuilder({
                        components: [
                            new RoleSelectMenuBuilder({
                                custom_id: 'role',
                                placeholder: 'Rol ara...',
                            }),
                        ],
                    });

                    await modalCollected.reply({
                        content: `${bold(client.functions.titleCase(teamName))} adlı ekibin rolünü seç.`,
                        ephemeral: true,
                        components: [roleSelect],
                    });

                    const roleQuestion = await modalCollected.fetchReply();
                    const roleCollected = await roleQuestion.awaitMessageComponent({
                        time: 1000 * 60 * 3,
                        componentType: ComponentType.RoleSelect,
                    });
                    if (roleCollected) {
                        const hasTeam = teams.find((team) => team.role === roleCollected.values[0]);
                        if (hasTeam) {
                            roleCollected.reply({
                                content: `${await client.getEmoji('mark')} Belirttiğin role sahip ekip zaten mevcut.`,
                                ephemeral: true,
                            });
                            return;
                        }

                        ertu.teams = [
                            ...teams,
                            { name: teamName, owners: teamOwners, role: roleCollected.values[0], tags: teamTags },
                        ];
                        question.edit({ content: `${await client.getEmoji('check')} Başarıyla ${bold(client.functions.titleCase(teamName))} (${roleMention(roleCollected.values[0])}) ekibi eklendi.`, components: [] });
                        roleCollected.deleteReply().catch(() => { });
                        modalCollected.deleteReply().catch(() => { });

                        await message.guild?.updateSettings({
                            teams: ertu.teams,
                        });
                    } else {
                        modalCollected.deleteReply();
                    }
                }
            }

            if (i.customId === 'team-list') {
                i.deferUpdate();
                collector.stop('FINISH');

                const members = await message.guild?.members.fetch();
                const teams = (ertu.teams || []).filter((t) => message.guild?.roles.cache.has(t.role));
                if (!teams.length) {
                    return question.edit({ content: 'Sunucuda ekip bulunmuyor.', components: [] });
                };

                const oldRow = new ActionRowBuilder({
                    components: [
                        new StringSelectMenuBuilder({
                            custom_id: 'list',
                            placeholder: `Ekip seçilmemiş (${teams.length} ekip)`,
                            disabled: !teams.length,
                            options: teams.length
                                ? teams.map((team) => ({
                                    label: `${client.functions.titleCase(team.name)} (${members?.filter((m) => m.roles.cache.has(team.role)).size} üye)`,
                                    value: team.name.toLowerCase(),
                                }))
                                : [{ label: 'a', value: 'b' }],
                        }),
                    ],
                });

                await question.edit({
                    content: `Aşağı menüden bakacağınız ekibi seçin.`,
                    components: [oldRow],
                });

                const filter = (i) => i.user.id === message.author.id;
                const collector2 = await question.createMessageComponentCollector({
                    filter,
                    time: 1000 * 60 * 5,
                })

                collector2.on('collect', async (i) => {
                    if (!i.isAnySelectMenu()) return;
                    i.deferUpdate();

                    const team = ertu.teams.find((team) => team.name.toLowerCase() === i.values[0]);

                    const minStaffRole = message.guild?.roles.cache.get(ertu.settings.minStaffRole);
                    if (!minStaffRole) return message.channel.send(`${await client.getEmoji('mark')} En alt yetkili rolü ayarlanmamış.`);

                    const row = new ActionRowBuilder({
                        components: [
                            new ButtonBuilder({
                                custom_id: 'remove',
                                label: 'Ekip Sil',
                                style: ButtonStyle.Danger,
                            }),
                        ],
                    });

                    const teamMembers = members?.filter((m) => m.roles.cache.has(team.role));
                    const teamOwners = team.owners.filter((o) => members?.get(o));
                    const ownerID = message.author.id;

                    oldRow?.components[0]?.options?.find((o) => o.data.value === team.name.toLowerCase())?.setDefault(true);

                    const question2 = await question.edit({
                        content: '',
                        embeds: [
                            new EmbedBuilder({
                                color: client.getColor('random'),
                                description: codeBlock(
                                    'yaml',
                                    [
                                        `# ${client.functions.titleCase(team.name)}`,
                                        `→ ${teamOwners.length ? 'Kurucu' : 'Kurucular'}: ${teamOwners.map((o) => message.guild?.members.cache.get(o)?.user?.username).join(', ')}`,
                                        `→ Ekip Taglı Üye Sayısı: ${teamMembers.size}`,
                                        `→ Sunucu Taglı Üye Sayısı: ${teamMembers.filter((m) => ertu.settings.tag.includes(m.user.displayName)).size}`,
                                        `→ Yetkili Sayısı: ${teamMembers.filter((m) => m.roles.highest.position >= minStaffRole.position).size}`,
                                        `→ Seste Olan Üye Sayısı: ${teamMembers.filter((m) => m.voice.channelId).size}`,
                                    ].join('\n'),
                                ),
                            }),
                        ],
                        components: message.author.id === ownerID ? [oldRow, row] : [oldRow],
                    });

                    const filter = (i) => i.user.id === message.author.id;
                    const collector3 = await question.createMessageComponentCollector({
                        filter,
                        time: 1000 * 60 * 2,
                    })

                    collector3.on('collect', async (i) => {
                        i.reply({
                            content: `${await client.getEmoji('check')} Başarıyla ekip silindi.`,
                            ephemeral: true,
                        });

                        question2.edit({ components: [] });
                        ertu.teams = ertu.teams.filter((t) => t.name !== team.name);

                        await message.guild?.updateSettings({
                            teams: ertu.teams,
                        });
                    });

                    collector3.on('end', (_, reason) => {
                        if (reason === 'time') {
                            question2.delete().catch(() => { });
                        }
                    });
                });

                collector2.on('end', (_, reason) => {
                    if (reason === 'time') {
                        question.delete().catch(() => { });
                    }
                });
            }

            if (i.customId === 'team-ranking') {
                i.deferUpdate();
                collector.stop('FINISH');

                const members = await message.guild?.members.fetch();
                const teams = (ertu.teams || []).filter((t) => message.guild?.roles.cache.has(t.role));
                if (!teams.length) {
                    return question.edit({ content: 'Sunucuda ekip bulunmuyor.', components: [] });
                }

                const minStaffRole = message.guild?.roles.cache.get(ertu.settings.minStaffRole);
                if (!minStaffRole) return message.channel.send(`${await client.getEmoji('mark')} En alt yetkili rolü ayarlanmamış.`);

                const teamStats = teams.map(team => {
                    const teamMembers = members?.filter((m) => m.roles.cache.has(team.role));
                    return {
                        name: client.functions.titleCase(team.name),
                        totalMembers: teamMembers.size,
                        taggedMembers: teamMembers.filter((m) => ertu.settings.tag.includes(m.user.displayName)).size,
                        staffMembers: teamMembers.filter((m) => m.roles.highest.position >= minStaffRole.position).size,
                        voiceMembers: teamMembers.filter((m) => m.voice.channelId).size,
                    };
                });

                teamStats.sort((a, b) => b.voiceMembers - a.voiceMembers);

                const buffer = await createChart(client, teamStats);
                const attachment = new AttachmentBuilder(buffer, { name: 'ertu-teams.png' });

                const embed = new EmbedBuilder({
                    color: client.getColor('random'),
                    title: 'Ekip Ses Aktivite Sıralaması',
                    image: { url: 'attachment://ertu-teams.png' },
                    description: teamStats.map((team, index) =>
                        `${index + 1}. ${team.name}\n` +
                        `→ Seste Bulunan Üye: ${team.voiceMembers}\n` +
                        `→ Toplam Üye: ${team.totalMembers}\n` +
                        `→ Taglı Üye: ${team.taggedMembers}\n` +
                        `→ Yetkili: ${team.staffMembers}\n`
                    ).join('\n')
                });

                question.edit({
                    content: null,
                    embeds: [embed],
                    files: [attachment],
                    components: []
                });
            }
        })

        collector.on('end', (_, reason) => {
            if (reason === 'time') {
                question.delete().catch(() => { });
            }
        });
    },
};

async function createChart(client, teamStats) {
    const width = 800;
    const height = 400;
    const canvas = new ChartJSNodeCanvas({ width, height });

    const color = [
        '#3498db',
        '#2ecc71',
        '#e74c3c', 
        '#f39c12', 
        '#9b59b6', 
        '#1abc9c', 
        '#34495e'  
    ];

    const config = {
        type: 'bar',
        data: {
            labels: teamStats.map(t => t.name),
            datasets: [{
                label: 'Ekip Ses Aktivitesi',
                data: teamStats.map(t => t.voiceMembers),
                backgroundColor: teamStats.map((_, index) => 
                    color[index % color.length]
                ),
                borderColor: teamStats.map((_, index) => 
                    color[index % color.length].replace('0.7', '1')
                ),
                borderWidth: 1.5,
                borderRadius: 5,
                barPercentage: 0.7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Seste Bulunan Üye Sayısı'
                    },
                    ticks: {
                        precision: 0,
                        stepSize: 1
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Ekip Adları'
                    },
                    ticks: {
                        maxRotation: 45,
                        autoSkip: false
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Ekip Ses Aktivite Raporu',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    titleColor: 'white',
                    bodyColor: 'lightgray'
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    };

    return await canvas.renderToBuffer(config);
}