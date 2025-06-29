const { Events, EmbedBuilder, inlineCode, bold } = require('discord.js');
const { schedule } = require('node-cron');
const { Presence } = require('../../../Global/Helpers');
const { SettingsModel, PunitiveModel, StaffModel } = require('../../../Global/Settings/Schemas');

module.exports = {
    Name: Events.ClientReady,
    System: true,

    execute: async (client) => {
        Presence(client);
        const channel = client.channels.cache.get(client.system.channelID);
        if (channel) await channel.join({ selfDeaf: true, selfMute: true, Interval: true });

        const guild = client.guilds.cache.get(client.system.serverID);
        if (!guild) return client.logger.error('Failed to fetch server data.', `https://discord.com/api/oauth2/authorize?client_id=${client.user?.id}&permissions=0&scope=bot+applications.commands`);

        await guild.updateSecretRooms()
        await guild.updateLocaRooms()
        await guild.watcher()

        const document = await SettingsModel.findOne({ id: guild.id });
        const { settings } = document

        schedule('0 0 * * *', async () => {
            const document = await StaffModel.find();

            document.forEach(async (staff) => {
                await StaffModel.updateOne(
                    { user: staff.user },
                    { $set: { dailyPoints: 0 } }
                ).catch(() => { });
            });

            document.forEach(async (staff) => {
                const newExcuses = staff.excuses.filter((e) => e?.endAt > Date.now());
                await StaffModel.updateOne(
                    { user: staff.user },
                    { $set: { excuses: newExcuses } }
                ).catch(() => { });

                const generalExcuseRole = guild.roles.cache.find(x => x.name === '† Genel Mazeret');
                const member = guild.members.cache.get(staff.user);
                if (member && member.roles.cache.has(generalExcuseRole.id)) await member.roles.remove(generalExcuseRole.id).catch(() => { });
            });

            const ids = [];
            const ertu = await guild.getSettings();

            ertu.staffRanks.filter(r => r.type !== 'sub').map((r) => r.role).forEach(async (id) => {
                const role = await guild.roles.fetch(id);
                if (role) role.members.forEach((m) => ids.push(m.id));
            });
        });

        async function checkUnregisters() {
            const noRoleMembers = guild.members.cache.filter(m => m.roles.cache.filter(r => r.id !== guild.id).size == 0)
            noRoleMembers.forEach(member => {
                if (member.manageable) member.setNickname(`${member.tag()} İsim | Yaş`).catch();
                if (member.manageable) member.setRoles(settings.unregisterRoles).catch()
            })
        }

        async function checkPunishs(type) {
            const punitiveTypes = {
                ChatMute: settings.chatMuteRole,
                VoiceMute: settings.voiceMuteRole,
                Quarantine: settings.quarantineRole,
                Ads: settings.adsRole,
                Event: settings.eventPenaltyRole,
                Streamer: settings.streamPenaltyRole,
                Public: settings.publicPenaltyRole,
            };

            if (!punitiveTypes[type]) return;

            const document = await PunitiveModel.find({ active: true, type })
            if (!document || document.length === 0) return;

            await Promise.all(document.map(async (data) => {
                const member = guild.members.cache.get(data.user);
                const role = punitiveTypes[type];

                if (!member && data.finishedTime && Date.now() >= data.finishedTime) {
                    await PunitiveModel.updateOne({ id: data.id }, { $set: { active: false } });
                    return;
                }

                const minStaffRole = this.guild?.roles.cache.get(settings.minStaffRole);
                const roles = document && document?.roles && document?.roles?.length > 0
                    ? document?.roles.filter(roleId => {
                        const role = this.guild.roles.cache.get(roleId);
                        return role && minStaffRole ? role.position < minStaffRole.position : true;
                    })
                    : settings.unregisterRoles;

                if (member) {
                    if (data.finishedTime && Date.now() >= data.finishedTime) {
                        if (type === 'VoiceMute' && member.voice.channel) {
                            await member.voice.setMute(false).catch(() => { });
                        }
                        if (type === 'Quarantine' || type === 'Ads') {
                            await member.setRoles(roles).catch(() => { });
                        } else {
                            await member.roles.remove(role).catch(() => { });
                        }
                        await PunitiveModel.updateOne({ id: data.id }, { $set: { active: false } });
                    } else {
                        if (type === 'VoiceMute' && member.voice.channel) {
                            await member.voice.setMute(true).catch(() => { });
                        }
                        if (type === 'Quarantine' || type === 'Ads') {
                            await member.setRoles(role).catch(() => { });
                        } else {
                            await member.roles.add(role).catch(() => { });
                        }
                    }
                }
            }));
        }

        setInterval(async () => {
            await checkPunishs('ChatMute');
            await checkPunishs('VoiceMute');
            await checkPunishs('Quarantine');
            await checkPunishs('Ads');
            await checkPunishs('Event');
            await checkPunishs('Streamer');
        }, 60000);

        setInterval(() => {
            checkUnregisters()
        }, 20000)
    }
};