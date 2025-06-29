const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, RoleSelectMenuBuilder, roleMention, TextInputBuilder, ModalBuilder, TextInputStyle, EmbedBuilder } = require('discord.js');
const { SettingsModel } = require('../../../../../../Global/Settings/Schemas')
const ms = require('ms');

module.exports = async function Staff(client, message, option, ertu, question, author, menu = 'main', functionType) {
    await question.edit({
        content: option.description,
        components: createRow(client, message.guild, ertu?.staffRanks || []),
    });

    const filter = (i) => i.user.id === author;
    const collector = question.createMessageComponentCollector({
        filter,
        time: 1000 * 60 * 10,
    });

    collector.on('collect', async (i) => {
        if (i.isButton() && i.customId === 'back') {
            i.deferUpdate();
            collector.stop('FINISH');
            functionType(client, message, question, menu);
            return;
        };

        if (i.isRoleSelectMenu()) {
            if (i.customId === 'roleAdd') {
                const rankRoleId = i.values[0];

                if (ertu.staffRanks?.some((r) => r.role === rankRoleId)) {
                    return i.reply({
                        content: `${await client.getEmoji('mark')} Bu rol zaten ekli!`,
                        ephemeral: true
                    });
                };

                const hammersSelect = new ActionRowBuilder({
                    components: [
                        new RoleSelectMenuBuilder({
                            custom_id: 'hammerAdd',
                            placeholder: 'Ekstra rolleri (Ceo, Co-Ceo vb.)'
                        })
                    ]
                });

                const skipButton = new ActionRowBuilder({
                    components: [
                        new ButtonBuilder({
                            custom_id: 'skip',
                            label: 'Geç',
                            style: ButtonStyle.Danger,
                        }),
                    ],
                })

                i.reply({
                    components: [hammersSelect, skipButton],
                    ephemeral: true
                });

                const interactionMessage = await i.fetchReply();
                const extraCollected = await interactionMessage.awaitMessageComponent({
                    time: 1000 * 60 * 10,
                }).catch(() => null);

                if (extraCollected) {
                    const hammers = extraCollected.isAnySelectMenu() ? extraCollected.values : [];

                    const typeSelect = new ActionRowBuilder({
                        components: [
                            new StringSelectMenuBuilder({
                                custom_id: 'type',
                                placeholder: 'Yetki tipi seç..',
                                max_values: 1,
                                min_values: 1,
                                options: [
                                    { label: 'Alt Yetki (Puan)', value: 'sub' },
                                    { label: 'Orta Yetki (Rozet)', value: 'middle' },
                                    { label: 'Üst Yetki (Rozet)', value: 'top' },
                                ]
                            })
                        ]
                    });

                    await extraCollected.update({
                        content: 'Yetki tipini seç..',
                        components: [typeSelect],
                    });

                    const typeCollectedMessage = await extraCollected.fetchReply();
                    const typeCollected = await typeCollectedMessage.awaitMessageComponent({
                        time: 1000 * 60 * 10,
                    }).catch(() => null);

                    if (typeCollected && typeCollected.isStringSelectMenu()) {
                        const type = typeCollected.values[0];

                        if (type === 'sub') {
                            const modal = new ModalBuilder({
                                custom_id: 'rankSettings',
                                title: 'Yetki Ayarları',
                                components: [
                                    new ActionRowBuilder({
                                        components: [
                                            new TextInputBuilder({
                                                custom_id: 'point',
                                                label: 'Puan (Alt Yetki)',
                                                placeholder: '1000',
                                                required: false,
                                                style: TextInputStyle.Short
                                            })
                                        ]
                                    }),
                                ]
                            });

                            await typeCollected.showModal(modal)
                            const modalCollected = await typeCollected.awaitModalSubmit({ time: 90000 }).catch(() => null);

                            if (modalCollected) {
                                const point = Number(modalCollected.fields.getTextInputValue('point'));

                                if (isNaN(point)) {
                                    return i.editReply({
                                        components: [],
                                        content: `${await client.getEmoji('mark')} puan sayı olmak zorunda!`
                                    })
                                };

                                const newRank = [
                                    ...(ertu.staffRanks || []),
                                    {
                                        place: ertu.staffRanks.length + 1,
                                        type: type,
                                        role: rankRoleId,
                                        hammers: hammers,
                                        point: point,
                                    },
                                ];

                                await SettingsModel.updateOne({ id: message.guild.id }, { staffRanks: newRank });
                                await modalCollected.reply({
                                    content: `${await client.getEmoji('check')} başarıyla ${roleMention(rankRoleId)} yetkisi ayarlandı!`,
                                    embeds: [],
                                    components: [],
                                });

                                modalCollected.deferUpdate();
                            } else i.deleteReply().catch(() => undefined);
                        } else {
                            const modal = new ModalBuilder({
                                custom_id: 'setDay',
                                title: 'Gün Ayarla',
                                components: [
                                    new ActionRowBuilder({
                                        components: [
                                            new TextInputBuilder({
                                                custom_id: 'day',
                                                label: 'Gün',
                                                placeholder: 'Rozet Süreleri',
                                                required: false,
                                                style: TextInputStyle.Short
                                            })
                                        ]
                                    }),
                                    new ActionRowBuilder({
                                        components: [
                                            new TextInputBuilder({
                                                custom_id: 'firstBadge',
                                                label: 'İlk Rozet Rol ID',
                                                placeholder: '1234567890123456789',
                                                required: true,
                                                style: TextInputStyle.Short
                                            })
                                        ]
                                    }),
                                    new ActionRowBuilder({
                                        components: [
                                            new TextInputBuilder({
                                                custom_id: 'secondBadge',
                                                label: 'İkinci Rozet Rol ID',
                                                placeholder: '1234567890123456789',
                                                required: false,
                                                style: TextInputStyle.Short
                                            })
                                        ]
                                    })
                                ]
                            });
                            
                            await typeCollected.showModal(modal)
                            const modalCollected = await typeCollected.awaitModalSubmit({ time: 90000 }).catch(() => null);
                            if (modalCollected) {
                                const day = Number(modalCollected.fields.getTextInputValue('day'));
                                const firstBadge = modalCollected.fields.getTextInputValue('firstBadge');
                            
                                const firstRole = message.guild.roles.cache.get(firstBadge);
                                if (!firstRole) {
                                    return i.editReply({
                                        components: [],
                                        content: `${await client.getEmoji('mark')} İlk rozet rolü bulunamadı!`
                                    });
                                }
                            
                                if (isNaN(day)) {
                                    return i.editReply({
                                        components: [],
                                        content: `${await client.getEmoji('mark')} gün sayı olmak zorunda!`
                                    })
                                };
                            
                                const embed = new EmbedBuilder({
                                    color: client.getColor(),
                                    description: [
                                        `> Yetki Süresi: ${day} gün`,
                                        `> Yetki Rolü: ${roleMention(rankRoleId)}`,
                                        `> Ekstra Roller: ${hammers.length > 0 ? hammers.map((r) => message.guild.roles.cache.get(r) || 'Bulunamadı').join(', ') : 'Bulunamadı'}`,
                                        `> 1. Rozet: ${firstRole} (${firstRole.icon ? firstRole.iconURL() : 'Ayarlanmamış'})`,
                                        modalCollected.fields.getTextInputValue('secondBadge') ? `> 2. Rozet: ${message.guild.roles.cache.get(modalCollected.fields.getTextInputValue('secondBadge')) || 'Bulunamadı'}` : '',
                                    ].join('\n')
                                })
                            
                                const row = new ActionRowBuilder({
                                    components: [
                                        new ButtonBuilder({
                                            custom_id: 'continue',
                                            label: 'Devam Et',
                                            style: ButtonStyle.Success
                                        }),
                                        new ButtonBuilder({
                                            custom_id: 'cancel',
                                            label: 'İptal',
                                            style: ButtonStyle.Danger
                                        })
                                    ]
                                });
                            
                                const reply = await modalCollected.reply({
                                    embeds: [embed],
                                    components: [row],
                                    ephemeral: true,
                                    fetchReply: true
                                });
                            
                                const buttonCollector = reply.createMessageComponentCollector({
                                    filter: i => i.user.id === author,
                                    time: 30000
                                });
                            
                                buttonCollector.on('collect', async (button) => {
                                    if (button.customId === 'cancel') {
                                        button.update({
                                            content: `${await client.getEmoji('mark')} İşlem iptal edildi!`,
                                            embeds: [],
                                            components: []
                                        });
                                        return;
                                    }
                            
                                    if (button.customId === 'continue') {
                                        const firstModal = new ModalBuilder({
                                            custom_id: 'requirements',
                                            title: 'Görev Gereksinimleri',
                                            components: [
                                                new ActionRowBuilder({
                                                    components: [
                                                        new TextInputBuilder({
                                                            custom_id: 'voice',
                                                            label: 'Genel Ses',
                                                            placeholder: '1h',
                                                            required: true,
                                                            style: TextInputStyle.Short,
                                                        })
                                                    ]
                                                }),
                                                new ActionRowBuilder({
                                                    components: [
                                                        new TextInputBuilder({
                                                            custom_id: 'public',
                                                            label: 'Public Ses',
                                                            placeholder: 'Public görevi seçerse verilecek görev. Örn: 1h',
                                                            required: true,
                                                            style: TextInputStyle.Short,
                                                        })
                                                    ]
                                                }),
                                                new ActionRowBuilder({
                                                    components: [
                                                        new TextInputBuilder({
                                                            custom_id: 'streamer',
                                                            label: 'Streamer Ses',
                                                            placeholder: 'Streamer görevi seçerse verilecek görev. Örn: 1h',
                                                            required: true,
                                                            style: TextInputStyle.Short,
                                                        })
                                                    ]
                                                })
                                            ]
                                        });
                            
                                        await button.showModal(firstModal);
                                        const modalFirstCollected = await button.awaitModalSubmit({ time: 90000 }).catch(() => null);
                            
                                        if (modalFirstCollected && modalFirstCollected.isModalSubmit()) {
                                            const voice = modalFirstCollected.fields.getTextInputValue('voice');
                                            const publicVoice = modalFirstCollected.fields.getTextInputValue('public');
                                            const streamerVoice = modalFirstCollected.fields.getTextInputValue('streamer');
                            
                                            if (!voice || !publicVoice || !streamerVoice) {
                                                return modalFirstCollected.reply({
                                                    content: `${await client.getEmoji('mark')} Tüm alanlar doldurulmalı!`,
                                                    ephemeral: true
                                                });
                                            }
                            
                                            const embed = new EmbedBuilder({
                                                color: client.getColor(),
                                                description: [
                                                    `> Yetki Süresi: ${day} gün`,
                                                    `> Yetki Rolü: ${roleMention(rankRoleId)}`,
                                                    `> Ekstra Roller: ${hammers.length > 0 ? hammers.map((r) => message.guild.roles.cache.get(r) || 'Bulunamadı').join(', ') : 'Bulunamadı'}`,
                                                    `> 1. Rozet: ${firstRole} (${firstRole.icon ? firstRole.iconURL() : 'Ayarlanmamış'})`,
                                                    modalCollected.fields.getTextInputValue('secondBadge') ? `> 2. Rozet: ${message.guild.roles.cache.get(modalCollected.fields.getTextInputValue('secondBadge')) || 'Bulunamadı'}` : '',
                                                    `> Genel Ses: ${voice}`,
                                                    `> Public Ses: ${publicVoice}`,
                                                    `> Streamer Ses: ${streamerVoice}`,
                                                ].join('\n')
                                            })
                            
                                            const row = new ActionRowBuilder({
                                                components: [
                                                    new ButtonBuilder({
                                                        custom_id: 'continue',
                                                        label: 'Devam Et',
                                                        style: ButtonStyle.Success
                                                    }),
                                                    new ButtonBuilder({
                                                        custom_id: 'cancel',
                                                        label: 'İptal',
                                                        style: ButtonStyle.Danger
                                                    })
                                                ]
                                            });
                            
                                            const reply = await modalFirstCollected.reply({
                                                embeds: [embed],
                                                components: [row],
                                                ephemeral: true,
                                                fetchReply: true
                                            });
                            
                                            const buttonCollector = reply.createMessageComponentCollector({
                                                filter: i => i.user.id === author,
                                                time: 30000
                                            });
                            
                                            buttonCollector.on('collect', async (button) => {
                                                if (button.customId === 'cancel') {
                                                    button.update({
                                                        content: `${await client.getEmoji('mark')} İşlem iptal edildi!`,
                                                        embeds: [],
                                                        components: []
                                                    });
                                                    return;
                                                }
                            
                                                if (button.customId === 'continue') {
                                                    const secondModal = new ModalBuilder({
                                                        custom_id: 'requirements:2',
                                                        title: 'Görev Gereksinimleri',
                                                        components: [
                                                            new ActionRowBuilder({
                                                                components: [
                                                                    new TextInputBuilder({
                                                                        custom_id: 'msg',
                                                                        label: 'Mesaj Görevi',
                                                                        placeholder: '1000',
                                                                        required: true,
                                                                        style: TextInputStyle.Short,
                                                                    })
                                                                ]
                                                            }),
                                                            new ActionRowBuilder({
                                                                components: [
                                                                    new TextInputBuilder({
                                                                        custom_id: 'tagged',
                                                                        label: 'Taglı Görevi',
                                                                        placeholder: '5',
                                                                        required: true,
                                                                        style: TextInputStyle.Short,
                                                                    })
                                                                ]
                                                            }),
                                                            new ActionRowBuilder({
                                                                components: [
                                                                    new TextInputBuilder({
                                                                        custom_id: 'invite',
                                                                        label: 'Davet Görevi',
                                                                        placeholder: '10',
                                                                        required: true,
                                                                        style: TextInputStyle.Short,
                                                                    })
                                                                ]
                                                            }),
                                                            new ActionRowBuilder({
                                                                components: [
                                                                    new TextInputBuilder({
                                                                        custom_id: 'staff',
                                                                        label: 'Yetkili Görevi',
                                                                        placeholder: '10',
                                                                        required: true,
                                                                        style: TextInputStyle.Short,
                                                                    })
                                                                ]
                                                            }),
                                                            new ActionRowBuilder({
                                                                components: [
                                                                    new TextInputBuilder({
                                                                        custom_id: 'meeting',
                                                                        label: 'Toplantı Görevi',
                                                                        placeholder: '10',
                                                                        required: true,
                                                                        style: TextInputStyle.Short,
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    });
                            
                                                    await button.showModal(secondModal);
                                                    const modalSecondCollected = await button.awaitModalSubmit({ time: 90000 }).catch(() => null);
                            
                                                    if (modalSecondCollected && modalSecondCollected.isModalSubmit()) {
                                                        const messageCount = modalSecondCollected.fields.getTextInputValue('msg');
                                                        const taggedCount = modalSecondCollected.fields.getTextInputValue('tagged');
                                                        const inviteCount = modalSecondCollected.fields.getTextInputValue('invite');
                                                        const staffCount = modalSecondCollected.fields.getTextInputValue('staff');
                                                        const meetingCount = modalSecondCollected.fields.getTextInputValue('meeting');
                            
                                                        if (!messageCount || !taggedCount || !inviteCount || !staffCount || !meetingCount) {
                                                            return modalSecondCollected.reply({
                                                                content: `${await client.getEmoji('mark')} Tüm alanlar doldurulmalı!`,
                                                                ephemeral: true
                                                            });
                                                        }
                            
                                                        const embed = new EmbedBuilder({
                                                            color: client.getColor(),
                                                            description: [
                                                                `> Yetki Süresi: ${day} gün`,
                                                                `> Yetki Rolü: ${roleMention(rankRoleId)}`,
                                                                `> Ekstra Roller: ${hammers.length > 0 ? hammers.map((r) => message.guild.roles.cache.get(r) || 'Bulunamadı').join(', ') : 'Bulunamadı'}`,
                                                                `> 1. Rozet: ${firstRole}`,
                                                                modalCollected.fields.getTextInputValue('secondBadge') ? `> 2. Rozet: ${message.guild.roles.cache.get(modalCollected.fields.getTextInputValue('secondBadge')) || 'Bulunamadı'}` : '',
                                                                `> Genel Ses: ${voice}`,
                                                                `> Public Ses: ${publicVoice}`,
                                                                `> Streamer Ses: ${streamerVoice}`,
                                                                `> Mesaj: ${messageCount}`,
                                                                `> Taglı: ${taggedCount}`,
                                                                `> Davet: ${inviteCount}`,
                                                                `> Yetkili: ${staffCount}`,
                                                                `> Toplantı: ${meetingCount}`,
                                                            ].join('\n')
                                                        })
                            
                                                        const row = new ActionRowBuilder({
                                                            components: [
                                                                new ButtonBuilder({
                                                                    custom_id: 'continue',
                                                                    label: 'Devam Et',
                                                                    style: ButtonStyle.Success
                                                                }),
                                                                new ButtonBuilder({
                                                                    custom_id: 'cancel',
                                                                    label: 'İptal',
                                                                    style: ButtonStyle.Danger
                                                                })
                                                            ]
                                                        });
                            
                                                        const reply = await modalSecondCollected.reply({
                                                            embeds: [embed],
                                                            components: [row],
                                                            ephemeral: true,
                                                            fetchReply: true
                                                        });
                            
                                                        const buttonCollector = reply.createMessageComponentCollector({
                                                            filter: i => i.user.id === author,
                                                            time: 30000
                                                        });
                            
                                                        buttonCollector.on('collect', async (button) => {
                                                            if (button.customId === 'cancel') {
                                                                button.update({
                                                                    content: `${await client.getEmoji('mark')} İşlem iptal edildi!`,
                                                                    embeds: [],
                                                                    components: []
                                                                });
                                                                return;
                                                            }
                            
                                                            if (button.customId === 'continue') {
                                                                const thirdModal = new ModalBuilder({
                                                                    custom_id: 'requirements:3',
                                                                    title: 'Ek Görev Gereksinimleri',
                                                                    components: [
                                                                        new ActionRowBuilder({
                                                                            components: [
                                                                                new TextInputBuilder({
                                                                                    custom_id: 'return',
                                                                                    label: 'Return Görevi (Sorumluluk)',
                                                                                    placeholder: '5',
                                                                                    required: true,
                                                                                    style: TextInputStyle.Short,
                                                                                })
                                                                            ]
                                                                        }),
                                                                        new ActionRowBuilder({
                                                                            components: [
                                                                                new TextInputBuilder({
                                                                                    custom_id: 'role',
                                                                                    label: 'Rol Denetim Görevi (Sorumluluk)',
                                                                                    placeholder: '10',
                                                                                    required: true,
                                                                                    style: TextInputStyle.Short,
                                                                                })
                                                                            ]
                                                                        }),
                                                                        new ActionRowBuilder({
                                                                            components: [
                                                                                new TextInputBuilder({
                                                                                    custom_id: 'solve',
                                                                                    label: 'Sorun Çözme Görevi (Sorumluluk)',
                                                                                    placeholder: '8',
                                                                                    required: true,
                                                                                    style: TextInputStyle.Short,
                                                                                })
                                                                            ]
                                                                        }),
                                                                        new ActionRowBuilder({
                                                                            components: [
                                                                                new TextInputBuilder({
                                                                                    custom_id: 'register',
                                                                                    label: 'Teyit Görevi (Sorumluluk)',
                                                                                    placeholder: '15',
                                                                                    required: true,
                                                                                    style: TextInputStyle.Short,
                                                                                })
                                                                            ]
                                                                        }),
                                                                        new ActionRowBuilder({
                                                                            components: [
                                                                                new TextInputBuilder({
                                                                                    custom_id: 'orientation',
                                                                                    label: 'Oryantasyon Görevi (Sorumluluk)',
                                                                                    placeholder: '12',
                                                                                    required: true,
                                                                                    style: TextInputStyle.Short,
                                                                                })
                                                                            ]
                                                                        })
                                                                    ]
                                                                });
                            
                                                                await button.showModal(thirdModal);
                                                                const modalThirdCollected = await button.awaitModalSubmit({ time: 90000 }).catch(() => null);
                            
                                                                if (modalThirdCollected && modalThirdCollected.isModalSubmit()) {
                                                                    const returnCount = modalThirdCollected.fields.getTextInputValue('return');
                                                                    const roleCount = modalThirdCollected.fields.getTextInputValue('role');
                                                                    const solveCount = modalThirdCollected.fields.getTextInputValue('solve');
                                                                    const registerCount = modalThirdCollected.fields.getTextInputValue('register');
                                                                    const orientationCount = modalThirdCollected.fields.getTextInputValue('orientation');
                            
                                                                    if (!returnCount || !roleCount || !solveCount || !registerCount || !orientationCount) {
                                                                        return modalThirdCollected.reply({
                                                                            content: `${await client.getEmoji('mark')} Tüm alanlar doldurulmalı!`,
                                                                            ephemeral: true
                                                                        });
                                                                    }
                            
                                                                    const newRank = [
                                                                        ...(ertu.staffRanks || []),
                                                                        {
                                                                            place: ertu.staffRanks.length + 1,
                                                                            type: type,
                                                                            role: rankRoleId,
                                                                            hammers: hammers,
                                                                            point: 0,
                                                                            day: day,
                                                                            tasks: [
                                                                                { task: 'VOICE', value: ms(voice), type: 'TIME' },
                                                                                { task: 'PUBLIC', value: ms(publicVoice), type: 'TIME' },
                                                                                { task: 'STREAMER', value: ms(streamerVoice), type: 'TIME' },
                                                                                { task: 'MESSAGE', value: messageCount, type: 'CLASSIC' },
                                                                                { task: 'TAGGED', value: taggedCount, type: 'CLASSIC' },
                                                                                { task: 'INVITE', value: inviteCount, type: 'CLASSIC' },    
                                                                                { task: 'STAFF', value: staffCount, type: 'CLASSIC' },
                                                                                { task: 'MEETING', value: meetingCount, type: 'CLASSIC' },
                                                                                { task: 'RETURN', value: returnCount, type: 'RESPONSIBILITY' },
                                                                                { task: 'ROLE', value: roleCount, type: 'RESPONSIBILITY' },
                                                                                { task: 'SOLVE', value: solveCount, type: 'RESPONSIBILITY' },
                                                                                { task: 'REGISTER', value: registerCount, type: 'RESPONSIBILITY' },
                                                                                { task: 'ORIENTATION', value: orientationCount, type: 'RESPONSIBILITY' },
                                                                            ],
                                                                            badges: [
                                                                                { badge: 1, name: firstRole.name, icon: firstRole?.icon ? firstRole.iconURL() : null, role: firstBadge },
                                                                            ],
                                                                        },
                                                                    ];
                            
                                                                    await SettingsModel.updateOne({ id: message.guild.id }, { staffRanks: newRank });
                            
                                                                    const secondBadge = modalCollected.fields.getTextInputValue('secondBadge');
                                                                    if (secondBadge) {
                                                                        const secondRole = message.guild.roles.cache.get(secondBadge);
                                                                        if (secondRole) {
                                                                            await SettingsModel.updateOne(
                                                                                { id: message.guild.id, 'staffRanks.role': rankRoleId },
                                                                                { $push: { 'staffRanks.$.badges': { badge: 2, name: secondRole.name, icon: secondRole?.icon ? secondRole.iconURL() : null, role: secondBadge } } }
                                                                            );
                                                                        }
                                                                    }
                            
                                                                    await modalThirdCollected.reply({
                                                                        content: `${await client.getEmoji('check')} başarıyla ${roleMention(rankRoleId)} yetkisi ayarlandı!`,
                                                                        embeds: [],
                                                                        components: [],
                                                                    });
                            
                                                                    modalThirdCollected.deferUpdate();
                                                                }
                                                            }
                                                        });
                                                    }
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    } else i.deleteReply().catch(() => undefined);

                    question.edit({
                        content: option.description,
                        components: createRow(client, message.guild, ertu.staffRanks)
                    });
                } else i.deleteReply().catch(() => undefined);
            };
        };

        if (i.isStringSelectMenu()) {
            await i.deferReply({ ephemeral: true });
            const newData = (ertu.staffRanks || []);
            ertu.staffRanks = newData.filter((d) => !i.values.includes(d.role));

            i.message.edit({
                content: option.description,
                components: createRow(client, message.guild, ertu.staffRanks)
            });

            i.editReply({
                content: `${await client.getEmoji('check')} başarıyla yetki kaldırıldı!`,
                components: [],
            });

            await message.guild?.updateSettings({ staffRanks: ertu.staffRanks });
        };
    });
}

function createRow(client, guild, data) {
    const nonBadgedRanks = data?.filter((r) => r.type === 'sub' && guild.roles.cache.has(r.role)).map((r) => r).sort((a, b) => b.point - a.point) || [];
    const middleRanks = data?.filter((r) => r.type === 'middle' && guild.roles.cache.has(r.role)).map((r) => r).sort((a, b) => b.place - a.place) || [];
    const topRanks = data?.filter((r) => r.type === 'top' && guild.roles.cache.has(r.role)).map((r) => r).sort((a, b) => b.place - a.place) || [];
    const chunks = client.functions.chunkArray([...topRanks, ...middleRanks, ...nonBadgedRanks], 25);

    const rows = [];
    let page = 0;

    for (const chunk of chunks) {
        page++;

        if (page === 3) break;
        rows.push(
            new ActionRowBuilder({
                components: [
                    new StringSelectMenuBuilder({
                        customId: 'ranks:' + page,
                        placeholder: `Ranklar (Sayfa ` + page + `)`,
                        options: chunk.map((r) => {
                            const role = guild.roles.cache.get(r.role);
                            return {
                                label: `${role?.name} / ${r.type !== 'sub' ? 'Rozet Sistemi' : `${r.point} Puan`}`,
                                value: role?.id,
                            };
                        })
                    })
                ]
            })
        )
    };

    rows.push(
        new ActionRowBuilder({
            components: [
                new RoleSelectMenuBuilder({
                    custom_id: 'roleAdd',
                    placeholder: 'Yetki rank ekle',
                    max_values: 1,
                })
            ]
        })
    )

    rows.push(
        new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    customId: 'back',
                    label: 'Geri',
                    style: ButtonStyle.Danger
                }),
            ],
        })
    )

    return rows;
}