const { codeBlock  } = require('discord.js');
const children = require('child_process');

module.exports = {
    Name: 'pm2',
    Aliases: [],
    Description: 'PM2 Command',
    Usage: 'pm2',
    Category: 'Root',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args) => {
        if (!args) return message.reply({ content: '.pm2 <restart/stop/start/list> (Proc ID)' })

        const ls = children.exec(`pm2 ${args.join(' ')}`);
        ls.stdout.on('data', async function (content) {
            if (content.length > 2000) {
                const chunks = client.functions.splitMessage(content, 2000);
                for (const chunk of chunks) {
                    await message.channel.send({ content: codeBlock(chunk) });
                }
            } else {
                await message.channel.send({ content: codeBlock(content) });
            }
        });
    },
};

function clean(string) {
    if (typeof text === "string") {
        return string.replace(/`/g, "`" + String.fromCharCode(8203))
            .replace(/@/g, "@" + String.fromCharCode(8203))
    } else {
        return string;
    }
}