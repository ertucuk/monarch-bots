const Boolean = require('./System');
const String = require('./String');
const Role = require('./Role');
const Channel = require('./Channel');
const Limit = require('./Limit');
const Command = require('./Command');
const Staff = require('./Staff');
const settings = require('../../../../../../Global/Settings/Server/Settings.json');
const { SettingsModel } = require('../../../../../../Global/Settings/Schemas');

module.exports = async function Loader(client, message, bot, type) {
    const rows = await message.guild?.getRows(type ? type : 'main');
    const question = await (bot && type ? bot.edit({ components: rows }) : message.channel.send({ components: rows }));
    const ertu = await SettingsModel.findOne({ id: message.guild.id });

    const filter = (i) => i.user.id === message.author.id;
    const collector = question.createMessageComponentCollector({
        filter,
        time: 1000 * 60 * 10,
    });

    collector.on('collect', async (i) => {
        i.deferUpdate();

        const value = i.isButton() ? i.customId : i.values[0];

        if (value === 'setup:main') {
            const rows = await message.guild?.getRows('main');
            question.edit({ components: rows });
            return;
        }

        if (value === 'setup:second') {
            const rows = await message.guild?.getRows('second');
            question.edit({ components: rows });
            return;
        };

        collector.stop('ertu BABA PRO');

        const option = Object.values(settings).flat().find(x => x.value === value);

        if (option && option.type === 'boolean') return Boolean(client, message, option, ertu, question, message.author.id, Loader)
        if (option && option.type === 'string') return String(client, message, option, ertu, question, message.author.id, option.mainPage === true ? 'main' : 'second', Loader);
        if (option && option.type === 'role') return Role(client, message, option, ertu, question, message.author.id, option.mainPage === true ? 'main' : 'second', Loader);
        if (option && option.type === 'channel') return Channel(client, message, option, ertu, question, message.author.id, option.mainPage === true ? 'main' : 'second', Loader);
        if (option && option.type === 'limit') return Limit(client, message, option, ertu, question, message.author.id, option.mainPage === true ? 'main' : 'second', Loader);
        if (option && option.type === 'staff') return Staff(client, message, option, ertu, question, message.author.id, option.mainPage === true ? 'main' : 'second', Loader);
        if (!option) return Command(client, question, value.split(':')[1], ertu, message, 'second', Loader);
    });

    collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            question.edit({ components: [client.functions.timesUp()] });
        }
    });
}