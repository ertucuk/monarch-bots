const { EmbedBuilder, MessageFlags, roleMention } = require('discord.js');
const { StaffModel } = require('../Settings/Schemas')

module.exports = class Staff {

  static check(member, ertu) {
    return member.roles.cache.some((r) => [...ertu.staffRanks].some((rr) => rr.role === r.id));
  };

  static getRank(member, ertu) {
    if (!ertu.staffRanks.length) return { currentRole: undefined, newRole: undefined };

    const sortedRoles = ertu.staffRanks.sort((a, b) => a.place - b.place);
    const currentIndex = sortedRoles.findIndex((r) => member.roles.cache.map(x => x.id).includes(r.role));

    return {
      currentRank: sortedRoles[currentIndex] || undefined,
      currentIndex: currentIndex,
      newRank: sortedRoles[currentIndex + 1] || undefined,  
      newIndex: currentIndex + 1,
      type: sortedRoles[currentIndex]?.type || undefined,
    };
  };

  static async checkRank(client, member, ertu, options = { type, amount, user, point }) {
    const { currentRank, newRank } = Staff.getRank(member, ertu);
    if (!currentRank) return;

    if (currentRank && currentRank.type !== 'sub') return Staff.checkBadge(client, member, ertu, options);

    const staffRecord = await StaffModel.findOne({ user: member.id });
    if (!staffRecord) return;
    const document = {
      ...staffRecord,
      totalPoints: staffRecord.totalPoints || 0,
      dailyPoints: staffRecord.dailyPoints || 0,
      publicPoints: staffRecord.publicPoints || 0,
      streamerPoints: staffRecord.streamerPoints || 0,
      activityPoints: staffRecord.activityPoints || 0,
      staffPoints: staffRecord.staffPoints || 0,
      taggedPoints: staffRecord.taggedPoints || 0,
      messagePoints: staffRecord.messagePoints || 0,
      registerPoints: staffRecord.registerPoints || 0,
      invitePoints: staffRecord.invitePoints || 0,
      afkPoints: staffRecord.afkPoints || 0,
    };

    if (currentRank && currentRank.type === 'sub' && options?.type && options?.point) {

      const pointAddMap = {
        'staffPoints': 50,
        'taggedPoints': 50,
        'messagePoints': 1,
        'registerPoints': 40,
        'invitePoints': 40,
      };

      const maxSleepPoint = document.totalPoints / 3;
      const pointToAdd = ['publicPoints', 'streamerPoints', 'activityPoints', 'afkPoints'].includes(options.type)
        ? options.point
        : ((pointAddMap[options.type] || options.point));

      document[options.type] += pointToAdd;
      document.totalPoints += pointToAdd;
      document.dailyPoints += pointToAdd;

      if (options.type === 'afkPoints' && document.afkPoints >= maxSleepPoint) return;

      await StaffModel.updateOne(
        { user: member.id },
        {
           $set: {
              totalPoints: document.totalPoints,
              dailyPoints: document.dailyPoints,
              [options.type]: document[options.type],
            },
            dailyPoints: document.dailyPoints,
          ...(options.type === 'invitePoints' && {
            $push: { inviteds: { user: options.user, date: new Date() } },
          }),
          ...(options.type === 'staffPoints' && {
            $push: { staffs: { user: options.user, date: new Date() } },
          }),
          ...(options.type === 'taggedPoints' && {
            $push: { taggeds: { user: options.user, date: new Date() } },
          }),
        }
      );
    };

    if (document.totalPoints < currentRank?.point) return;

    const now = Date.now();
    if (now - new Date(document.roleStartAt).getDate() >= 24 * 60 * 60 * 1000 * 7) return;

    await member.roles.add(newRank.role);
    await member.roles.remove(currentRank.role);

    await member.roles.add(...newRank.hammers);
    await member.roles.remove(...currentRank.hammers);

    const logChannel = await client.getChannel(client.data.logs.taskend, member);
    if (logChannel) logChannel.send({
      flags: [MessageFlags.SuppressNotifications],
      embeds: [
        new EmbedBuilder({
          title: 'Bilgilendirme',
          description: [
            `[${client.timestamp(Date.now())}] ${await client.getEmoji('up')} ${member} kişisi ${roleMention(currentRank.role)} rolünden ${roleMention(newRank.role)} rolüne başarılı bir şekilde yükseltildi.`,
            ' ',
            'Yetkili Bilgileri',
            `- **Yetkili Puanı**: ${document.totalPoints} / ${currentRank.point}`,
            `- **Yetki Başlangıç Tarihi**: ${client.timestamp(document.startAt)}`,
          ].join('\n'),
        })
      ]
    });

    await StaffModel.updateOne(
      { user: member.id },
      {
        $set: {
          roleStartAt: new Date(now),
          dailyPoints: 0,
          bonusPoints: 0,
          totalPoints: 0,
          registerPoints: 0,
          publicPoints: 0,
          afkPoints: 0,
          streamerPoints: 0,
          activityPoints: 0,
          messagePoints: 0,
          invitePoints: 0,
          staffPoints: 0,
          taggedPoints: 0,
          badgePoints: 0,

          badges: [],
          inviteds: [],
          staffs: [],
          taggeds: [],
          bonuses: [],

          totalGeneralMeeting: 0,
          totalStaffMeeting: 0,
          totalIndividualMeeting: 0,
        },
        $push: {
          oldRanks: {
            roles: [newRank.role, ...newRank.hammers],
            date: now,
          },
        },
      }
    );
  }

  static async checkBadge(client, member, ertu, options = { type, amount, user }) {
    const mapType = {
      'messagePoints': 'MESSAGE',
      'publicPoints': 'PUBLIC',
      'streamerPoints': 'STREAMER',
      'staffPoints': 'STAFF',
      'invitePoints': 'INVITE',
      'taggedPoints': 'TAGGED',
      'generalVoicePoints': 'VOICE',
    }

    const { currentRank } = Staff.getRank(member, ertu);

    const staffRecord = await StaffModel.findOne({ user: member.id });

    if (currentRank && staffRecord?.badges.length && options) {
      const firstNonCompletedBadge = staffRecord.badges.findIndex((t) => !t.completed);
      const currentBadge = staffRecord.badges[firstNonCompletedBadge];

      if (!currentBadge?.tasks || !currentBadge.tasks.length) return;

      const task = currentBadge.tasks.find((t) => t.name === mapType[options.type])
      if (!task) return;

      const responsbility = staffRecord.responsibilities.find((r) => r.type === mapType[options.type] || options.type);

      if (responsbility && responsbility.completed) {
        if (responsbility.current >= responsbility.count) return;

        responsbility.current += options.amount;
        responsbility.completed = responsbility.current >= responsbility.count;
      };

      if (!task.completed) task.count += options.amount;
      task.completed = task.count >= task.required;

      await StaffModel.updateOne(
        { user: member.id },
        {
          ...(options.type === 'invitePoints' && {
            $push: { inviteds: { user: options.user, date: new Date() } },
          }),
          ...(options.type === 'staffPoints' && {
            $push: { staffs: { user: options.user, date: new Date() } },
          }),
          ...(options.type === 'taggedPoints' && {
            $push: { taggeds: { user: options.user, date: new Date() } },
          }),
        }
      );

      if (currentBadge.tasks.every((t) => t.completed)) {
        currentBadge.completed = true;
      };
    };
  }
}