const { Events } = require('discord.js');
const { Staff, Tag } = require('./Functions');
const { SettingsModel } = require('../../../../Global/Settings/Schemas'); 

module.exports = {
    Name: Events.InteractionCreate,
    System: true,

    execute: async (client, interaction) => {
        if (interaction.isButton() || interaction.isAnySelectMenu() || interaction.isModalSubmit()) {
            const value = interaction.customId.split(':')[0]; 

            const ertu = await SettingsModel.findOne({ id: interaction.guild.id });
            if (!ertu) return;

            if (value === 'staff') return Staff(client, interaction, interaction.customId.split(':')[1], ertu);
            if (value === 'tag') return Tag(client, interaction, interaction.customId.split(':')[1], ertu);
        };
    }
};