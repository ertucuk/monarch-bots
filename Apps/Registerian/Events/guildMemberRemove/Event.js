const { Events } = require('discord.js');
const { UserModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
    Name: Events.GuildMemberRemove,
    System: true,

    execute: async (client, member) => {
        if (member.guild.id !== client.system.serverID || member.user.bot || !member.guild.find) return;

        const document = await UserModel.findOne({ id: member.id });
        if (document && document?.name && document?.nameLogs) {
            document.nameLogs.push(
                {
                    type: 'Sunucudan Ayrılma',
                    date: Date.now(),
                    name: document.name 
                }
            )

            await document.save();
        }
    }
};