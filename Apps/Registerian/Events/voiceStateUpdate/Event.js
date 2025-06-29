const { Events } = require('discord.js');
const { Camera, Stream, Voice, Punish } = require('./Functions');

module.exports = {
    Name: Events.VoiceStateUpdate,
    System: true,

    execute: async (client, oldState, newState) => {
        if (!oldState.guild || !oldState.member || !newState.member || !newState.guild || (oldState.guild || newState.guild).id !== client.system.serverID) return;

        try {
            Punish(client, newState, newState.guild.find);
            if (!oldState.streaming && newState.streaming)
                Stream(client, oldState, oldState.guild.find);
            if (oldState.streaming && !newState.streaming)
                Stream(client, oldState, oldState.guild.find, true);
            if (!oldState.selfVideo && newState.selfVideo)
                Camera(client, oldState, oldState.guild.find);
            if (oldState.selfVideo && !newState.selfVideo)
                Camera(client, oldState, oldState.guild.find, true);
            if ((!oldState.channelId && newState.channelId) || (newState.channelId && newState.channelId !== oldState.channelId))
                Voice(client, newState, newState.guild.find);
            if (oldState.channelId && !newState.channelId)
                Voice(client, oldState, oldState.guild.find, true);
        } catch (error) {
            client.logger.error('@voiceStateUpdate', error);
        }
    }
};