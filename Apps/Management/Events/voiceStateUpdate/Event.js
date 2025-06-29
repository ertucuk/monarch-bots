const { Events } = require('discord.js');
const { roomHandler, streamHandler } = require('./Functions');
const { SettingsModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
    Name: Events.VoiceStateUpdate,
    System: true,

    execute: async (client, oldState, newState) => {
        if (oldState.member && oldState.member.user.bot || newState.member && newState.member.user.bot) return;

        const ertu = await SettingsModel.findOne({ id: newState.guild.id });
        roomHandler(client, oldState, newState, ertu)
       streamHandler(client, oldState, newState, ertu)
    }
};

