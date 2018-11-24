const u = require('umbrellajs');
const rp = require('request-promise');
const config = require('electron-json-config');

var self = module.exports = {
    checkConfig: () => {
        const customVisionUrl = config.get('customVisionUrl');
        if (customVisionUrl === undefined || customVisionUrl === '') {
            const toastData = {
                message: 'Required settings are missing',
                actionHandler: () => {
                    self.navigateToSettings();
                },
                actionText: 'Go to settings'
            };
            u('#noSettingsToast').first().MaterialSnackbar.showSnackbar(toastData);
            return false;
        } else {
            return true;
        }
    },
    navigateToSettings: () => {
        const renderer = require('../renderer');
        renderer.navigate('settings', false);
    },
    detect: imageData => {
        return new Promise((resolve, reject) => {
            const uriBase = config.get('customVisionUrl');
            const options = {
                method: 'POST',
                uri: uriBase + '/image',
                body: imageData,
                headers: {
                    'Content-Type': 'application/octet-stream'
                }
            };
            rp(options).then((jsonData) => {
                const predictData = JSON.parse(jsonData);
                predictData.predictions.sort((a, b) => a.probability > b.probability ? -1 : 1);
                resolve(predictData.predictions[0]);
            }).error((err) => {
                reject(err);
            }); 
        });
    }
}