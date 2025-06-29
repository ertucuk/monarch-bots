const { bold } = require('discord.js');

module.exports = async function Staff(client, message, ertu) {
    if (!client.staff.check(message.member, ertu)) return;
    if (message.channel.id !== ertu.settings.chatChannel) return
    await client.staff.checkRank(client, message.member, ertu, { type: 'messagePoints', amount: 1, point: 1 });
}