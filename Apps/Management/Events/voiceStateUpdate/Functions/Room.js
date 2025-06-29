const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { SettingsModel } = require('../../../../../Global/Settings/Schemas');

module.exports = async function roomHandler(client, oldState, newState, ertu) {
    if (newState.channelId === ertu?.settings?.privateRoomChannel) {
        const member = newState.guild.members.cache.get(newState.id);
        const roomControl = (ertu?.privateRooms || []).find(x => x.owner === member.id);
        if (roomControl) {
            const rooms = Array.isArray(roomControl) ? roomControl : [roomControl];
            for (const room of rooms) {
                const channel = member.guild.channels.cache.get(room?.channel);
                if (!channel) {
                    await SettingsModel.updateOne({ id: member.guild.id }, { $pull: { privateRooms: { owner: member.id } } });
                    return;
                } else {
                    if (channel.members.size === 0) {
                        await channel.delete();
                        await SettingsModel.updateOne({ id: member.guild.id }, { $pull: { privateRooms: { owner: member.id } } });
                    }
                }
            }
        }

        const perms = [
            {
                id: newState.guild.id,
                deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.SendMessages]
            },
            {
                id: member.id,
                allow: [
                    PermissionFlagsBits.Connect,
                    PermissionFlagsBits.Stream,
                    PermissionFlagsBits.Speak,
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages
                ]
            },
        ];

        ertu?.settings.womanRoles.forEach((role) => {
            if (newState.guild.roles.cache.has(role)) {
                perms.push({
                    id: role,
                    allow: [PermissionFlagsBits.ViewChannel]
                });
            }
        });

        ertu?.settings.manRoles.forEach((role) => {
            if (newState.guild.roles.cache.has(role)) {
                perms.push({
                    id: role,
                    allow: [PermissionFlagsBits.ViewChannel]
                });
            }
        });

        ertu?.settings.unregisterRoles.forEach((role) => {
            if (newState.guild.roles.cache.has(role)) {
                perms.push({
                    id: role,
                    deny: [PermissionFlagsBits.ViewChannel]
                });
            }
        });

        const newChannel = await newState.guild.channels.create({
            name: `${newState.member.user.username}`,
            type: ChannelType.GuildVoice,
            parent: newState.channel.parentId,
            permissionOverwrites: perms
        }).catch(() => null);

        if (!newChannel) return;

        newState.setChannel(newChannel);

        await newState.guild?.updateSettings({
            $push: {
                privateRooms: {
                    owner: member.id,
                    channel: newChannel.id,
                    last: Date.now()
                }
            }
        });
    }
}