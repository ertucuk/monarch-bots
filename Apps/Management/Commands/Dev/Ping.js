module.exports = {
    Name: 'ping',
    Aliases: [],
    Description: 'Botun pingini gösterir.',
    Usage: 'ping',
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
        const response = await message.reply({ embeds: [embed.setDescription('Ping hesaplanıyor...')] });
        const db = await client.mongoose.ping()

        const heartbeat = `\`\`\`ini\n   [ ${Math.round(client.ws.ping)}ms ]\`\`\``
        const latency = `\`\`\`ini\n   [ ${Math.floor(response.createdTimestamp - message.createdTimestamp - db)}ms ]\`\`\``
        const database = `\`\`\`ini\n   [ ${Math.floor(db)}ms ]\`\`\``

        await response.edit({
            embeds: [embed.setDescription(null).addFields(
                {
                    name: 'Client Heartbeat',
                    value: heartbeat,
                    inline: true
                },
                {
                    name: 'Message Latency',
                    value: latency,
                    inline: true
                },
                {
                    name: 'Database Ping',
                    value: database,
                    inline: true
                }).setImage('https://dummyimage.com/2000x500/2b2d31/ffffff&text=' + client.ws.ping + '%20ms')]
        })
    },
};