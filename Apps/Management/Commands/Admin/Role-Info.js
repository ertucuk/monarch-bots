const { PermissionsBitField: { Flags }, ApplicationCommandOptionType, codeBlock } = require('discord.js');

module.exports = {
    Name: 'rolsay',
    Aliases: ['rol-bilgi', 'roleinfo', 'role-info', 'rolinfo', 'rolbilgi'],
    Description: 'Belirtilen rolün detaylarını gösterir.',
    Usage: 'rolsay <@Rol/RolID>',
    Category: 'Admin',
    Cooldown: 0,

    Command: { Prefix: true },

    messageRun: async (client, message, args) => {

        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        if (!role || role.id === message.guild?.id) {
            client.embed(message, 'Geçerli bir rol belirtmelisiniz.')
            return;
        }
        
        const member = await message.guild.members.fetch();

        const char = args.includes('@') ? ', ' : '\n';
        const members = member.filter(m => m.roles.cache.has(role.id));

        const roleInfo = `${role.name} (${role.id}) | Rolde ${members.size} kişi bulunuyor.`;
        const memberList = members.map(member => `ID: <@${member.id}> - Kullanıcı Adı: ${member.displayName}`).join(char);

        const text = `${codeBlock('js', roleInfo)}\n${codeBlock('js', memberList)}`;
        const texts = client.functions.splitMessage(text, { maxLength: 1500, char });

        for (const part of texts) {
            message.channel.send(part);
        }
    },
}