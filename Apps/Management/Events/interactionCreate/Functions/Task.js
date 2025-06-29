const { EmbedBuilder, codeBlock, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { StaffModel } = require('../../../../../Global/Settings/Schemas');

module.exports = async function Task(client, interaction, route, ertu) {
    const member = interaction.guild?.members.cache.get(interaction.user.id)
    if (!member) return;

    if (!client.staff.check(member, ertu)) return interaction.reply({ content: `Yetkili değilsiniz.`, ephemeral: true });
    const { currentRank } = client.staff.getRank(member, ertu);
    if (!currentRank) return interaction.deferUpdate();
    if (currentRank.type == 'sub') return interaction.reply({ content: 'Bu butonu kullanabilmek için yetkiniz bulunmamakta!', ephemeral: true });

    const document = await StaffModel.findOne({ user: member.id })
    if (document.badges && document.badges.length > 0) return interaction.reply({ content: 'Zaten bir göreviniz bulunmakta!', ephemeral: true });

    if (route === 'streamer') {
        const rank = ertu?.staffRanks?.find((x) => x.role === currentRank.role);
        const tasks = rank?.tasks || [];
        if (!tasks || tasks.length === 0) return interaction.reply({ content: 'Bu yetki için görev bulunmamaktadır.', ephemeral: true });

        const responsibilityTasks = tasks.filter((x) => x.type === 'RESPONSIBILITY');
        const unassignableTasks = tasks.filter((x) => x.task !== 'PUBLIC' && x.type !== 'RESPONSIBILITY');

        await StaffModel.updateOne(
            { user: member.id },
            {
                $set: {
                    badges: client.functions.updateBadges('Streamer', document?.badges || [], unassignableTasks, responsibilityTasks, member),
                },
            }
        );

        return interaction.reply({
            content: 'Streamer görevi başarıyla alındı.',
            ephemeral: true
        });
    }

    if (route === 'public') {
        const rank = ertu?.staffRanks?.find((x) => x.role === currentRank.role);
        const tasks = rank?.tasks || [];
        if (!tasks || tasks.length === 0) return interaction.reply({ content: 'Bu yetki için görev bulunmamaktadır.', ephemeral: true });

        const responsibilityTasks = tasks.filter((x) => x.type === 'RESPONSIBILITY');
        const unassignableTasks = tasks.filter((x) => x.task !== 'STREAMER' && x.type !== 'RESPONSIBILITY');

        await StaffModel.updateOne(
            { user: member.id },
            {
                $set: {
                    badges: client.functions.updateBadges('Public', document?.badges || [], unassignableTasks, responsibilityTasks, member),
                },
            }
        );

        return interaction.reply({
            content: 'Public görevi başarıyla alındı.',
            ephemeral: true
        });
    }

    if (route === 'message') {
        const rank = ertu?.staffRanks?.find((x) => x.role === currentRank.role);
        const tasks = rank?.tasks || [];
        if (!tasks || tasks.length === 0) return interaction.reply({ content: 'Bu yetki için görev bulunmamaktadır.', ephemeral: true });

        const responsibilityTasks = tasks.filter((x) => x.type === 'RESPONSIBILITY');
        const unassignableTasks = tasks.filter((x) => x.task !== 'PUBLIC' && x.type !== 'RESPONSIBILITY');

        await StaffModel.updateOne(
            { user: member.id },
            {
                $set: {
                    badges: client.functions.updateBadges('Chat', document?.badges || [], unassignableTasks, responsibilityTasks, member),
                },
            }
        );

        const staff = await StaffModel.findOne({ user: member.id });
        if (currentRank.type === 'middle') {
            if (staff && staff.badges && staff.badges[0]) {
                const task = staff.badges[0].tasks.find(t => t.name === 'MESSAGE');
                if (task) {
                    task.required = task.required + 1000;
                    staff.markModified('badges');
                    await staff.save();
                }
            }
        } else if (currentRank.type === 'top') {
            if (staff && staff.badges && staff.badges[0]) {
                const task = staff.badges[0].tasks.find(t => t.name === 'MESSAGE');
                if (task) {
                    task.required = task.required + 1500;
                    staff.markModified('badges');
                    await staff.save();
                }
            }
        }

        return interaction.reply({
            content: 'Mesaj görevi başarıyla alındı.',
            ephemeral: true
        });
    }

    if (route === 'staff') {
        const rank = ertu?.staffRanks?.find((x) => x.role === currentRank.role);
        const tasks = rank?.tasks || [];
        if (!tasks || tasks.length === 0) return interaction.reply({ content: 'Bu yetki için görev bulunmamaktadır.', ephemeral: true });

        const responsibilityTasks = tasks.filter((x) => x.type === 'RESPONSIBILITY');
        const unassignableTasks = tasks.filter((x) => x.task !== 'MESSAGE' && x.type !== 'RESPONSIBILITY');

        await StaffModel.updateOne(
            { user: member.id },
            {
                $set: {
                    badges: client.functions.updateBadges('Staff', document?.badges || [], unassignableTasks, responsibilityTasks, member),
                },
            }
        );

        const staff = await StaffModel.findOne({ user: member.id });
        if (currentRank.type === 'middle') {
            if (staff && staff.badges && staff.badges[0]) {
                const task = staff.badges[0].tasks.find(t => t.name === 'STAFF');
                if (task) {
                    task.required = task.required + 5;
                    staff.markModified('badges');
                    await staff.save();
                }
            }
        } else if (currentRank.type === 'top') {
            if (staff && staff.badges && staff.badges[0]) {
                const task = staff.badges[0].tasks.find(t => t.name === 'STAFF');
                if (task) {
                    task.required = task.required + 10;
                    staff.markModified('badges');
                    await staff.save();
                }
            }
        }

        return interaction.reply({
            content: 'Yetkili alım görevi başarıyla alındı.',
            ephemeral: true
        });
    }

}