const rp = require('request-promise');
const config = require('electron-json-config');
const u = require('umbrellajs');

var self = module.exports = {
    checkConfig: () => {
        const uriBase = config.get('uriBase');
        const subscriptionKey = config.get('subscriptionKey');
        if (uriBase === undefined || subscriptionKey === undefined || uriBase === '' || subscriptionKey === '') {
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
    detect: blob => {
        if (!self.checkConfig()) {
            return;
        }
        const uriBase = config.get('uriBase');
        const subscriptionKey = config.get('subscriptionKey');
        return new Promise((resolve, reject) => {
            self.getImageFromBlob(blob).then(imageData => {   
                const options = {
                    method: 'POST',
                    uri: uriBase + '/detect?returnFaceId=true&returnFaceLandmarks=false',
                    body: imageData,
                    headers: {
                        'Content-Type': 'application/octet-stream',
                        'Ocp-Apim-Subscription-Key': subscriptionKey
                    }
                };
                rp(options).then((data) => {
                    const facesData = JSON.parse(data);
                    const faceIds = facesData.map(f => f.faceId);
                    self.identify(faceIds).then((data2) => {
                        const personData = JSON.parse(data2);
                        const result = personData.map(p => {
                            const rectangleData = facesData.find(f => f.faceId === p.faceId).faceRectangle;
                            return {
                                id: p.faceId,
                                rectangle: rectangleData,
                                isPersonOfInterest: p.candidates.length > 0
                            };
                        });
                        resolve(result);
                    })
                }).catch(a => {
                    console.error(a);
                });
            });
        });
    },
    identify: faceIds => {
        if (!self.checkConfig()) {
            return;
        }
        const uriBase = config.get('uriBase');
        const subscriptionKey = config.get('subscriptionKey');
        const groupId = config.get('groupId');
        return new Promise((resolve, reject) => {
            const body = JSON.stringify({
                'personGroupId': groupId,
                'faceIds': faceIds,
                'maxNumOfCandidatesReturned': 1,
                'confidenceThreshold': 0.5
            });
    
            const options = {
                method: 'POST',
                uri: uriBase + '/identify',
                body: body,
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': subscriptionKey
                }
            };
            rp(options).then((personData) => {
                resolve(personData);
            });
        });
        
    },
    getImageFromBlob: (blob) => {
        return new Promise((resolve, reject) => {
            var reader = new FileReader();
            reader.onloadend = data => {
                if (data.error) {
                    reject(data.error);
                } else {
                    resolve(Buffer.from(reader.result));
                }
            }
            reader.readAsArrayBuffer(blob);
        });
    },
    createPersonGroup: personGroupId => {
        return new Promise((resolve, reject) => {
            if (!self.checkConfig()) {
                reject();
                return;
            }
            const uriBase = config.get('uriBase');
            const subscriptionKey = config.get('subscriptionKey');
            const options = {
                uri: uriBase + '/persongroups/' + personGroupId,
                method: 'put',
                json: true,
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key' : subscriptionKey
                },
                body: {
                    "name": personGroupId
                }
            };
            rp(options).then(() => resolve()).catch((error) => reject(error));
        });
    },
    createPerson: (personName) => {
        return new Promise((resolve, reject) => {
            if (!self.checkConfig()) {
                reject();
                return;
            }
            const uriBase = config.get('uriBase');
            const subscriptionKey = config.get('subscriptionKey');
            const groupId = config.get('groupId');
            const options = {
                uri: uriBase + '/persongroups/' + groupId + '/persons',
                method: 'post',
                json: true,
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key' : subscriptionKey
                },
                body: {
                    "name": personName
                }
            };
            rp(options).then(response => {
                resolve(response.personId);
            }).catch(error => {
                reject(error);
            });
        });
    },
    uploadPersonPhoto: (personId, imageUrl) => {
        return new Promise((resolve, reject) => {
            if (!self.checkConfig()) {
                reject('invalid settings');
                return;
            }
            const fs = require('fs');
            const uriBase = config.get('uriBase');
            const subscriptionKey = config.get('subscriptionKey');
            const groupId = config.get('groupId');
            const imageData = fs.readFileSync(imageUrl);
            const options = {
                uri: uriBase + '/persongroups/' + groupId + '/persons/' + personId + '/persistedFaces',
                method: 'post',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Ocp-Apim-Subscription-Key' : subscriptionKey
                },
                body: imageData
            };
            rp(options).then(() => resolve()).catch(error => reject(error));
        });
    },
    trainPersonGroup: () => {
        return new Promise((resolve, reject) => {
            if (!self.checkConfig()) {
                reject();
                return;
            }
            const uriBase = config.get('uriBase');
            const subscriptionKey = config.get('subscriptionKey');
            const groupId = config.get('groupId');
            const options = {
                uri: uriBase + '/persongroups/' + groupId + '/train',
                method: 'post',
                json: true,
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key' : subscriptionKey
                }
            };
            rp(options).then(() => {
                resolve();
            }).catch(error => {
                reject(error);
            });
        });
    },
    checkPersonGroupTraining: () => {
        return new Promise((resolve, reject) => {
            if (!self.checkConfig()) {
                reject();
                return;
            }
            const uriBase = config.get('uriBase');
            const subscriptionKey = config.get('subscriptionKey');
            const groupId = config.get('groupId');
            const options = {
                uri: uriBase + '/persongroups/' + groupId + '/training',
                method: 'get',
                json: true,
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key' : subscriptionKey
                }
            };
            rp(options).then((response) => {
                resolve(response);
            }).catch(error => {
                reject(error);
            });
        });
    }
};