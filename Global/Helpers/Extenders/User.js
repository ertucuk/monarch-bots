const { GuildMember, User, EmbedBuilder, codeBlock, inlineCode, bold } = require('discord.js');
const { UserModel, PunitiveModel } = require('../../Settings/Schemas');
const axios = require('axios');
const moment = require('moment');
moment.locale('tr');

module.exports = Object.defineProperties(GuildMember.prototype, {
    bannerURL: {
        value: async function ({ format = 'png', size = 1024, dynamic } = {}) {
            if (format && !['png', 'jpeg', 'webp', 'gif'].includes(format)) throw new SyntaxError('Please specify an available format.');
            if (size && ![512, 1024, 2048, 4096].includes(parseInt(size) || isNaN(parseInt(size)))) throw new SyntaxError('Please specify an avaible size.');
            if (dynamic && typeof dynamic !== 'boolean') throw new SyntaxError('Dynamic option must be Boolean.')

            const response = await axios.get(`https://discord.com/api/v10/users/${this.id}`, { headers: { 'Authorization': `Bot ${client.token}` } });
            if (!response.data.banner) return `${response.data.banner_color !== null ? `https://singlecolorimage.com/get//${response.data.banner_color.replace('#', '')}/512x254` : ``}`
            if (format == 'gif' || dynamic == true && response.data.banner.startsWith('a_')) return `https://cdn.discordapp.com/banners/${response.data.id}/${response.data.banner}.gif${parseInt(size) ? `?size=${parseInt(size)}` : ''}`
            else return `https://cdn.discordapp.com/banners/${response.data.id}/${response.data.banner}.${format}${parseInt(size) ? `?size=${parseInt(size)}` : ''}`
        }
    },

    setRoles: {
        value: function (roles) {
            if (!this.manageable) return;
            const newRoles = this.roles.cache.filter(x => x.managed).map(x => x.id).concat(roles);
            return this.roles.set(newRoles).catch(() => { });
        }
    },

    addRoles: {
        value: async function (data) {
            if (!this.manageable) return undefined;
            return await this.roles.add([...new Set(data)]).catch(() => null);
        },
    },

    tag: {
        value: function () {
            const mainTag = this.guild.find.settings.tag;
            const hasTag = mainTag && this?.user?.displayName.includes(mainTag);

            return hasTag ? `${mainTag}` : `${this.guild.find.settings.secondTag ?? ''}`;
        }
    },

    removeStaffRoles: {
        value: function () {
            const lowestRole = this.guild.roles.cache.get(this.guild.find.settings.minStaffRole);
            if (!lowestRole || !this.manageable) return [];

            const roles = this.roles.cache.filter((role) => role.position >= lowestRole.position)
            this.roles.remove(roles.map((role) => role.id)).catch(() => null);
            return roles.map((role) => role.id);
        }
    },

    punish: {
        value: async function ({ type, message, question, ertu, timing, reason, image }) {
            const newID = (await PunitiveModel.countDocuments()) + 1;
            await PunitiveModel.create({
                id: newID,
                type: type,
                user: this.id,
                staff: message.author.id,
                reason: reason,
                finishedTime: timing ? Date.now() + timing : undefined,
                createdTime: Date.now(),
                active: true,
                visible: true,
                roles: this?.roles.cache.filter(r => r.id !== this.guild.id).map(r => r.id) || undefined,
                image: image ? image : undefined,
            });

            const types = {
                'ForceBan': 'Kalıcı Yasaklama',
                'Ban': 'Yasaklama',
                'Quarantine': 'Karantina',
                'Ads': 'Reklam',
                'ChatMute': 'Metin Susturma',
                'VoiceMute': 'Ses Susturma',
                'Underworld': 'Underworld',
                'Warn': 'Uyarılma',
                'Event': 'Etkinlik Ceza',
                'Streamer': 'Streamer Ceza',
                'Public': 'Public Ceza'
            }[type];

            const logChannels = {
                'Ban': this.data.logs.ban,
                'Underworld': this.data.logs.underworld,
                'Quarantine': this.data.logs.quarantine,
                'Ads': this.data.logs.ads,
                'VoiceMute': this.data.logs.vmute,
                'ChatMute': this.data.logs.mute,
                'Event': this.data.logs.event,
                'Streamer': this.data.logs.streamer,
                'Public': this.data.logs.public,
            }[type];

            const logChannel = this.guild.channels.cache.find(x => x.name === logChannels);
            if (logChannel) {
                logChannel.send({
                    files: image ? [image] : undefined,
                    flags: [4096],
                    embeds: [new EmbedBuilder({
                        color: this.client.getColor('random'),
                        title: `${types}`,
                        description: `${this} adlı üye ${types} cezası aldı.`,
                        image: image ? { url: 'attachment://ertubaba.png' } : undefined,
                        fields: [
                            {
                                name: '\u200b',
                                value: codeBlock('yaml', [
                                    `# Bilgilendirme`,
                                    `→ Kullanıcı: ${this.user.username} (${this.user.id})`,
                                    `→ Sebep: ${image ? 'Reklam' : reason}`,
                                    `→ Tarih: ${this.client.functions.date(Date.now())}`,
                                    `→ Yetkili: ${message.author.username} (${message.author.id})`,
                                    `→ Süre: ${timing ? moment.duration(timing).humanize() : 'Süresiz'}`,
                                ].join('\n')),
                            }
                        ]
                    })],
                });
            };

            const dmChannel = await this.createDM()
            dmChannel.send({
                flags: [4096],
                files: image ? [image] : undefined,
                embeds: [new EmbedBuilder({
                    color: this.client.getColor('random'),
                    title: 'Sunucumuzda Cezalandırıldınız.',
                    image: image ? { url: 'attachment://ertubaba.png' } : undefined,
                    description: `${bold(message.guild?.name)} sunucusunda ${types} cezası aldınız.`,
                    fields: [
                        {
                            name: '\u200b',
                            value: codeBlock('yaml', [
                                `# Bilgilendirme`,
                                `→ Sebep: ${image ? 'Reklam' : reason}`,
                                `→ Yetkili: ${message.author.username} (${message.author.id})`,
                                `→ Tarih: ${this.client.functions.date(Date.now())}`,
                                `→ Süre: ${timing ? moment.duration(timing).humanize() : 'Süresiz'}`,
                            ].join('\n')),
                        }
                    ]
                })],
            }).catch(() => null);

            const finishedTime = timing ? Date.now() + timing : undefined;

            if (question) {
                question.edit({
                    content: undefined,
                    embeds: [
                        new EmbedBuilder({
                            color: this.client.getColor('random'),
                            description: `${this} adlı kullanıcı "${bold(reason)}" sebebiyle ${finishedTime ? `${client.timestamp(finishedTime)} tarihine kadar` : ''} ${types} cezası aldı. (Ceza Numarası: ${inlineCode(`#${newID}`)})`
                        })
                    ],
                    components: []
                })
            } else {
                message.channel.send({
                    flags: [4096],
                    embeds: [new EmbedBuilder({
                        color: this.client.getColor('random'),
                        description: `${this} adlı kullanıcı "${bold(reason)}" sebebiyle ${finishedTime ? `${client.timestamp(finishedTime)} tarihine kadar` : ''} ${types} cezası aldı. (Ceza Numarası: ${inlineCode(`#${newID}`)})`
                    })],
                    components: []
                });
            };

            const actions = {
                'ForceBan': async () => {
                    await UserModel.updateOne({ id: this.id }, { $inc: { penalPoint: 100 } }, { upsert: true });
                    await this.guild.members.ban(this.id, { reason: `Yetkili: ${message.member.username} | Sebep: ${reason} | Ceza Numarası: #${newID}` });
                },

                'Ban': async () => {
                    await UserModel.updateOne({ id: this.id }, { $inc: { penalPoint: 50 } }, { upsert: true });
                    await this.guild.members.ban(this.id, { reason: `Yetkili: ${message.member.username} | Sebep: ${reason} | Ceza Numarası: #${newID}` });
                },

                'Underworld': async () => {
                    await UserModel.updateOne({ id: this.id }, { $inc: { penalPoint: 40 } }, { upsert: true });
                    if (this.voice.channel) await this.voice.disconnect().catch(() => null);
                    if (this.manageable) await this.setRoles(ertu.settings.underworldRole).catch(() => null);
                },

                'Quarantine': async () => {
                    await UserModel.updateOne({ id: this.id }, { $inc: { penalPoint: 30 } }, { upsert: true });
                    if (this.voice.channel) await this.voice.disconnect().catch(() => null);
                    if (this.manageable) await this.setRoles(ertu.settings.quarantineRole).catch(() => null);
                },

                'Ads': async () => {
                    await UserModel.updateOne({ id: this.id }, { $inc: { penalPoint: 30 } }, { upsert: true });
                    if (this.voice.channel) await this.voice.disconnect().catch(() => null);
                    if (this.manageable) await this.setRoles(ertu.settings.adsRole).catch(() => null);
                },

                'VoiceMute': async () => {
                    await UserModel.updateOne({ id: this.id }, { $inc: { penalPoint: 20 } }, { upsert: true });
                    if (this.voice.channel) await this.voice.setMute(true);
                    if (this.manageable) await this.roles.add(ertu.settings.voiceMuteRole).catch(() => null);
                },

                'ChatMute': async () => {
                    await UserModel.updateOne({ id: this.id }, { $inc: { penalPoint: 20 } }, { upsert: true });
                    if (this.manageable) await this.roles.add(ertu.settings.chatMuteRole).catch(() => null);
                },

                'Event': async () => {
                    await UserModel.updateOne({ id: this.id }, { $inc: { penalPoint: 10 } }, { upsert: true });
                    if (this.manageable) await this.roles.add(ertu.settings.eventPenaltyRole).catch(() => null);
                },

                'Streamer': async () => {
                    await UserModel.updateOne({ id: this.id }, { $inc: { penalPoint: 10 } }, { upsert: true });
                    if (this.manageable) await this.roles.add(ertu.settings.streamerPenaltyRole).catch(() => null);
                },

                'Public': async () => {
                    await UserModel.updateOne({ id: this.id }, { $inc: { penalPoint: 10 } }, { upsert: true });
                    if (this.manageable) await this.roles.add(ertu.settings.publicPenaltyRole).catch(() => null);
                }
            }

            if (actions[type]) await actions[type]();
        }
    },

    unPunish: {
        value: async function ({ type, message, question, ertu, reason }) {
            const types = {
                'ForceBan': 'Kalıcı Yasaklama',
                'Ban': 'Yasaklama',
                'Quarantine': 'Karantina',
                'Ads': 'Reklam',
                'ChatMute': 'Metin Susturma',
                'VoiceMute': 'Ses Susturma',
                'Underworld': 'Underworld',
                'Warn': 'Uyarılma',
                'Event': 'Etkinlik Ceza',
                'Streamer': 'Streamer Ceza',
                'Public': 'Public Ceza'
            }[type];

            if (question) {
                question.edit({
                    content: undefined,
                    embeds: [
                        new EmbedBuilder({
                            color: this.client.getColor('random'),
                            description: `${this} adlı kullanıcının "${bold(reason)}" sebebiyle ${types} cezası kaldırıldı.`
                        })
                    ],
                    components: []
                })
            } else {
                message.channel.send({
                    flags: [4096],
                    embeds: [new EmbedBuilder({
                        color: this.client.getColor('random'),
                        description: `${this} adlı kullanıcının "${bold(reason)}" sebebiyle ${types} cezası kaldırıldı.`
                    })],
                    components: []
                });
            };

            const document = await PunitiveModel.findOne({ user: this.id, active: true, type: type });

            await PunitiveModel.updateMany(
                { user: this.id, active: true, type: type },
                {
                    $set: {
                        active: false,
                        remover: message.author.id,
                        removedTime: Date.now(),
                        removeReason: reason,
                    },
                },
            );

            const minStaffRole = this.guild.roles.cache.get(ertu.settings.minStaffRole);

            const roles = document && document?.roles && document?.roles?.length > 0
                ? document.roles.filter(r => {
                    const role = this.guild.roles.cache.get(r);
                    return role && minStaffRole ? role.position < minStaffRole.position : false;
                })
                : ertu.settings.unregisterRoles;

            const actions = {
                'Ban': async () => {
                    await message.guild.members.unban(this.id).catch(() => null);
                },

                'Underworld': async () => {
                    await this.setRoles(roles).catch(() => null);
                },

                'Quarantine': async () => {
                    await this.setRoles(roles).catch(() => null);
                },

                'Ads': async () => {
                    await this.setRoles(roles).catch(() => null);
                },

                'VoiceMute': async () => {
                    if (this.voice.channel) await this.voice.setMute(false).catch(() => null);
                    if (this.manageable) await this.roles.remove(ertu.settings.voiceMuteRole).catch(() => null);
                },

                'ChatMute': async () => {
                    if (this.manageable) await this.roles.remove(ertu.settings.chatMuteRole).catch(() => null);
                },

                'Event': async () => {
                    if (this.manageable) await this.roles.remove(ertu.settings.eventPenaltyRole).catch(() => null);
                },

                'Streamer': async () => {
                    if (this.manageable) await this.roles.remove(ertu.settings.streamerPenaltyRole).catch(() => null);
                },

                'Public': async () => {
                    if (this.manageable) await this.roles.remove(ertu.settings.publicPenaltyRole).catch(() => null);
                }
            }

            if (actions[type]) await actions[type]();
        }
    },

    stats: {
        value: async function (requested) {

            const document = await UserModel.findOne({ id: this.id });
            const now = Date.now();

            if (!document) return null;

            const voiceDays = document.voices || {};
            const messageDays = document.messages || {};
            const streamDays = document.streams || {};
            const cameraDays = document.cameras || {};
            const client = this.client;

            return {
                day: document.day,
                voiceChannelSize: Object.keys(voiceDays)
                    .filter(d => requested ? Number(d) > document.day - Number(requested) : true)
                    .reduce((totalCount, currentDay) => totalCount + Object.keys(voiceDays[currentDay]).filter(key => key !== 'total').length, 0),
                voice: Object.keys(voiceDays)
                    .filter(d => requested ? Number(d) > document.day - Number(requested) : true)
                    .reduce((totalCount, currentDay) => totalCount + voiceDays[currentDay].total, 0),

                message: Object.keys(messageDays)
                    .filter(d => requested ? Number(d) > document.day - Number(requested) : true)
                    .reduce((totalCount, currentDay) => totalCount + messageDays[currentDay].total, 0),

                stream: Object.keys(streamDays)
                    .filter(d => requested ? Number(d) > document.day - Number(requested) : true)
                    .reduce((totalCount, currentDay) => totalCount + streamDays[currentDay].total, 0),

                camera: Object.keys(cameraDays)
                    .filter(d => requested ? Number(d) > document.day - Number(requested) : true)
                    .reduce((totalCount, currentDay) => totalCount + cameraDays[currentDay].total, 0),
                register: requested ? document.records.filter(d => d.date >= now - 1000 * 60 * 60 * 24 * requested) : document.records,
                invite: requested ? document.invites.filter(d => d.date >= now - 1000 * 60 * 60 * 24 * requested) : document.invites,
                taggeds: requested ? document.taggeds.filter(d => d.date >= now - 1000 * 60 * 60 * 24 * requested) : document.taggeds,
                staffs: requested ? document.staffs.filter(d => d.date >= now - 1000 * 60 * 60 * 24 * requested) : document.staffs,
                solvers: requested ? document.solversData.filter(d => d.endedAt >= now - 1000 * 60 * 60 * 24 * requested) : document.solversData,
                channels: {
                    message: client.functions.getChannels(this.guild, document, messageDays, requested ? requested : document.day),
                    voice: client.functions.getChannels(this.guild, document, voiceDays, requested ? requested : document.day),
                    stream: client.functions.getChannels(this.guild, document, streamDays, requested ? requested : document.day),
                    camera: client.functions.getChannels(this.guild, document, cameraDays, requested ? requested : document.day),
                },

                category: {
                    message: client.functions.getCategory(this.guild, document, messageDays, requested ? requested : document.day),
                    voice: client.functions.getCategory(this.guild, document, voiceDays, requested ? requested : document.day),
                    stream: client.functions.getCategory(this.guild, document, streamDays, requested ? requested : document.day),
                    camera: client.functions.getCategory(this.guild, document, cameraDays, requested ? requested : document.day),
                }
            }
        }
    },

    register: {
        value: async function (name, gender, staff, message) {
            message.edit({
                embeds: [
                    new EmbedBuilder({
                        description: `${this} üyesi ${bold(gender === 'Man' ? 'ERKEK' : 'KADIN')} olarak kayıt edildi.`
                    })
                ],
                components: []
            });

            await this.setRoles(gender == 'Man' ? this.guild.find.settings.manRoles : this.guild.find.settings.womanRoles);
            if (this.user.displayName.includes(this.guild.find.settings.tag)) this.roles.add(this.guild.find.settings.familyRole);

            await this.setNickname(`${this.tag()} ${name}`);

            const chatChannel = this.guild.channels.cache.get(this.guild.find.settings.chatChannel)
            if (chatChannel) chatChannel.send({
                content: `${this} aramıza hoşgeldin, seninle beraber ${bold(this.guild?.memberCount.toString())} kişi olduk. :tada: :tada:`,
            }).then((msg) => setTimeout(() => msg.delete(), 5000));

            const registerLog = this.guild.channels.cache.find(x => x.name === this.data.logs.register);
            if (registerLog) registerLog.send({
                flags: [4096],
                embeds: [
                    new EmbedBuilder({
                        color: client.getColor('random'),
                        author: {
                            name: this.user.username,
                            icon_url: this.user.displayAvatarURL({ extension: 'png', size: 4096 }),
                        },

                        title: gender === 'Man' ? 'Erkek Kayıdı' : 'Kadın Kayıdı',
                        description: [
                            `${this} adlı kullanıcı ${staff} tarafından kayıt edildi.`,
                            '',
                            `→ Kullanıcı: ${this.user.username}`,
                            `→ Kayıt Edilen İsim: ${name}`,
                            `→ Yetkili: ${staff.user.username}`,
                            `→ Tarih: ${client.functions.date(Date.now())}`,
                        ].join('\n'),
                    })
                ]
            });

            await client.staff.checkRank(client, staff, this.guild.find, { type: 'registerPoints', amount: 1, point: 40 });

            await UserModel.updateOne(
                { id: this.id },
                {
                    $set: {
                        name: name,
                        gender: gender
                    },
                    $push: {
                        nameLogs: {
                            gender: gender === 'Man' ? 'ERKEK' : 'KADIN',
                            type: gender === 'Man' ? 'Erkek' : 'Kadın',
                            name: name,
                            date: Date.now(),
                            staff: staff.user.id,
                            channel: message.channel.id,
                            message: message.id
                        },
                    },
                },
                { upsert: true },
            );

            await UserModel.updateOne(
                { id: staff.id },
                {
                    $push: {
                        records: {
                            user: this.id,
                            date: Date.now(),
                            gender: gender === 'Man' ? 'ERKEK' : 'KADIN',
                        }
                    }
                },
                { upsert: true }
            );
        }
    },

    rename: {
        value: async function (name, staff, message) {

            await this.setNickname(`${this.tag()} ${name}`);
            const embed = new EmbedBuilder({
                color: client.getColor('random'),
                author: {
                    name: staff.username,
                    icon_url: staff.displayAvatarURL({ forceStatic: true })
                },
                description: `${this} adlı üyenin ismi ${bold(name)} olarak değiştirildi.`
            });

            const illusion = await message.channel.send({ embeds: [embed] })

            const registerLog = this.guild.channels.cache.find(x => x.name === this.data.logs.register);
            if (registerLog) registerLog.send({
                flags: [4096],
                embeds: [
                    new EmbedBuilder({
                        color: client.getColor('random'),
                        author: {
                            name: this.user.username,
                            icon_url: this.user.displayAvatarURL({ extension: 'png', size: 4096 }),
                        },

                        title: 'İsim Değiştirme',
                        description: [
                            `${this} adlı kullanıcının ${staff} tarafından ismi değiştirildi.`,
                            '',
                            `→ Kullanıcı: ${this.user.username}`,
                            `→ Yeni İsmi: ${name}`,
                            `→ Yetkili: ${staff.username}`,
                            `→ Tarih: ${client.functions.date(Date.now())}`,
                        ].join('\n'),
                    })
                ]
            });

            await UserModel.updateOne({ id: this.id },
                {
                    $set: {
                        name: name,
                    },
                    $push: {
                        nameLogs: {
                            type: 'İsim Değiştirme',
                            name: name,
                            date: Date.now(),
                            staff: staff.id,
                            channel: message.channel.id,
                            message: illusion.id
                        },
                    },
                },
                { upsert: true },
            );
        }
    },
});

module.exports = Object.defineProperties(User.prototype, {
    bannerURL: {
        value: async function ({ format = 'png', size = 1024, dynamic } = {}) {
            if (format && !['png', 'jpeg', 'webp', 'gif'].includes(format)) throw new SyntaxError('Please specify an available format.');
            if (size && ![512, 1024, 2048, 4096].includes(parseInt(size) || isNaN(parseInt(size)))) throw new SyntaxError('Please specify an avaible size.');
            if (dynamic && typeof dynamic !== 'boolean') throw new SyntaxError('Dynamic option must be Boolean.')

            const response = await axios.get(`https://discord.com/api/v10/users/${this.id}`, { headers: { 'Authorization': `Bot ${client.token}` } });
            if (!response.data.banner) return `${response.data.banner_color !== null ? `https://singlecolorimage.com/get//${response.data.banner_color.replace('#', '')}/512x254` : ``}`
            if (format == 'gif' || dynamic == true && response.data.banner.startsWith('a_')) return `https://cdn.discordapp.com/banners/${response.data.id}/${response.data.banner}.gif${parseInt(size) ? `?size=${parseInt(size)}` : ''}`
            else return `https://cdn.discordapp.com/banners/${response.data.id}/${response.data.banner}.${format}${parseInt(size) ? `?size=${parseInt(size)}` : ''}`
        }
    },
});