const { Events } = require('discord.js');
const { Stat, Staff } = require('./Functions');

module.exports = {
    Name: Events.VoiceStateUpdate,
    System: true,

    execute: async (client, oldState, newState) => {
        if (!(oldState.member || !newState.member) || (oldState.member?.user.bot || newState.member?.user.bot) || !(oldState.guild || newState.guild) || (oldState.guild || newState.guild).id !== client.system.serverID) return;

        try {
            Staff(client, oldState, newState, oldState?.guild?.find);
            Stat(client, oldState, newState);
        } catch (error) {
            client.logger.error('@voiceStateUpdate', error);
        }
    }
};