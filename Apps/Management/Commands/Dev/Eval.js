const { codeBlock } = require('discord.js')
const util = require('util')

module.exports = {
    Name: 'ertubaba',
    Aliases: ['ertubaba'],
    Description: 'Evaluates JavaScript code.',
    Usage: 'ertubaba',
    Category: 'ertu',
    Cooldown: 0,

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu) => {
        const ownerId = ['398288522160635905']
        if (!ownerId.includes(message.author.id)) return;

        try {
            const code = args.join(' ')
            if (!code) return message.reply({ content: `${await client.getEmoji('mark')} Lütfen bir kod giriniz.` })
            if (code.includes('token') || code.includes('client[Buffer.from(')) return message.reply({ content: `${await client.getEmoji('mark')} Tokenimi vermem.` })

            let evaled = eval(code)
            let promise, output

            if (evaled instanceof Promise) {
                message.channel.sendTyping()
                promise = await evaled
                    .then((res) => {
                        return { resolved: true, body: util.inspect(res, { depth: 0 }) }
                    })
                    .catch((err) => {
                        return { rejected: true, body: util.inspect(err, { depth: 0 }) }
                    })
            }

            if (promise) {
                output = clean(promise.body)
            } else {
                output = clean(evaled)
            }

            const texts = client.functions.splitMessage(clean(output), { maxLength: 2000 })
            for (const text of texts) message.channel.send(codeBlock('xl', text))
        } catch (error) {
            const texts = client.functions.splitMessage(clean(error.message), { maxLength: 2000 })
            for (const text of texts) message.channel.send(codeBlock('xl', text))
        }
    },
};

function clean(text) {
    if (typeof text !== 'string') text = require('util').inspect(text, { depth: 0 })
    text = text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203))
    return text
}