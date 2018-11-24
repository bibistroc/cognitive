const u = require('umbrellajs');
const config = require('electron-json-config');

var self = module.exports = {
    configSet: ['uriBase', 'subscriptionKey', 'customVisionUrl'],
    init: () => {
        self.configSet.forEach(c => {
            const el = u("#"+c);
            if (el.length > 0) {
                el.first().value = config.get(c, '');   
            }
        });

        u('#settingsForm').on('submit', e => {
            e.preventDefault();

            const toastData = {
                message: 'Saved settings'
            };
            const formData = u(e.target).serialize();
            formData.split('&').forEach(setting => {
                const parts = setting.split('=');
                const configKey = parts[0];
                if (self.configSet.indexOf(configKey) > -1) {
                    const configValue = decodeURIComponent(parts[1]).toString().replace(/\s/g,'');
                    config.set(configKey, configValue);
                }
            });
            u('#settingsToast').first().MaterialSnackbar.showSnackbar(toastData);
        });
    },
    deInit: () => {
        u('#settingsForm').off('submit');
    }
};