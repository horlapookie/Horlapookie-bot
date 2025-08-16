
import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'botSettings.json');

// Default settings
const defaultSettings = {
  botMode: 'public',
  autoViewMessage: false,
  autoViewStatus: false,
  autoReactStatus: false,
  autoReact: false,
  autoStatusEmoji: '❤️',
  autoTyping: false,
  autoRecording: false,
  antiLinkWarn: {},
  antiLinkKick: {},
  antiDeleteMessages: false,
  antiVoiceCall: false,
  antiVideoCall: false,
  antiBadWord: {}
};

// Load settings from file
export function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      const settings = JSON.parse(data);
      
      // Apply loaded settings to global variables
      global.botMode = settings.botMode || 'public';
      global.autoViewMessage = settings.autoViewMessage || false;
      global.autoViewStatus = settings.autoViewStatus || false;
      global.autoReactStatus = settings.autoReactStatus || false;
      global.autoReact = settings.autoReact || false;
      global.autoStatusEmoji = settings.autoStatusEmoji || '❤️';
      global.autoTyping = settings.autoTyping || false;
      global.autoRecording = settings.autoRecording || false;
      global.antiLinkWarn = settings.antiLinkWarn || {};
      global.antiLinkKick = settings.antiLinkKick || {};
      global.antiDeleteMessages = settings.antiDeleteMessages || false;
      global.antiVoiceCall = settings.antiVoiceCall || false;
      global.antiVideoCall = settings.antiVideoCall || false;
      global.antiBadWord = settings.antiBadWord || {};
      
      return settings;
    } else {
      // Create file with default settings
      saveSettings(defaultSettings);
      
      // Apply defaults to global variables
      Object.keys(defaultSettings).forEach(key => {
        global[key] = defaultSettings[key];
      });
      
      return defaultSettings;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    
    // Apply defaults to global variables
    Object.keys(defaultSettings).forEach(key => {
      global[key] = defaultSettings[key];
    });
    
    return defaultSettings;
  }
}

// Save settings to file
export function saveSettings(settings) {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    console.log('[INFO] Settings saved successfully');
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Update a specific setting
export function updateSetting(key, value) {
  try {
    const currentSettings = loadSettings();
    currentSettings[key] = value;
    global[key] = value;
    saveSettings(currentSettings);
    return true;
  } catch (error) {
    console.error('Error updating setting:', error);
    return false;
  }
}

// Get current settings
export function getCurrentSettings() {
  return {
    botMode: global.botMode || 'public',
    autoViewMessage: global.autoViewMessage || false,
    autoViewStatus: global.autoViewStatus || false,
    autoReactStatus: global.autoReactStatus || false,
    autoReact: global.autoReact || false,
    autoStatusEmoji: global.autoStatusEmoji || '❤️',
    autoTyping: global.autoTyping || false,
    autoRecording: global.autoRecording || false,
    antiLinkWarn: global.antiLinkWarn || {},
    antiLinkKick: global.antiLinkKick || {},
    antiDeleteMessages: global.antiDeleteMessages || false,
    antiVoiceCall: global.antiVoiceCall || false,
    antiVideoCall: global.antiVideoCall || false,
    antiBadWord: global.antiBadWord || {}
  };
}
