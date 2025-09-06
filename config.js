import settings from './settings.js';

export default {
  // Bot configuration
  prefix: '?',
  ownerNumber: '2349122222622',
  botName: 'Horlapookie',
  ownerName: 'HORLAPOOKIE',
  sessionId: 'HORLA-POOKIE-SESSION-ID',
  BOOM_MESSAGE_LIMIT: 50,  

  // API configurations from settings
  openaiApiKey: settings.openaiApiKey,
  giphyApiKey: settings.giphyApiKey,
  geminiApiKey: settings.geminiApiKey,
  imgurClientId: settings.imgurClientId,
  copilotApiKey: settings.copilotApiKey,
  FOOTBALL_API_KEY: settings.FOOTBALL_API_KEY,
};