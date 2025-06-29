const { Client, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { serverID } = require('../../Settings/System');

module.exports = Object.defineProperties(Client.prototype, {
    embed: {
        value: function (message, data) {
            message.channel.send({
                embeds: [
                    new EmbedBuilder({
                        footer: { text: message.guild.name + ' | ' + `Created By Ertu`, iconURL: message.guild.iconURL({ dynamic: true, size: 2048 }) },
                        description: `>>> ${data.substring(0, 3000)}`,
                    })
                ]
            }).then(x => { setTimeout(() => { x.delete().catch((e) => { }); }, 10000); }).catch((e) => { });
        }
    },

    await: {
        value: async function(time) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, time);
            });
        }
    },

    timestamp: {
        value: function (date, flag = 'R') {
            function isInt(value) {
                return Number.isInteger(value);
            }

            if (typeof date === 'number' || isInt(date)) {
                return `<t:${Math.trunc(+date / 1000)}:${flag}>`;
            }
            return `<t:${Math.trunc(date.valueOf() / 1000)}:${flag}>`;
        }
    },

    getEmoji: {
        value: async function (emojiName) {
            const emoji = this.emojis.cache.find(e => e.name === emojiName) || null;
            if (emoji) return emoji;
            else return '';
        }
    },

    getEmojiID: {
        value: async function (emojiName) {
            const emoji = this.emojis.cache.find(e => e.name === emojiName) || null;
            if (emoji) return emoji.id;
            else return '';
        }
    },

    getChannel: {
        value: async function (channelKey, interaction) {
            if (interaction) {
                return interaction.guild.channels.cache.find(c => c.name === channelKey) || interaction.guild.channels.cache.find(c => c.id === channelKey) || null
            } else {
                const guild = await this.guilds.fetch(serverID);

                return guild.channels.cache.find(c => c.name === channelKey) || guild.channels.cache.find(c => c.id === channelKey) || null
            }
        },
    },

    getRole: {
        value: async function (roleKey, interaction) {
            if (interaction) {
                return interaction.guild.roles.cache.find(r => r.name === roleKey) || interaction.guild.roles.cache.find(c => c.id === roleKey) || null
            } else {
                const guild = await this.guilds.fetch(serverID);

                return guild.roles.cache.find(c => c.name === roleKey) || guild.channels.cache.find(c => c.id === roleKey) || null
            }
        },
    },

    getServer: {
        value: async function (serverID) {
            if (this.shard) for (let shardId of this.shard.ids) {
                var guild = await this.guilds.fetch(serverID, { shardId });
                if (guild) return guild;
            }

            return await this.guilds.fetch(serverID);
        }
    },

    getMember: {
        value: async function (userID) {
            try {
                return await this.users.fetch(userID);
            } catch (error) {
                return undefined;
            }
        }
    },

    getBan: {
        value: async function (guild, user) {
            try {
                return await guild.bans.fetch(user.id);
            } catch (err) {
                return undefined;
            }
        }
    },

    getButton: {
        value: function (page, total) {
            return new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('first')
                        .setEmoji('1070037431690211359')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === 1),
                    new ButtonBuilder()
                        .setCustomId('previous')
                        .setEmoji('1061272577332498442')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === 1),
                    new ButtonBuilder()
                        .setCustomId('count')
                        .setLabel(`${page}/${total}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setEmoji('1061272499670745229')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(total === page),
                    new ButtonBuilder()
                        .setCustomId('last')
                        .setEmoji('1070037622820458617')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === total),
                );
        }
    },

    getColor: {
        value: function (type = 'random' || 'green' || 'red' || 'clear', string = false) {
            switch (type) {
                case 'random':
                    return Math.floor(Math.random() * (0xffffff + 1));
                case 'green':
                    return string ? '#6DFF69' : 0x00FF00;
                case 'red':
                    return string ? '#FF0000' : 0xFF0000;
                case 'clear':
                    return string ? '#2B2D31' : 0x2B2D31;
                default:
                    return 0x000000;
            }
        }
    },
});