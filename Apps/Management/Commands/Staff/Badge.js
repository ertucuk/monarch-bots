const { EmbedBuilder, inlineCode, bold, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, roleMention } = require('discord.js');
const { StaffModel, PunitiveModel, UserModel } = require('../../../../Global/Settings/Schemas');

const taskTitle = {
  VOICE: 'Ses Kanalları',
  MESSAGE: 'Metin Kanalları',
  PUBLIC: 'Public Kanalları',
  STREAMER: 'Streamer Kanalları',
  RETURN: 'Return',
  ROLE: 'Rol Denetim',
  SOLVE: 'Sorun Çözme',
  STAFF: 'Yetkili Çekme',
  ORIENTATION: 'Oryantasyon',
  MEETING: 'Toplantı',
  TAGGED: 'Taglı',
  REGISTER: 'Kayıt',
  INVITE: 'Davet'
};

module.exports = {
  Name: 'rozet',
  Aliases: ['badge'],
  Description: 'Sunucuda ki yetkililerin rozetlerini gösterir.',
  Usage: 'rozet',
  Category: 'Staff',
  Cooldown: 0,

  Command: {
    Prefix: true,
  },

  messageRun: async (client, message, args, ertu, embed) => {

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
    if (!member) {
      message.channel.send({ content: `Kullanıcı bulunamadı!` });
      return;
    }

    if (!client.staff.check(member, ertu)) {
      message.channel.send({ content: `${member.id === message.author.id ? 'Yetkili değilsiniz.' : 'Belirttiğin kullanıcı yetkili değil!'}` });
      return;
    }

    const staffDocument = await StaffModel.findOne({ user: member.id });
    if (!staffDocument) {
      message.channel.send({ content: `${member.id === message.author.id ? 'Yetkili veriniz bulunamadı!' : 'Belirttiğin kullanıcının yetkili verisi bulunamadı!'}` });
      return;
    }

    const document = await UserModel.findOne({ id: member.id })
    if (!document) {
      message.channel.send({ content: `${member.id === message.author.id ? 'Kullanıcı veritabanında bulunamadı!' : 'Belirttiğin kullanıcı veritabanında bulunamadı!'}` });
      return;
    }

    const { currentRank, currentIndex } = client.staff.getRank(member, ertu);
    if (!currentRank) {
      message.channel.send({ content: `${member.id === message.author.id ? 'Yetkili değilsiniz.' : 'Belirttiğin kullanıcı yetkili değil!'}` });
      return;
    }

    if (currentRank.type == 'sub') {
      message.channel.send({ content: `${message.author.id === member.id ? 'Alt yetkili olduğunuz için bu komutu kullanamazsınız.' : 'Belirttiğin kullanıcı alt yetkili olduğu için bu komutu kullanamazsınız!'}` });
      return
    }

    if (!staffDocument.badges || !staffDocument.badges.length) {
      message.channel.send({ content: `${member.id === message.author.id ? 'Henüz rozet almadınız.' : 'Belirttiğin kullanıcı henüz rozet almadı.'}` });
      return;
    }

    const firstNonCompletedBadge = staffDocument.badges.findIndex((t) => !t.completed);
    const currentBadge = staffDocument.badges[firstNonCompletedBadge];

    const totalResponsibilities = currentBadge.tasks.find(t => t.isResponsibility === true)
    const completedResponsibilities = currentBadge.tasks.filter((t) => t.isResponsibility && t.completed).length;

    const totalTasks = currentBadge.tasks?.length;
    const completedTasks = currentBadge?.tasks?.filter((t) => t.completed)?.length;

    const totalActivity = totalResponsibilities + totalTasks;
    const completedActivity = completedResponsibilities + completedTasks;

    const percentages = calculatePercantage(currentBadge);

    const row = new ActionRowBuilder({
      components: [
        new ButtonBuilder({
          custom_id: 'roleInfo',
          label: 'Rol Bilgilerim',
          style: ButtonStyle.Secondary,
          emoji: { id: '1381596875723116605' },
        })
      ]
    })

    const illusion = new EmbedBuilder({
      color: client.getColor('random'),
      description: [
        `${member} adlı yetkilinin rozet durumu;`,
        ' ',
        `${await client.getEmoji('arrow')} ${bold('Genel Bilgiler;')}`,
        ' ',
        `${await client.getEmoji('point')} ${inlineCode('Seçim Tarihi  :')} ${currentBadge.date ? client.timestamp(new Date(currentBadge.date)) : bold('Görev almamış.')}`,
        `${await client.getEmoji('point')} ${inlineCode('Son Görülme   :')} ${document?.lastVoice ? `${await client.getEmoji('voice')} ${client.timestamp(document.lastVoice)}` : `${await client.getEmoji('voice')} Bilinmiyor`} / ${document?.lastMessage ? `${await client.getEmoji('message')} ${client.timestamp(document.lastMessage)}` : `${await client.getEmoji('message')} Bilinmiyor`}`,
        `${await client.getEmoji('point')} ${inlineCode('İlerleme      :')} ${currentBadge.name ? await client.functions.createBar(client, percentages.totalPercentage, 100) : bold('Görev almamış.')} (%${percentages.totalPercentage})`,
        `${await client.getEmoji('point')} ${inlineCode('Seçtiği Görev :')} ${currentBadge.name + ' Görevi' ?? 'Görev almamış.'}`,
        ' ',
        `${await client.getEmoji('arrow')} ${bold('Görevler;')}`,
        ...(await Promise.all(currentBadge?.tasks.map(async (task) => {
          return await controlTask(client, task);
        }))),
        ' ',
        `${await client.getEmoji('point')} ${inlineCode('Rozet Süresi :')} ${currentBadge.name ? calculateBadgeDuration(currentBadge.date, currentRank.day) : bold('Görev almamış.')}`,
        `${await client.getEmoji('point')} ${inlineCode('Görev        :')} ${currentBadge.name ? await client.functions.createBar(client, percentages.normalPercentage, 100) : bold('Görev almamış.')} (%${percentages.normalPercentage})`,
        `${await client.getEmoji('point')} ${inlineCode('Sorumluluk   :')} ${await client.functions.createBar(client, percentages.respPercentage, 100)} (%${percentages.respPercentage})`,
        `${await client.getEmoji('point')} ${inlineCode('Durum        :')} ${currentBadge.name ? completedActivity === totalActivity ? bold('Tamamlandı') : `Devam etmelisin (Kalan: ${(100 - Number(percentages.totalPercentage)).toFixed(2)})` : bold('Görev almamış.')}`,
      ].join('\n'),
    })

    const question = await message.channel.send({
      embeds: [illusion],
      components: [row]
    });

    const collector = question.createMessageComponentCollector({ time: 1000 * 60 * 20, componentType: ComponentType.Button });

    collector.on('collect', async (i) => {
      if (i.user.id !== message.member.id) return i.reply({ content: `${await client.getEmoji('mark')} Bu butonu sadece ${message.member} kullanabilir!`, ephemeral: true });

      const punitiveDocument = await PunitiveModel.find({ staff: member.id });

      const firstStaffData = staffDocument.oldRanks[0];
      const firstStaffStarter = message.guild?.members.cache.get(firstStaffData?.staff);
      const lastStaffData = staffDocument.oldRanks[staffDocument.oldRanks.length - 1];
      const lastStaffStarter = message.guild?.members.cache.get(lastStaffData?.staff);

      const oldRanks = await Promise.all(
        staffDocument.oldRanks.reverse().slice(0, 5).map(async (r) => {
          const staff = message.guild?.members.cache.get(r.staff);
          const role = r.roles.find((role) => message.guild?.roles.cache.has(role));

          return `${await client.getEmoji('point')} [${client.timestamp(r.date)}] ${r.up ? await client.getEmoji('check') : await client.getEmoji('mark')} : ${staff ? staff : '[@bulunamadı](https://ertu.live)'} ${staff ? (role ? roleMention(role) : '[@bulunamadı](https://ertu.live)') : '[@bulunamadı](https://ertu.live)'} => ${r.reason}`;
        })
      );

      const excuses = await Promise.all(
        (staffDocument?.excuses || []).map(async (e) => {
          const staff = message.guild?.members.cache.get(e.staff);

          return `${await client.getEmoji('point')} [${client.timestamp(e.startAt)} - ${client.timestamp(e.endAt)}] ${staff ? staff : '[@bulunamadı](https://ertu.live)'} : ${e.reason}`;
        })
      );

      const ilisuion = new EmbedBuilder({
        author: {
          name: member.user.username,
          icon_url: member.user.displayAvatarURL(),
        },

        description: [
          `${await client.getEmoji('arrow')} ${member} adli kullanıcının yetkili bilgileri;`,
          ' ',
          `${await client.getEmoji('arrow')} ${bold('Kullanıcı Bilgileri')}`,
          `${await client.getEmoji('point')} Kullanıcı: ${member} (${inlineCode(member.id)})`,
          `${await client.getEmoji('point')} Yetkisi: ${roleMention(currentRank.role)} (${currentIndex + 1}. sırada)`,
          `${await client.getEmoji('point')} Oluşturduğu Ceza Sayısı: ${inlineCode(` ${punitiveDocument.length} adet `)}`,
          ' ',
          `${await client.getEmoji('arrow')} ${bold('Mazaretler')}`,
          excuses.length ? excuses.join('\n') : `${await client.getEmoji('point')} Mazeretleri bulunamadı.`,
          ' ',
          `${await client.getEmoji('arrow')} ${bold('İlk Yetki Durumu')}`,
          `${await client.getEmoji('point')} Başlangıç Tarihi: ${client.timestamp(firstStaffData?.date)}`,
          `${await client.getEmoji('point')} Yetkiyi Veren: ${firstStaffStarter ? firstStaffStarter : '[@bulunamadı](https://ertu.live)'}`,
          `${await client.getEmoji('point')} Rolleri: ${firstStaffData.roles.filter((r) => message.guild?.roles.cache.has(r)).map((r) => roleMention(r)).listArray()}`,
          ' ',
          `${await client.getEmoji('arrow')} ${bold('Son Yetki Durumu')}`,
          `${await client.getEmoji('point')} Bitiş Tarihi: ${client.timestamp(lastStaffData.date)}`,
          `${await client.getEmoji('point')} Yetkiyi Veren: ${lastStaffStarter ? lastStaffStarter : '[@bulunamadı](https://ertu.live)'}`,
          `${await client.getEmoji('point')} Rolleri: ${lastStaffData.roles.filter((r) => message.guild?.roles.cache.has(r)).map((r) => roleMention(r)).listArray()}`,
          ' ',
          `${await client.getEmoji('arrow')} ${bold('Yetki Engeli')}`,
          `${await client.getEmoji('point')} Yetki Engeli: ${staffDocument.authBlock ? await client.getEmoji('check') : await client.getEmoji('mark')}`,
          ' ',
          `${await client.getEmoji('arrow')} ${bold('Yetki Değişiklikleri')}`,
          oldRanks.join('\n')
        ].join('\n'),
      });

      i.reply({
        content: null,
        embeds: [ilisuion],
        components: [],
        ephemeral: true
      })
    });
  },
};

function calculateBadgeDuration(startDate, finishDate) {
  const start = new Date(startDate).getTime();
  const now = Date.now();
  const daysPassed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return `${daysPassed || '0'} / ${finishDate || '7'} gün`;
}

function calculatePercantage(staffDocument) {
  let normalTotal = 0, normalCount = 0;
  let respTotalCount = 0, respTotalRequired = 0;

  staffDocument.tasks.forEach((task) => {
    const required = Number(task.required);
    const count = Number(task.count);

    if (task.isResponsibility) {
      respTotalCount += count > required ? required : count;
      respTotalRequired += required;
    } else {
      normalTotal += (count >= required ? required : count) / required * 100;
      normalCount++;
    }
  });

  const normalPercentage = normalCount ? (normalTotal / normalCount) : 0;
  const respPercentage = respTotalRequired ? (respTotalCount / respTotalRequired) * 100 : 0;
  const totalPercentage = normalCount && respTotalRequired
    ? ((normalPercentage + respPercentage))
    : (normalCount ? normalPercentage : respPercentage);

  return {
    totalPercentage: totalPercentage.toFixed(2),
    normalPercentage: normalPercentage.toFixed(2),
    respPercentage: respPercentage.toFixed(2)
  };
}

async function controlTask(client, task) {
  const { count, required, name } = task;
  const isTimeBased = required >= 60 * 60 * 1000;
  const currentData = isTimeBased ? formatDurations(count) : count;
  const requiredData = isTimeBased ? formatDurations(required) + ' saat' : `${required} adet`;

  let taskStatus = `${await client.getEmoji('point')} ${inlineCode((taskTitle[name] || '').padEnd(19, ' ') + ':')}`;

  if (task.completed) {
    taskStatus += `${await client.getEmoji('check')}`;
  } else {
    taskStatus += `${currentData} / ${requiredData}`;
  }
  return taskStatus;

}

function formatDurations(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  return `${String(hours).padStart(2, '')}`;
}