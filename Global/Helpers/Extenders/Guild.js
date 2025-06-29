const {
  Guild,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');
const { SettingsModel } = require('../../Settings/Schemas');

const HelpTitle = {
  admin: 'Yetkili Komutları',
  moderation: 'Moderasyon Komutları',
  register: 'Kayıt Komutları',
  staff: 'Görev Komutları',
  founder: 'Kurucu Komutları',
};

module.exports = Object.defineProperties(Guild.prototype, {
  fetchSettings: {
    value: async function () {
      return (this.find = await SettingsModel.findOneAndUpdate(
        { id: this.id },
        {},
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ));
    },
  },

  set: {
    value: async function (settings) {
      try {
        logger.log(
          `Guild: [${this.id}] updated settings: ${Object.keys(settings)}`
        );
        if (Object.keys(this.settings).length > 0) {
          await SettingsModel.findOneAndUpdate(
            { id: this.id },
            { $set: settings }
          );
        } else {
          const newGuild = new SettingsModel(
            Object.assign({ id: this.id }, { $set: settings })
          );
          await newGuild.save();
        }

        return this.fetchSettings();
      } catch (error) {
        logger.error(
          `Failed to update settings for Guild: [${this.id}]. Error: ${error}`
        );
      }
    },
  },

  getSettings: {
    value: async function () {
      let document = await SettingsModel.findOne({ id: this.id });

      if (!document) document = await new SettingsModel({ id: this.id }).save();

      const documentObject = document.toObject();

      const { $setOnInsert, _id, __v, ...cleanObject } = documentObject;

      this.settings = cleanObject;
      return document;
    },
  },

  updateSettings: {
    value: async function (update, options) {
      await SettingsModel.updateOne({ id: this.id }, update, {
        upsert: true,
        ...options,
      });
      this.getSettings();
    },
  },

  deleteDB: {
    value: async function () {
      return await SettingsModel.deleteOne({ id: this.id });
    },
  },

  settings: {
    value: {},
    writable: true,
  },

  getRows: {
    value: async function (type) {
      await this.getSettings();

      const rows = [
        new ActionRowBuilder({
          components: [
            new ButtonBuilder({
              custom_id: 'setup:main',
              label: 'Genel Ayarlar',
              style: ButtonStyle.Secondary,
            }),

            new ButtonBuilder({
              custom_id: 'setup:second',
              label: 'Moderasyon / Limitler',
              style: ButtonStyle.Secondary,
            }),
          ],
        }),
      ];

      if (type === 'main') {
        rows[0].components[0].setDisabled(true);

        rows.push(
          new ActionRowBuilder({
            components: [
              new StringSelectMenuBuilder({
                custom_id: 'setup:systems',
                placeholder: 'Sunucunun Sistemleri',
                options: this.client.server.Systems.map((d) => ({
                  label: d.name,
                  description: d.description,
                  value: d.value,
                  emoji: {
                    id: this.settings[d.root][d.value]
                      ? '1292054202499076117'
                      : '1292054129207808093',
                  },
                })),
              }),
            ],
          })
        );

        rows.push(
          new ActionRowBuilder({
            components: [
              new StringSelectMenuBuilder({
                custom_id: 'setup:general',
                placeholder: 'Sunucunun Genel Ayarları',
                options: this.client.server.General.map((d) => ({
                  label: d.name,
                  description: d.description,
                  value: d.value,
                  emoji: {
                    id: this.client.functions.control(
                      this.settings[d.root][d.value]
                    )
                      ? '1292054202499076117'
                      : '1292054129207808093',
                  },
                })),
              }),
            ],
          })
        );

        rows.push(
          new ActionRowBuilder({
            components: [
              new StringSelectMenuBuilder({
                custom_id: 'setup:roles',
                placeholder: 'Sunucunun Rol Ayarları',
                options: this.client.server.Roles.map((d) => ({
                  label: d.name,
                  description: d.description,
                  value: d.value,
                  emoji: {
                    id: this.client.functions.control(
                      this.settings[d.root][d.value]
                    )
                      ? '1292054202499076117'
                      : '1292054129207808093',
                  },
                })),
              }),
            ],
          })
        );

        rows.push(
          new ActionRowBuilder({
            components: [
              new StringSelectMenuBuilder({
                custom_id: 'setup:channels',
                placeholder: 'Sunucunun Kanal Ayarları',
                options: this.client.server.Channels.map((d) => ({
                  label: d.name,
                  description: d.description,
                  value: d.value,
                  emoji: {
                    id: this.client.functions.control(
                      this.settings[d.root][d.value]
                    )
                      ? '1292054202499076117'
                      : '1292054129207808093',
                  },
                })),
              }),
            ],
          })
        );
      } else {
        rows[0].components[1].setDisabled(true);

        rows.push(
          new ActionRowBuilder({
            components: [
              new StringSelectMenuBuilder({
                custom_id: 'setup:moderation',
                placeholder: 'Sunucunun Moderasyon Ayarları',
                options: this.client.server.Moderation.map((d) => ({
                  label: d.name,
                  description: d.description,
                  value: d.value,
                  emoji: {
                    id: this.client.functions.control(
                      this.settings[d.root][d.value]
                    )
                      ? '1292054202499076117'
                      : '1292054129207808093',
                  },
                })),
              }),
            ],
          })
        );

        rows.push(
          new ActionRowBuilder({
            components: [
              new StringSelectMenuBuilder({
                custom_id: 'setup:limit',
                placeholder: 'Sunucunun Limit Ayarları',
                options: this.client.server.Limit.map((d) => ({
                  label: d.name,
                  description: d.description,
                  value: d.value,
                  emoji: {
                    id: this.client.functions.control(
                      this.settings[d.root][`${d.value}Limit`]
                    )
                      ? '1292054202499076117'
                      : '1292054129207808093',
                  },
                })),
              }),
            ],
          })
        );

        rows.push(
          new ActionRowBuilder({
            components: [
              new StringSelectMenuBuilder({
                custom_id: 'canexecute:folder',
                placeholder: 'Sunucunun Komut Ayarları',
                options: [
                  ...Object.keys(HelpTitle).map((c) => ({
                    label: HelpTitle[c],
                    value: 'canexecute:' + c,
                  })),
                ],
              }),
            ],
          })
        );
      }

      return rows;
    },
  },

  watcher: {
    value: async function () {
      return setInterval(async () => {
        await this.getSettings();
      }, 10000);
    },
  },

  updateSecretRooms: {
    value: function () {
      setInterval(async () => {
        const document = await SettingsModel.findOne({ id: this.id });
        if (!document || !document.privateRooms) return;

        document.privateRooms.forEach(async (pr) => {
          const channel = this.channels.cache.get(pr.channel);
          if (!channel) {
            await SettingsModel.findOneAndUpdate({ id: this.id }, { $pull: { privateRooms: { channel: pr.channel } } }, { upsert: true });
            return;
          }

          if (channel.members.size > 0) return;
          channel.delete().catch(() => null);
          await SettingsModel.findOneAndUpdate({ id: this.id }, { $pull: { privateRooms: { channel: pr.channel } } }, { upsert: true });
        });
      }, 20000);
    },
  },

  updateLocaRooms: {
    value: function () {
      setInterval(async () => {
        const document = await SettingsModel.findOne({ id: this.id });
        if (!document || !document.locaRooms) return;

        document.locaRooms.forEach(async (lr) => {
          if (Date.now() >= lr.endDate) {
            const channel = this.channels.cache.get(lr.channel);
            if (channel) await channel.delete().catch(() => null);

            await SettingsModel.findOneAndUpdate(
              { id: this.id },
              { $pull: { locaRooms: { channel: lr.channel } } },
              { upsert: true }
            );
          }
        });
      }, 3600000);
    }
  },
});