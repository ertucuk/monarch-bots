const { ActivityType } = require('discord.js');

function updatePresence(client) {
  let message = client.system.Presence.Message[0] ? client.system.Presence.Message[Math.floor(Math.random() * client.system.Presence.Message.length)] : 'made by ertu';

  client.user.setPresence({
    status: client.system.Presence.Status ? client.system.Presence.Status : 'online',
    activities: [
      {
        name: message,
        type: client.system.Presence.Type ? client.system.Presence.Type : ActivityType.Playing,
        url: 'https://www.twitch.tv/ertucuk'
      },
    ],
  });
}

module.exports = function handlePresence(client) {
  updatePresence(client);
  setInterval(() => updatePresence(client), 10 * 1000);
};