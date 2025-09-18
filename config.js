import settings from './settings.js';

export default {
  // Bot configuration
  prefix: '.', // input your prfic here 
  ownerNumber: '2348020827575', //input your number here 
  botName: '✦✦✦ 𝐇 𝐎 𝐑 𝐋 𝐀 𝐏 𝐎 𝐎 𝐊 𝐈 𝐄 ✦✦✦',
  ownerName: '𝓗𝓞𝓡𝓛𝓐𝓟𝓞𝓞𝓚𝓘𝓔', //optional 
  sessionId: 'HORLA-POOKIE-SESSION-ID', //sensitive name 
  BOOM_MESSAGE_LIMIT: 50,  

  // API configurations from settings
  openaiApiKey: settings.openaiApiKey,
  giphyApiKey: settings.giphyApiKey,
  geminiApiKey: settings.geminiApiKey,
  imgurClientId: settings.imgurClientId,
  copilotApiKey: settings.copilotApiKey,
  FOOTBALL_API_KEY: settings.FOOTBALL_API_KEY,
};
