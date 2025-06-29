const { PunitiveModel } = require('../../../../../Global/Settings/Schemas');

module.exports = async function Punish(client, state, ertu, action) {
    if (state.member.user.bot) return;

    const member = state.guild.members.cache.get(state.id);
    if (!member) return;

    const document = await PunitiveModel.findOne({ user: member.id, type: 'VoiceMute', active: true });
    if (document) {
        if (!state.serverMute) state.setMute(true);
    }
}