const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const config = getDefaultConfig(__dirname);

// Add exclusions for the large ML files/folders
config.resolver.blockList = exclusionList([
    /ml_resources\/.*/,
    /ml_resources\.zip/,
]);

module.exports = config;
