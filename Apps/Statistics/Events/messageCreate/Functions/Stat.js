module.exports = async function Stat(client, message) {
    client.functions.addStat({
        type: 'message',
        member: message.author,
        message: message,
    })
}