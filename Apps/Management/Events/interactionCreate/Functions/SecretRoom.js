
const {
    ModalBuilder,
    ActionRowBuilder,
    TextInputStyle,
    TextInputBuilder,
    StringSelectMenuBuilder,
    UserSelectMenuBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    bold,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    MessageFlags,
    SectionBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    ThumbnailBuilder,
} = require('discord.js');
const { SettingsModel } = require('../../../../../Global/Settings/Schemas');
const inviteRegex = /\b(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li)|discordapp\.com\/invite)\/([a-zA-Z0-9\-]{2,32})\b/;
const adsRegex = /([^a-zA-ZIıİiÜüĞğŞşÖöÇç\s])+/gi;

module.exports = async function SecretRoom(client, interaction, route, ertu) {

    const member = interaction.guild.members.cache.get(interaction.user.id);
    const channel = interaction.guild.channels.cache.get(member.voice.channelId);
    const existingRoom = (ertu.privateRooms || []).find(x => x.channel === channel?.id);
    const owner = interaction.guild.members.cache.get(existingRoom?.owner);
    const isOwnerVoice = owner?.voice?.channel?.id === channel?.id;
    const isOwner = owner?.id === interaction.user.id;

    if (route === 'change') {
        if (!member.voice.channel) return interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: 'Kanal Bulunamadı!',
                    image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                    description: `Geçerli bir ses kanalında değilsiniz. Lütfen bir ses kanalına katıldığınızdan emin olun:\n\n <#${ertu.settings.privateRoomChannel}>`,
                })
            ], ephemeral: true
        });

        if (channel?.parentId === ertu.settings.customRoomParent && !isOwnerVoice && !isOwner) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: 'Mümkün değil!',
                        image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                        description: 'Bu komutu, yalnızca ses kanalının sahibi kullanabilir. Oda sahibi odada olmadığı için aşağıdaki butonu kullanabilir.'
                    })
                ],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder({
                            customId: 'secretroom:claim',
                            label: 'Odayı Sahiplen',
                            style: ButtonStyle.Primary
                        })
                    )
                ],
                ephemeral: true
            });
        } else if (channel?.parentId === ertu.settings.customRoomParent && isOwnerVoice && !isOwner) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: 'Mümkün değil!',
                        image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                        description: 'Bu komutu, yalnızca ses kanalının sahibi kullanabilir. '
                    })
                ],
                ephemeral: true
            });
        } else if (channel?.parentId !== ertu.settings.customRoomParent) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: 'Hata!',
                        image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                        description: `Özel oda kategorisinde olmayan bir kanalda bu işlemi gerçekleştiremezsiniz. Lütfen bir özel oda kanalında deneyin:\n\n <#${ertu.settings.privateRoomChannel}>`
                    })
                ],
                ephemeral: true
            });
        }

        const row = new ModalBuilder()
            .setTitle('İsim Değiştir')
            .setCustomId('changingName')
            .setComponents(
                new ActionRowBuilder().setComponents(new TextInputBuilder().setCustomId('channelName').setLabel('Oda ismini giriniz.').setStyle(TextInputStyle.Short)),
            );

        interaction.showModal(row)

        const modalCollected = await interaction.awaitModalSubmit({ time: 1000 * 60 * 2 });
        const channelName = modalCollected.fields.getTextInputValue('channelName');

        if (modalCollected) {
            if (channelName.match(inviteRegex)) return modalCollected.reply({ content: 'Özel oda isminde link kullanamazsınız.', ephemeral: true });
            if (channelName.match(adsRegex)) return modalCollected.reply({ content: 'Özel oda isminde reklam yapamazsınız.', ephemeral: true });

            await channel.setName(channelName).catch((err) => console.error())

            modalCollected.reply({
                content: `Oda ismi başarıyla değiştirildi: ${bold(channelName)}`,
                ephemeral: true
            });
        }
    }

    if (route === 'limit') {
        if (!member.voice.channel) return interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: 'Kanal Bulunamadı!',
                    image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                    description: `Geçerli bir ses kanalında değilsiniz. Lütfen bir ses kanalına katıldığınızdan emin olun:\n\n <#${ertu.settings.privateRoomChannel}>`,
                })
            ], ephemeral: true
        });

        if (channel?.parentId === ertu.settings.customRoomParent && !isOwnerVoice && !isOwner) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: 'Mümkün değil!',
                        image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                        description: 'Bu komutu, yalnızca ses kanalının sahibi kullanabilir. Oda sahibi odada olmadığı için aşağıdaki butonu kullanabilir.' 
                    })
                ],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder({
                            customId: 'secretroom:claim',
                            label: 'Odayı Sahiplen',
                            style: ButtonStyle.Primary
                        })
                    )
                ],
                ephemeral: true
            });
        } else if (channel?.parentId === ertu.settings.customRoomParent && isOwnerVoice && !isOwner) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: 'Mümkün değil!',
                        image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                        description: 'Bu komutu, yalnızca ses kanalının sahibi kullanabilir. ' 
                    })
                ],
                ephemeral: true
            });
        } else if (channel?.parentId !== ertu.settings.customRoomParent) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: 'Hata!',
                        image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                        description: `Özel oda kategorisinde olmayan bir kanalda bu işlemi gerçekleştiremezsiniz. Lütfen bir özel oda kanalında deneyin:\n\n <#${ertu.settings.privateRoomChannel}>`
                    })
                ], 
                ephemeral: true
            });
        }

        const row = new ModalBuilder()
            .setTitle('Limit Değiştir')
            .setCustomId('changingLimit')
            .setComponents(
                new ActionRowBuilder().setComponents(new TextInputBuilder().setCustomId('channelLimit').setLabel('Oda limitini giriniz.').setStyle(TextInputStyle.Short)),
            );

        interaction.showModal(row)

        const modalCollected = await interaction.awaitModalSubmit({ time: 1000 * 60 * 2 });
        const channelLimit = modalCollected.fields.getTextInputValue('channelLimit');

        if (modalCollected) {
            if (isNaN(channelLimit)) return modalCollected.reply({ content: 'Geçerli bir limit belirtmelisiniz.', ephemeral: true });

            await channel.setUserLimit(channelLimit).catch((err) => console.error())

            modalCollected.reply({
                content: `Oda limiti başarıyla değiştirildi: ${bold(channelLimit)}`,
                ephemeral: true
            });
        }
    }

    if (route === 'lock') {
        if (!member.voice.channel) return interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: 'Kanal Bulunamadı!',
                    image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                    description: `Geçerli bir ses kanalında değilsiniz. Lütfen bir ses kanalına katıldığınızdan emin olun:\n\n <#${ertu.settings.privateRoomChannel}>`,
                })
            ], ephemeral: true
        });

        if (channel?.parentId === ertu.settings.customRoomParent && !isOwnerVoice && !isOwner) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: 'Mümkün değil!',
                        image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                        description: 'Bu komutu, yalnızca ses kanalının sahibi kullanabilir. Oda sahibi odada olmadığı için aşağıdaki butonu kullanabilir.' 
                    })
                ],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder({
                            customId: 'secretroom:claim',
                            label: 'Odayı Sahiplen',
                            style: ButtonStyle.Primary
                        })
                    )
                ],
                ephemeral: true
            });
        } else if (channel?.parentId === ertu.settings.customRoomParent && isOwnerVoice && !isOwner) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: 'Mümkün değil!',
                        image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                        description: 'Bu komutu, yalnızca ses kanalının sahibi kullanabilir. ' 
                    })
                ],
                ephemeral: true
            });
        } else if (channel?.parentId !== ertu.settings.customRoomParent) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: 'Hata!',
                        image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                        description: `Özel oda kategorisinde olmayan bir kanalda bu işlemi gerçekleştiremezsiniz. Lütfen bir özel oda kanalında deneyin:\n\n <#${ertu.settings.privateRoomChannel}>`
                    })
                ], 
                ephemeral: true
            });
        }

        const permissions = channel.permissionOverwrites.cache.get(interaction.guild.id);

        if (permissions && permissions.deny.has(PermissionFlagsBits.Connect)) {
            await channel.permissionOverwrites.edit(interaction.guild.id, { 1048576: true });
            interaction.reply({ content: 'Kanal herkese açıldı.', ephemeral: true });
        } else {
            await channel.permissionOverwrites.edit(interaction.guild.id, { 1048576: false });
            interaction.reply({ content: 'Kanal herkese kapatıldı.', ephemeral: true });
        }
    }

    if (route === 'visible') {
        if (!member.voice.channel) return interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: 'Kanal Bulunamadı!',
                    image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                    description: `Geçerli bir ses kanalında değilsiniz. Lütfen bir ses kanalına katıldığınızdan emin olun:\n\n <#${ertu.settings.privateRoomChannel}>`,
                })
            ], ephemeral: true
        });

        if (channel?.parentId === ertu.settings.customRoomParent && !isOwnerVoice && !isOwner) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: 'Mümkün değil!',
                        image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                        description: 'Bu komutu, yalnızca ses kanalının sahibi kullanabilir. Oda sahibi odada olmadığı için aşağıdaki butonu kullanabilir.' 
                    })
                ],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder({
                            customId: 'secretroom:claim',
                            label: 'Odayı Sahiplen',
                            style: ButtonStyle.Primary
                        })
                    )
                ],
                ephemeral: true
            });
        } else if (channel?.parentId === ertu.settings.customRoomParent && isOwnerVoice && !isOwner) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: 'Mümkün değil!',
                        image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                        description: 'Bu komutu, yalnızca ses kanalının sahibi kullanabilir. ' 
                    })
                ],
                ephemeral: true
            });
        } else if (channel?.parentId !== ertu.settings.customRoomParent) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: 'Hata!',
                        image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                        description: `Özel oda kategorisinde olmayan bir kanalda bu işlemi gerçekleştiremezsiniz. Lütfen bir özel oda kanalında deneyin:\n\n <#${ertu.settings.privateRoomChannel}>`
                    })
                ], 
                ephemeral: true
            });
        }

        const permissions = channel.permissionOverwrites.cache.get(interaction.guild.id);

        if (permissions && permissions.deny.has(PermissionFlagsBits.ViewChannel)) {
            await channel.permissionOverwrites.edit(interaction.guild.id, { 1024: true });
            interaction.reply({ content: 'Kanal herkese görünür yapıldı.', ephemeral: true });
        } else {
            await channel.permissionOverwrites.edit(interaction.guild.id, { 1024: false });
            interaction.reply({ content: 'Kanal herkese gizlendi.', ephemeral: true });
        }
    }

    if (route === 'member') {
        if (!member.voice.channel) return interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: 'Kanal Bulunamadı!',
                    image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                    description: `Geçerli bir ses kanalında değilsiniz. Lütfen bir ses kanalına katıldığınızdan emin olun:\n\n <#${ertu.settings.privateRoomChannel}>`,
                })
            ], ephemeral: true
        });

        if (channel?.parentId === ertu.settings.customRoomParent && !isOwnerVoice && !isOwner) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: 'Mümkün değil!',
                        image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                        description: 'Bu komutu, yalnızca ses kanalının sahibi kullanabilir. Oda sahibi odada olmadığı için aşağıdaki butonu kullanabilir.' 
                    })
                ],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder({
                            customId: 'secretroom:claim',
                            label: 'Odayı Sahiplen',
                            style: ButtonStyle.Primary
                        })
                    )
                ],
                ephemeral: true
            });
        } else if (channel?.parentId === ertu.settings.customRoomParent && isOwnerVoice && !isOwner) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: 'Mümkün değil!',
                        image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                        description: 'Bu komutu, yalnızca ses kanalının sahibi kullanabilir. ' 
                    })
                ],
                ephemeral: true
            });
        } else if (channel?.parentId !== ertu.settings.customRoomParent) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: 'Hata!',
                        image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                        description: `Özel oda kategorisinde olmayan bir kanalda bu işlemi gerçekleştiremezsiniz. Lütfen bir özel oda kanalında deneyin:\n\n <#${ertu.settings.privateRoomChannel}>`
                    })
                ], 
                ephemeral: true
            });
        }

        const allowedUsers = channel.permissionOverwrites.cache.filter(overwrite =>
            overwrite.allow.has(PermissionFlagsBits.Connect) && overwrite.type === 1
        );

        const allowedOptions = allowedUsers
            .filter(x => x.id !== interaction.user.id)
            .map(user => ({
                label: interaction.guild.members.cache.get(user.id)?.displayName || `Kullanıcı: ${user.id}`,
                value: user.id
            }));

        const stringSelectMenu = new StringSelectMenuBuilder({
            customId: 'remove_permission',
            placeholder: 'Özel odaya izinli kullanıcılar',
            options: allowedOptions.slice(0, 25).length > 0 ? allowedOptions.slice(0, 25) : [{
                label: 'Kimse mevcut değil',
                value: 'none',
                description: 'Odaya izinli kullanıcı yok.'
            }],
            disabled: allowedOptions.length === 0
        });

        const userSelectMenu = new UserSelectMenuBuilder({
            customId: 'add_permission',
            placeholder: 'Üye seç.',
            maxValues: 1
        });

        const stringSelectRow = new ActionRowBuilder().addComponents(stringSelectMenu);
        const userSelectRow = new ActionRowBuilder().addComponents(userSelectMenu);

        await interaction.reply({
            content: 'Aşağıdaki menüleri kullanarak kullanıcı izinlerini düzenleyin:',
            components: [stringSelectRow, userSelectRow],
            ephemeral: true
        });

        const collector = interaction.channel.createMessageComponentCollector({
            filter: interaction => interaction.user.id === interaction.user.id,
            time: 60000
        });

        collector.on('collect', async interaction => {
            if (interaction.customId === 'remove_permission') {
                const userId = interaction.values[0];
                await channel.permissionOverwrites.delete(userId);
                await interaction.update({
                    content: `<@${userId}> kullanıcısının özel oda izni kaldırıldı.`,
                    components: [],
                    ephemeral: true
                });
            } else if (interaction.customId === 'add_permission') {
                const userId = interaction.values[0];
                await channel.permissionOverwrites.edit(userId, {
                    [PermissionFlagsBits.Connect]: true
                });
                await interaction.update({
                    content: `<@${userId}> kullanıcısına özel odaya bağlanma izni verildi.`,
                    components: [],
                    ephemeral: true
                });
            }
        });
    }

     if (route === 'list') {
        if (!member.voice.channel) return interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: 'Kanal Bulunamadı!',
                    image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                    description: `Geçerli bir ses kanalında değilsiniz. Lütfen bir ses kanalına katıldığınızdan emin olun:\n\n <#${ertu.settings.privateRoomChannel}>`,
                })
            ], ephemeral: true
        });

        if (channel?.parentId === ertu.settings.customRoomParent && !isOwnerVoice && !isOwner) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: 'Mümkün değil!',
                        image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                        description: 'Bu komutu, yalnızca ses kanalının sahibi kullanabilir. Oda sahibi odada olmadığı için aşağıdaki butonu kullanabilir.' 
                    })
                ],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder({
                            customId: 'secretroom:claim',
                            label: 'Odayı Sahiplen',
                            style: ButtonStyle.Primary
                        })
                    )
                ],
                ephemeral: true
            });
        } else if (channel?.parentId === ertu.settings.customRoomParent && isOwnerVoice && !isOwner) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: 'Mümkün değil!',
                        image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                        description: 'Bu komutu, yalnızca ses kanalının sahibi kullanabilir. ' 
                    })
                ],
                ephemeral: true
            });
        } else if (channel?.parentId !== ertu.settings.customRoomParent) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: 'Hata!',
                        image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                        description: `Özel oda kategorisinde olmayan bir kanalda bu işlemi gerçekleştiremezsiniz. Lütfen bir özel oda kanalında deneyin:\n\n <#${ertu.settings.privateRoomChannel}>`
                    })
                ], 
                ephemeral: true
            });
        }

        const container = new ContainerBuilder();

        const title = new TextDisplayBuilder().setContent('# Kullanıcı Bilgileri')
        container.addTextDisplayComponents(title);

        const section = new SectionBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                [
                    `→ Oda Sahibi: <@${existingRoom.owner}>`,
                    `→ Oda Adı: ${channel.name}`,
                    `→ Oda Limiti: ${channel.userLimit || 'Sınırsız'}`,
                    `→ Oda Kanalı: <#${channel.id}>`,
                ].join('\n')
            ))
            .setThumbnailAccessory(new ThumbnailBuilder().setURL(member.displayAvatarURL({ dynamic: true, size: 4096 })))

        container.addSectionComponents(section);
        container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Small));

        const allowedUsers = channel.permissionOverwrites.cache.filter(overwrite =>
            overwrite.allow.has(PermissionFlagsBits.Connect) && overwrite.type === 1
        );

        if (allowedUsers.size > 0) {
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent([
                `### İzinli Kullanıcılar (${allowedUsers.size})`,
                allowedUsers.map(user => `<@${user.id}>`).join(' ')
            ].join('\n')));
        }

        await interaction.reply({
            components: [container],
            flags: [
                MessageFlags.IsComponentsV2
            ],
            allowedMentions: { parse: [] },
            ephemeral: true
        });
    }

    if (route === 'claim') {
        if (!member.voice.channel) return interaction.update({
            embeds: [
                new EmbedBuilder({
                    title: 'Kanal Bulunamadı!',
                    image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                    description: `Geçerli bir ses kanalında değilsiniz. Lütfen bir ses kanalına katıldığınızdan emin olun:\n\n <#${ertu.settings.privateRoomChannel}>`,
                })
            ],
            components: [], 
            ephemeral: true
        });

        await SettingsModel.updateOne(
            { 
                id: member.guild.id,
                'privateRooms.channel': channel.id 
            },
            { 
                $set: { 'privateRooms.$.owner': member.id }
            }
        );

        interaction.update({ embeds: [], content: 'Oda artık size ait.', components: [], ephemeral: true });
    }
}