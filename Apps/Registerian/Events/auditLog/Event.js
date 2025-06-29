const { Events, AuditLogEvent } = require('discord.js');
const { logHandler, tagHandler, nameHandler, banHandler } = require('./Functions');

module.exports = {
    Name: Events.GuildAuditLogEntryCreate,
    System: true,

    execute: async (client, log, guild) => {
        const ertu = guild?.find?.settings

        if (log.action === AuditLogEvent.MemberUpdate) {
            logHandler(client, log, guild);
            nameHandler(client, log, guild, ertu);
            tagHandler(client, log, guild, ertu);
        }

        if (log.action === AuditLogEvent.MemberBanAdd) {
            banHandler(client, log, guild, ertu);
        }
    }
};          