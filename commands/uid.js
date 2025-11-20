const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'uid',
  description: 'Get user ID',
  usage: 'uid',
  author: 'Name',
  category: 'Info',
  async execute(senderID, args, pageAccessToken) {
    // Convert senderID to string if necessary
    const userId = String(senderID);
    await sendMessage(senderID, {
      text: `🙂➲ ${userId}`
    }, pageAccessToken);
  }
};
