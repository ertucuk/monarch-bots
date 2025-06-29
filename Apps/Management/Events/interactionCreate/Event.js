const { Events } = require('discord.js');
const { SecretRoom, MemberPanel, Streamer, Punish, Invasion, Menu, Solver, StreamerRoom, Cam, Meeting, Loca, Task, Excuse, Responsibility, Orientation } = require('./Functions');
const { SettingsModel } = require('../../../../Global/Settings/Schemas'); 

module.exports = {
    Name: Events.InteractionCreate,
    System: true,

    execute: async (client, interaction) => {
        if (interaction.isButton() || interaction.isAnySelectMenu() || interaction.isModalSubmit()) {
            const value = interaction.customId.split(':')[0]; 

            const ertu = await SettingsModel.findOne({ id: interaction.guild.id });
            if (!ertu) return;

            if (value === 'secretroom') return SecretRoom(client, interaction, interaction.customId.split(':')[1], ertu)
            if (value === 'member') return MemberPanel(client, interaction, interaction.customId.split(':')[1]);
            if (value === 'streamer') return Streamer(client, interaction, interaction.customId.split(':')[1], ertu);
            if (value === 'punish') return Punish(client, interaction, interaction.customId.split(':')[1], ertu);
            if (value === 'check') return Invasion(client, interaction, interaction.customId.split(':')[1], ertu);
            if (value === 'rolepanel') return Menu(client, interaction, interaction.customId.split(':')[1], ertu);
            if (value === 'solver') return Solver(client, interaction, interaction.customId.split(':')[1], ertu);
            if (value === 'streamerRoom') return StreamerRoom(client, interaction, interaction.customId.split(':')[1], ertu);
            if (value === 'cam') return Cam(client, interaction, interaction.customId.split(':')[1], ertu);
            if (value === 'meeting') return Meeting(client, interaction, interaction.customId.split(':')[1], ertu);
            if (value === 'loca') return Loca(client, interaction, interaction.customId.split(':')[1], ertu);
            if (value === 'task') return Task(client, interaction, interaction.customId.split(':')[1], ertu);
            if (value === 'excuse') return Excuse(client, interaction, interaction.customId.split(':')[1], ertu);
            if (value === 'responsibility') return Responsibility(client, interaction, interaction.customId.split(':')[1], ertu);
            if (value === 'staff') return Orientation(client, interaction, interaction.customId.split(':')[1], ertu);
        };
    }
};