module.exports = async function Menu(client, interaction, route, ertu) {
    const roles = [
        '904188905899831344', 
        '1082981508236714044',
        '904188905899831346',
        '904188905899831343',
        '1040706373987602454',
        '911734879031545896',
        '904188905899831345',
        '1158061131588444193',
        '1158061523919446056', 
        '1158061139687645204', 
        '1158061143747735652',
        '1158061148353081445',
        '1158061522032001044',
        '904188905790795781',
        '1345723387359527013',
    ];

    const index = {
        'menu:first': 0,
        'menu:second': 1,
        'menu:third': 2,
        'menu:fourth': 3,
        'menu:fifth': 4,
        'menu:sixth': 5,
        'menu:seventh': 6,
        'menu:eighth': 7,
        'menu:ninth': 8,
        'menu:tenth': 9,
        'menu:eleventh': 10,
        'menu:twelfth': 11,
        'menu:thirteenth': 12,
        'menu:fourteenth': 13,
        'menu:fifteenth': 14,
    };

    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('menu:')) return;

    const member = interaction.guild.members.cache.get(interaction.user.id);
    const roleIndex = index[interaction.customId];
    if (roleIndex === undefined) return

    const role = roles[roleIndex];
    if (!role) return;
    
    const rolesToRemove = colorRoles.filter(r => member.roles.cache.has(r));
    await member.roles.remove(rolesToRemove).catch(() => {});

    await member.roles.add(roleId).catch(() => {});
    await interaction.reply({ content: `<@&${role}> rolü başarıyla verildi!`, ephemeral: true });
}