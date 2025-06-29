
const { PunitiveModel } = require('../../../../../Global/Settings/Schemas');

module.exports = async function Penal(client, oldMember, newMember, ertu) {
    if (
        oldMember.roles.cache.map((r) => r.id) === newMember.roles.cache.map((r) => r.id) ||
        ![
            ertu.settings.underworldRole,
            ertu.settings.quarantineRole,
            ertu.settings.adsRole,
            ertu.settings.chatMuteRole,
            ertu.settings.voiceMuteRole
        ].some((r) => oldMember.roles.cache.has(r) && !newMember.roles.cache.has(r))
    ) return;

    const penals = await PunitiveModel.find({ id: newMember.id, active: true });
    if (!penals.length) return;

    const memberRoles = [];

    for (const penal of penals) {
        if (penal.type === 'Underworld') {
            memberRoles.push(ertu.settings.underworldRole);
        };

        if (penal.type === 'Quarantine') {
            memberRoles.push(ertu.settings.quarantineRole);
        };

        if (penal.type === 'Ads') {
            memberRoles.push(ertu.settings.adsRole);
        };

        if (penal.type === 'ChatMute') {
            memberRoles.push(ertu.settings.chatMuteRole);
        };

        if (penal.type === 'VoiceMute') {
            memberRoles.push(ertu.settings.voiceMuteRole);
        };

        if (penal.type === 'Event') {
            memberRoles.push(ertu.settings.eventPenaltyRole);
        };

        if (penal.type === 'Streamer') {
            memberRoles.push(ertu.settings.streamerPenaltyRole);
        };

        if (penal.type === 'Public') {
            memberRoles.push(ertu.settings.publicPenaltyRole);
        };
    }

    if (memberRoles.length) {
        newMember.addRoles(memberRoles);
    }
}