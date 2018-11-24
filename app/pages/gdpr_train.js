const u = require('umbrellajs');
const guid = require('uuid/v4');
const config = require('electron-json-config');
const faceApi = require('../services/faceapi');

var self = module.exports = {
    groupIdInput: null,
    configGroupIdName: 'groupId',
    configPersonGroupId: 'personGroup',
    configFaceApiTrained: 'faceApiTrained',
    personList: {},
    maxTrainingCheckTicks: 5,
    currentTrainingCheckTicks: 0,
    init: () => {
        self.groupIdInput = u('#gtrainGroupId').first();
        if (config.has(self.configGroupIdName)) {
            self.groupIdInput.value = config.get(self.configGroupIdName);
            u(self.groupIdInput).parent().addClass('is-dirty');
        }
        if (config.has(self.configPersonGroupId)) {
            self.personList = config.get(self.configPersonGroupId);
            self.addPersonsInDropdown();
        }

        u('#gtrainGroupIdGuid').on('click', e => {
            e.preventDefault();
            const groupId = guid();
            self.groupIdInput.value = groupId;
            u(self.groupIdInput).parent().addClass('is-dirty');
        });

        u('#gtrainGroupIdSave').on('click', e => {
            e.preventDefault();
            const personGroupId = self.groupIdInput.value;
            if (personGroupId === config.get(self.configGroupIdName)) {
                self.showMessage('Choose other group id');
                return;
            }
            if (personGroupId && personGroupId !== '') {
                faceApi.createPersonGroup(personGroupId).then(() => {
                    config.set(self.configGroupIdName, personGroupId);
                    self.personList = {};
                    config.set(self.configPersonGroupId, {})
                    self.addPersonsInDropdown();
                    self.showMessage('Group id was saved');
                }).catch((error) => {
                    console.error(error);
                    self.showMessage();
                    self.groupIdInput.value = '';
                });
            } else {
                self.showMessage('Input a group id or generate one');
            }
        });

        u('#gtrainPersonAdd').on('click', e => {
            e.preventDefault();
            const personNameElement = u('#gtrainPersonId').first();
            const personName = personNameElement.value;
            if (!personName || personName === '') {
                self.showMessage('Enter a person name');
                return;
            }
            const groupId = config.get(self.configGroupIdName);
            if (!groupId || groupId === '') {
                self.showMessage('Input a group id or generate one');
                return;
            }
            faceApi.createPerson(personName).then(personId => {
                self.personList[personId] = personName;
                config.set(self.configPersonGroupId, self.personList);
                self.addPersonInDropdown(personId, personName);
                getmdlSelect.init('#gtrainPersonListContainer');
                personNameElement.value = '';
                self.showMessage('Person ' + personName + ' was added.');
            }).catch(error => {
                console.error(error);
                self.showMessage();
                personNameElement.value = '';
            });
        });

        u('#gtrainPersonPhotoAdd').on('click', e => {
            e.preventDefault();
            const personId = u('#gtrainPersonIdValue').first().value;
            if (personId && personId !== '') {
                self.browsePicture().then((filenames) => {
                    const uploadLoadingElement = u('#gtrainUploadingPhotos');
                    uploadLoadingElement.removeClass('hidden');
                    const promiseUploadArray = [];
                    filenames.forEach(file => {
                        const promiseUpload = faceApi.uploadPersonPhoto(personId, file);
                        promiseUploadArray.push(promiseUpload);
                    });
                    Promise.all(promiseUploadArray).then(() => {
                        self.showMessage(filenames.length + ' photo(s) where saved');
                        uploadLoadingElement.addClass('hidden');
                    }).catch((error) => {
                        console.error(error);
                        self.showMessage();
                        uploadLoadingElement.addClass('hidden');
                    });
                });
            } else {
                self.showMessage('Choose person from list');
            }
        });

        u('#gtrainPersonGroupTrain').on('click', e => {
            e.preventDefault();
            faceApi.trainPersonGroup().then(() => {
                self.currentTrainingCheckTicks = 0;
                setTimeout(self.checkTraining, 1000);
            }).catch(error => {
                console.error(error);
                self.showMessage();
            });
        });
    },
    checkTraining: () => {
        console.log('tick');
        faceApi.checkPersonGroupTraining().then((response) => {
            if (response.status !== 'succeeded') {
                if (self.currentTrainingCheckTicks >= self.maxTrainingCheckTicks) {
                    self.showMessage('Training failed'); 
                    console.log(response);
                } else {
                    self.currentTrainingCheckTicks++;
                    setTimeout(self.checkTraining, 1000);
                }
            } else {
                config.set(self.configFaceApiTrained, true);
                self.showMessage('Training complete');
            }
        }).catch((error) => {
            this.showMessage();
            console.error(error);
        });
    },
    showMessage: messageText => {
        if (messageText === undefined || messageText === '') {
            messageText = 'An unknown error occured.';
        }
        const toastData = {
            message: messageText
        };
        u('#noSettingsToast').first().MaterialSnackbar.showSnackbar(toastData);
    },
    browsePicture: () => {
        return new Promise((resolve, reject) => {
            const {dialog} = require('electron').remote;
            const dialogOptions = {
                properties: ['openFile', 'multiSelections'],
                filters: [
                    {
                        name: 'Images', 
                        extensions: ['jpeg', 'jpg', 'png']
                    }
                ]
            }
        
            dialog.showOpenDialog(dialogOptions, (fileNames) => {
                if (fileNames && fileNames.length > 0) {
                    resolve(fileNames);
                }
            });
        });
    },
    addPersonsInDropdown: () => {
        const personListElement = u('#gtrainPersonList');
        personListElement.html('');
        for (var personId in self.personList) {
            if (self.personList.hasOwnProperty(personId)) {
                self.addPersonInDropdown(personId, self.personList[personId]);
            }
        }
    },
    addPersonInDropdown: (personId, personName) => {
        const personListElement = u('#gtrainPersonList');
        personListElement.append('<li class="mdl-menu__item" data-val="' + personId + '">' + personName + '</li>');
    },
    deInit: () => {
        self.groupIdInput = null;
        self.personList = [];
        u('#gtrainGroupIdGuid').off('click');
        u('#gtrainGroupIdSave').off('click');
        u('#gtrainPersonAdd').off('click');
        u('#gtrainPersonPhotoAdd').off('click');
        u('#gtrainPersonGroupTrain').off('click');
    }
};