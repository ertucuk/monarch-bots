const { Events } = require('discord.js');
const { Presence } = require('../../../Global/Helpers');
const { SettingsModel } = require('../../../Global/Settings/Schemas');
const { CronJob } = require('cron');

module.exports = {
    Name: Events.ClientReady,
    System: true,

    execute: async (client) => {
        Presence(client);
        const channel = client.channels.cache.get(client.system.channelID);
        if (channel) await channel.join({ selfDeaf: true, selfMute: true, Interval: true });

        const guild = client.guilds.cache.get(client.system.serverID);
        if (!guild) return client.logger.error('Failed to fetch server data.', `https://discord.com/api/oauth2/authorize?client_id=${client.user?.id}&permissions=0&scope=bot+applications.commands`);

        await guild.watcher()

        const document = await SettingsModel.findOne({ id: guild.id });
        if (!document) {
            client.logger.error('Settings document not found for the server.', `https://discord.com/api/oauth2/authorize?client_id=${client.user?.id}&permissions=0&scope=bot+applications.commands`);
            return;
        }

        const staffLeaves = new CronJob('0 0 * * *', async () => {
            const logChannel = client.channels.cache.find(c => c.name === client.data.logs.unstaff)
            if (!logChannel) return;

            if (document?.staffLeaves.length == 0) {
                logChannel.send({ content: `Bugün kimse yetkiyi bırakmamış. Çalışmaya devam!` });
                return;
            }

            await SettingsModel.updateOne({ id: guild.id }, { $set: { staffLeaves: [] } });
            logChannel.send({
                content: `Bugün ${document?.staffLeaves.length} kişi yetkiyi bırakmış.\n\n${document?.staffLeaves.map((d) => {
                    const roles = d.roles.map((r) => `<@&${r}>`).join(', ');
                    const timestamp = client.timestamp(d.timestamp);
                    return `[${timestamp}] <@${d.id}>: ${roles}`;
                }).join('\n')}`
            });
        }, null, true, 'Europe/Istanbul');
        staffLeaves.start();

        const tagLeaves = new CronJob('* * * * *', async () => {
            const logChannel = client.channels.cache.find(c => c.name === client.data.logs.tagleave);
            if (!logChannel) return;

            if (document?.tagLeaves.length == 0) {
                logChannel.send({ content: `Bugün kimse tagımızı bırakmamış. Çalışmaya devam!` });
                return;
            }

            await SettingsModel.updateOne({ id: guild.id }, { $set: { tagLeaves: [] } });
            logChannel.send({
                content: `Bugün ${document?.tagLeaves.length} kişi tagımızı bırakmış. @everyone\n\n${document?.tagLeaves.map((d) => {
                    const roles = d.roles.map((r) => `<@&${r}>`).join(', ');
                    const timestamp = client.timestamp(d.timestamp);
                    return `[${timestamp}] <@${d.id}>: ${roles}`;
                }).join('\n')}`
            });
        }, null, true, 'Europe/Istanbul');
        tagLeaves.start();
    }
};