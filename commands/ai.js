const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

const fontMapping = {
  'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚',
  'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡',
  'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨',
  'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
  'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴',
  'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻',
  'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂',
  'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇'
};

function convertToBold(text) {
  return text.replace(/(?:\*\*(.*?)\*\*|## (.*?)|### (.*?))/g, (match, boldText, h2Text, h3Text) => {
    const targetText = boldText || h2Text || h3Text;
    return [...targetText].map(char => fontMapping[char] || char).join('');
  });
}

module.exports = {
  name: "ai",
  description: "Ask AI for a response.",
  usage: 'Send message prompt',
  category: 'ai',
  author: "Tianji",

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(" ");
    if (!prompt) {
      return sendMessage(senderId, {
        text: "❌ 𝗘𝗿𝗿𝗼𝗿: 𝗘𝗻𝘁𝗲𝗿 𝗮 𝗽𝗿𝗼𝗺𝗽𝘁 𝘁𝗼 𝗮𝘀𝗸 𝗔𝗜."
      }, pageAccessToken);
    }

    await handleAIResponse(senderId, prompt, pageAccessToken);
  }
};

const handleAIResponse = async (senderId, input, pageAccessToken) => {
  const url = `https://fuku-api-v4-2-p6ik.onrender.com/ask?prompt=${encodeURIComponent(input)}`;

  try {
    const { data } = await axios.get(url);
    
    if (!data || !data.result) {
      throw new Error('Invalid response from AI API');
    }

    const responseText = data.result.trim();
    
    if (!responseText) {
      throw new Error('Empty response from AI');
    }

    const decoratedResponse = `𝗔𝗦𝗦𝗜𝗦𝗧𝗔𝗡𝗧 DANAKRO\n─────────────\n${responseText}\n─────────────`;
    const formatted = convertToBold(decoratedResponse);

    await sendConcatenatedMessage(senderId, formatted, pageAccessToken);
  } catch (error) {
    console.error("AI API error:", error.message);
    return sendMessage(senderId, {
      text: "❌ 𝗘𝗿𝗿𝗼𝗿: 𝗨𝗻𝗮𝗯𝗹𝗲 𝘁𝗼 𝗴𝗲𝘁 𝗮 𝗿𝗲𝘀𝗽𝗼𝗻𝘀𝗲 𝗳𝗿𝗼𝗺 𝗔𝗜 𝘀𝗲𝗿𝘃𝗶𝗰𝗲."
    }, pageAccessToken);
  }
};

const sendConcatenatedMessage = async (senderId, text, pageAccessToken) => {
  const maxLength = 2000;
  const chunks = [];
  
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }
  
  for (const chunk of chunks) {
    await sendMessage(senderId, { text: chunk }, pageAccessToken);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};
