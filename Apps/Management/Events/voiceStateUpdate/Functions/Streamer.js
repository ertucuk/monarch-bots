const { SettingsModel } = require('../../../../../Global/Settings/Schemas');

module.exports = async function streamHandler(client, oldState, newState, ertu) {
    const guildId = newState.guild.id;
    const notEditedRoles = ['1007710803522240683', '1299916918358282322', '1382981972019773481', '914312633648316476', '904188905845325825']

    if (!oldState.channelId && newState.channelId) {
        const data = ertu?.streamerRooms.find(x => x.channel === newState.channelId);
        if (data) {
            const owner = newState.guild.members.cache.get(data.owner);
            if (owner?.voice?.channelId === newState.channelId) return;
        }

        const channel = newState.guild.channels.cache.get(newState.channelId);
        if (!channel || channel.parentId !== ertu.settings.streamerParent) return;

        const user = newState.guild.members.cache.get(newState.id);

        await channel.send({
            content: `🎉 Merhaba! Artık **${channel.name}** kanalının yeni sahibi ${user}! 🎊\n\n🌟 <#${channel.id}> kanalından yayıncı odanızın ayarlarını düzenleyebilirsiniz.`
        }).then(msg => setTimeout(() => msg.delete().catch(() => { }), 10000));

        await SettingsModel.updateOne(
            { id: guildId },
            {
                $push: {
                    streamerRooms: {
                        owner: newState.id,
                        channel: newState.channelId,
                        permissions: channel.permissionOverwrites.cache.map(c => ({
                            id: c.id,
                            allow: c.allow.bitfield.toString(),
                            deny: c.deny.bitfield.toString()
                        }))
                    }
                }
            }
        );

        channel.permissionOverwrites.cache.forEach(p => {
            if (!notEditedRoles.includes(p.id)) {
                p.edit({ MuteMembers: false }).catch(() => { });
            }
        });

        channel.permissionOverwrites.cache.forEach(p => {
            if (notEditedRoles.includes(p.id)) {
                p.edit({ MuteMembers: true, Stream: true }).catch(() => { });
            }
        });

        await channel.permissionOverwrites.create(user.id, {
            MuteMembers: true,
            Stream: true
        });

        return;
    }

    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        const oldData = ertu?.streamerRooms.find(x => x.channel === oldState.channelId);
        const oldChannel = oldState.guild.channels.cache.get(oldState.channelId);

        if (
            oldData &&
            oldChannel &&
            oldChannel.parentId === ertu.settings.streamerParent &&
            oldData.owner === oldState.id
        ) {
            const members = oldChannel.members.filter(m => m.id !== oldState.id && !m.user.bot);
            if (members.size > 0) {
                const newOwner = [...members.values()]
                    .sort((a, b) => b.roles.highest.position - a.roles.highest.position)[0];

                await SettingsModel.updateOne(
                    { id: oldState.guild.id, "streamerRooms.channel": oldState.channelId },
                    { $set: { "streamerRooms.$.owner": newOwner.id } }
                );

                oldChannel.permissionOverwrites.cache.forEach(p => {
                    if (!notEditedRoles.includes(p.id)) {
                        p.edit({ MuteMembers: false }).catch(() => { });
                    }
                });

                oldChannel.permissionOverwrites.cache.forEach(p => {
                    if (notEditedRoles.includes(p.id)) {
                        p.edit({ MuteMembers: true, Stream: true }).catch(() => { });
                    }
                });

                await oldChannel.permissionOverwrites.create(newOwner.id, {
                    MuteMembers: true,
                    Stream: true
                });

                await oldChannel.permissionOverwrites.delete(oldState.id);

                await oldChannel.send({
                    content: `🎉 Merhaba! Artık **${oldChannel.name}** kanalının yeni sahibi <@${newOwner.id}>! 🎊`
                }).then(msg => setTimeout(() => msg.delete().catch(() => { }), 10000));
            } else {
                const valid = [
                    ...oldChannel.guild.roles.cache.keys(),
                    ...oldChannel.guild.members.cache.keys()
                ];

                await oldChannel.permissionOverwrites.set(
                    data?.permissions?.filter(perm => valid.includes(perm.id))
                        .map(perm => ({
                            id: perm.id,
                            allow: BigInt(perm.allow),
                            deny: BigInt(perm.deny),
                        }))
            );

                await SettingsModel.updateOne({ id: oldState.guild.id }, { $pull: { streamerRooms: { channel: oldState.channelId } } });
            }
        }

        const joinedData = ertu?.streamerRooms.find(x => x.channel === newState.channelId);
        const joinedChannel = newState.guild.channels.cache.get(newState.channelId);

        if (!joinedChannel || joinedChannel.parentId !== ertu.settings.streamerParent) return;

        if (joinedData) {
            const owner = newState.guild.members.cache.get(joinedData.owner);
            const ownerInChannel = owner?.voice?.channelId === newState.channelId;

            if (!ownerInChannel && joinedData.owner !== newState.id) {
                await SettingsModel.updateOne(
                    { id: newState.guild.id, "streamerRooms.channel": newState.channelId },
                    { $set: { "streamerRooms.$.owner": newState.id } }
                );

                joinedChannel.permissionOverwrites.cache.forEach(p => {
                    if (!notEditedRoles.includes(p.id)) {
                        p.edit({ MuteMembers: false }).catch(() => { });
                    }
                });

                joinedChannel.permissionOverwrites.cache.forEach(p => {
                    if (notEditedRoles.includes(p.id)) {
                        p.edit({ MuteMembers: true, Stream: true }).catch(() => { });
                    }
                });

                await joinedChannel.permissionOverwrites.create(newState.id, {
                    MuteMembers: true,
                    Stream: true
                });

                await joinedChannel.send({
                    content: `🎉 Merhaba! Artık **${joinedChannel.name}** kanalının yeni sahibi <@${newState.id}>! 🎊\n\n🌟 <#${joinedChannel.id}> kanalından yayıncı odanızın ayarlarını düzenleyebilirsiniz.`
                }).then(msg => setTimeout(() => msg.delete().catch(() => { }), 10000));
            }
        } else {
            await SettingsModel.updateOne(
                { id: newState.guild.id },
                {
                    $push: {
                        streamerRooms: {
                            owner: newState.id,
                            channel: newState.channelId,
                            permissions: joinedChannel.permissionOverwrites.cache.map(c => ({
                                id: c.id,
                                allow: c.allow.bitfield.toString(),
                                deny: c.deny.bitfield.toString()
                            }))
                        }
                    }
                }
            );

            joinedChannel.permissionOverwrites.cache.forEach(p => {
                if (!notEditedRoles.includes(p.id)) {
                    p.edit({ MuteMembers: false }).catch(() => { });
                }
            });

            joinedChannel.permissionOverwrites.cache.forEach(p => {
                if (notEditedRoles.includes(p.id)) {
                    p.edit({ MuteMembers: true, Stream: true }).catch(() => { });
                }
            });


            await joinedChannel.permissionOverwrites.create(newState.id, {
                MuteMembers: true,
                Stream: true
            });

            await joinedChannel.send({
                content: `🎉 Merhaba! Artık **${joinedChannel.name}** kanalının sahibi <@${newState.id}> olarak ayarlandı! 🎊`
            }).then(msg => setTimeout(() => msg.delete().catch(() => { }), 10000));
        }

        return;
    }

    if (oldState.channelId && !newState.channelId) {
        const data = ertu?.streamerRooms.find(x => x.channel === oldState.channelId);
        if (!data || data.owner !== oldState.id) return;

        const channel = oldState.guild.channels.cache.get(data.channel);
        if (!channel || channel.parentId !== ertu.settings.streamerParent) return;

        const members = channel.members.filter(m => m.id !== oldState.id);

        const newOwner = [...members.values()]
            .filter(m => !m.user.bot)
            .sort((a, b) => b.roles.highest.position - a.roles.highest.position)[0];

        if (newOwner) {
            await channel.permissionOverwrites.create(newOwner.id, {
                MuteMembers: true,
                Stream: true
            });

            await channel.permissionOverwrites.delete(oldState.id).catch(() => { });

            await channel.send({
                content: `🎉 Merhaba! Artık **${channel.name}** kanalının yeni sahibi ${newOwner}! 🎊\n\n🌟 <#${channel.id}> kanalından yayıncı odanızın ayarlarını düzenleyebilirsiniz.`
            }).then(msg => setTimeout(() => msg.delete().catch(() => { }), 10000));

            await SettingsModel.updateOne(
                { id: guildId, "streamerRooms.channel": oldState.channelId },
                { $set: { "streamerRooms.$.owner": newOwner.id } }
            );
        } else {
            const valid = [
                ...channel.guild.roles.cache.keys(),
                ...channel.guild.members.cache.keys()
            ];

            await channel.permissionOverwrites.set(
                data.permissions
                    .filter(perm => valid.includes(perm.id))
                    .map(perm => ({
                        id: perm.id,
                        allow: BigInt(perm.allow),
                        deny: BigInt(perm.deny),
                    }))
            );

            await SettingsModel.updateOne(
                { id: guildId },
                { $pull: { streamerRooms: { channel: oldState.channelId } } }
            );
        }

        return;
    }
};