const { UserModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
    Name: 'coinekle',
    Aliases: ['addcoin', 'coinadd'],
    Description: 'Kullanıcıya coin ekler.',
    Usage: 'coinekle',
    Category: 'Root',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu, embed) => {

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        if (!member) {
            client.embed(message, 'Bir kullanıcı belirtmelisin.');
            return;
        }

        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount <= 0) {
            client.embed(message, 'Geçerli bir miktar belirtmelisin.');
            return;
        }

        await UserModel.updateOne(
            { id: member.id },
            { $inc: { monarchCoin: amount } },
            { upsert: true }
        );

        message.channel.send({
            content: `${member} kullanıcısına ${amount} Mcoin eklendi.`,
        });
      
    },
};