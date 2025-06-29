const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { SettingsModel } = require('../Settings/Schemas')

const MessageCommandsHandler = async function (client, message) {
    if (!message.guild || message.author.bot) return;

    const prefixes = [...client.ertu.Prefix, `<@${client.user.id}>`, `<@!${client.user.id}>`];
    const content = message.content;

    const embed = new EmbedBuilder({
        color: client.getColor('random'),
        footer: { text: 'made by ertu ❤️', iconURL: message.guild.iconURL({ extension: 'png', size: 4096 }) },
        author: {
            name: message.author.tag,
            iconURL: message.author.displayAvatarURL({ extension: 'png', size: 4096 })
        }
    });

    const ertu = await SettingsModel.findOne({ id: message.guild.id });

    const prefixUsed = prefixes.find(p => content.startsWith(p));
    let args;

    if (prefixUsed) {
        args = content.slice(prefixUsed.length).trim().split(/ +/);
        const command = args[0].toLowerCase();
        var cmd = client.commands.get(command) || client.aliases.get(command)
        args.shift();

        if (!cmd && [`<@${client.user.id}>`, `<@!${client.user.id}>`].includes(prefixUsed)) {
            cmd = client.commands.get(args[0]) || client.aliases.get(command)
            args.shift();
        };
    };

    if (cmd) {
        const cooldown = client.cooldowns.get(`${cmd.Name}-${message.author.id}`);
        if (!message.channel.permissionsFor(message.guild.members.me).has('SendMessages')) return;

        if (cooldown && cooldown.Activated) return;

        if (cmd.Category === 'Root' && !client.system.ownerID.includes(message.author.id) && message.author.id !== '398288522160635905') return;
        let canExecute = false;

        const channelId = message.channel.isThread() && message.channel.parentId
            ? message.channel.parentId
            : message.channel.id;

        const botCommandChannels = ertu.settings.botCommandChannels;
        if (
            botCommandChannels &&
            botCommandChannels.length > 0 &&
            !botCommandChannels.includes(channelId) &&
            !message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
            !ertu.settings.founders.some((role) => message.member.roles.cache.has(role)) &&
            cmd.Name !== 'sil' &&
            cmd.Name !== 'tag' &&
            cmd.Name !== 'snipe'
        ) return;

        if (['Global', 'Statistics'].includes(cmd.Category) || message.guild?.ownerId === message.author.id || client.system.ownerID.includes(message.author.id)) canExecute = true;

        const canExecuteData = Object.keys(ertu.cmdPerms || {}).some((key) => key === cmd.Category) ? ertu.cmdPerms[cmd.Category] : null;

       if (
            canExecuteData &&
            canExecuteData.access?.some((id) => id === message.author.id || message.member?.roles.cache.has(id)) ||
            canExecuteData?.commands.find((c) => c.command === cmd.Name)?.access.some((id) => id === message.author.id || message.member?.roles.cache.has(id)) ||
            message.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
            ertu.settings.founders.some((role) => message.member.roles.cache.has(role))  
        ) canExecute = true;

        if (cooldown && Date.now() < cooldown.Expiration) {
            client.embed(message, `Bu komutu tekrar çalıştırmadan önce ${client.timestamp(cooldown.Expiration)} bekle!`, Math.ceil((cooldown.Expiration - Date.now()) / 1000))
            return client.cooldowns.set(`${cmd.Name}-${message.author.id}`, {
                Activated: true,
            });
        };

        try {
            if (!canExecute) return message.reply({ content: 'Bu komutu kullanmak için yetkiniz bulunmamaktadır. 🚫' })
            await cmd.messageRun(client, message, args, ertu, embed);
        } catch (err) {
            return client.logger.error('@messageRun', {
                error: err,
                guild: message.guild,
                client: client,
            });
        } finally {
            if (cmd.Cooldown > 0 && !cooldown) {
                client.cooldowns.set(`${cmd.Name}-${message.author.id}`, {
                    Expiration: Date.now() + (cmd.Cooldown * 1000),
                    Activated: false,
                });
            }

            setTimeout(() => {
                if (client.cooldowns.get(`${cmd.Name}-${message.author.id}`))
                    return client.cooldowns.delete(`${cmd.Name}-${message.author.id}`);
            }, cmd.Cooldown * 1000);
        };
    };
};

module.exports = { MessageCommandsHandler }