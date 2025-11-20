const { sendMessage } = require('../handles/sendMessage');
const axios = require("axios");
const config = require("../admin.json");

async function getPageData(pageAccessToken) {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,picture.width(720).height(720).as(picture_large)&access_token=${pageAccessToken}`
    );
    return {
      profileUrl: response.data.picture_large?.data?.url,
      name: response.data.name,
      pageid: response.data.id
    };
  } catch (error) {
    throw new Error('Failed to fetch page data');
  }
}

async function getAllPSIDs(pageAccessToken, pageid) {
  try {
    let psids = [];
    let url = `https://graph.facebook.com/v22.0/${pageid}/conversations?fields=participants&access_token=${pageAccessToken}`;
    const allAdmins = [
      ...new Set([
        ...config.adminId,
        ...(config.sessions || []).map(session => session.adminid).filter(Boolean)
      ])
    ];

    while (url) {
      const response = await axios.get(url);
      const conversations = response.data.data || [];

      for (const convo of conversations) {
        const participants = convo.participants?.data || [];
        for (const participant of participants) {
          if (participant.id && participant.id !== pageid && !allAdmins.includes(participant.id)) {
            psids.push(participant.id);
          }
        }
      }

      url = response.data.paging?.next || null;
    }

    return [...new Set(psids)]; // Return unique PSIDs
  } catch (error) {
    console.error('Error fetching PSIDs:', error);
    return [];
  }
}

async function sendNotificationToAllUsers(message, pageAccessToken, pageid) {
  const users = await getAllPSIDs(pageAccessToken, pageid);
  const batchSize = 50; // Process in batches to avoid rate limits
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    const batchPromises = batch.map(psid =>
      axios.post(
        `https://graph.facebook.com/v22.0/me/messages`,
        {
          recipient: { id: psid },
          message: { text: message },
          messaging_type: "MESSAGE_TAG",
          tag: "NON_PROMOTIONAL_SUBSCRIPTION"
        },
        {
          params: { access_token: pageAccessToken },
          timeout: 10000
        }
      ).catch(e => console.error(`Failed to send to ${psid}:`, e.message))
    );

    await Promise.all(batchPromises);
    if (i + batchSize < users.length) await delay(1000); // Add delay between batches
  }
}

module.exports = {
  name: "sendnoti",
  description: "Send notification to all users",
  author: "Cliff",
  usage: "sendnoti <message>",
  async execute(senderId, args, pageAccessToken) {
    try {
      const allAdmins = [
        ...new Set([
          ...config.adminId,
          ...(config.sessions || []).map(session => session.adminid).filter(Boolean)
        ])
      ];

      if (!allAdmins.includes(senderId)) {
        await sendMessage(
          senderId,
          { text: "❌ This command is only for pagebot admin." },
          pageAccessToken
        );
        return;
      }

      const message = args.join(" ").trim();
      if (!message) {
        await sendMessage(
          senderId,
          { text: "❗ Please provide a text message" },
          pageAccessToken
        );
        return;
      }

      await sendMessage(
        senderId,
        { text: "⏳ Sending notifications to all users..." },
        pageAccessToken
      );

      const { pageid } = await getPageData(pageAccessToken);
      const notificationMessage = `📢 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 \n━━━━━━━━━━━━━━\n╭💬 𝗠𝗘𝗦𝗦𝗔𝗚𝗘: \n╰┈➤ ${message}\n━━━━━━━━━━━━━━`;

      await sendNotificationToAllUsers(notificationMessage, pageAccessToken, pageid);

      await sendMessage(
        senderId,
        { text: "✅ Notifications sent successfully!" },
        pageAccessToken
      );
    } catch (error) {
      console.error('Error in sendnoti command:', error);
      await sendMessage(
        senderId,
        { text: `❌ Error: ${error.message}` },
        pageAccessToken
      );
    }
  }
};
