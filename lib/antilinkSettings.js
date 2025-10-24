
import fs from 'fs';
import path from 'path';

const antilinkFilePath = path.join(process.cwd(), 'data', 'antilinkSettings.json');

function loadAntilinkSettings() {
    if (fs.existsSync(antilinkFilePath)) {
        const data = fs.readFileSync(antilinkFilePath);
        return JSON.parse(data);
    }
    return {};
}

function saveAntilinkSettings(settings) {
    fs.writeFileSync(antilinkFilePath, JSON.stringify(settings, null, 2));
}

function setAntilinkSetting(groupId, type) {
    const settings = loadAntilinkSettings();
    settings[groupId] = type;
    saveAntilinkSettings(settings);
}

function getAntilinkSetting(groupId) {
    const settings = loadAntilinkSettings();
    return settings[groupId] || 'off';
}

export {
    setAntilinkSetting,
    getAntilinkSetting
};
