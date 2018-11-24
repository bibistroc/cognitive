const u = require('umbrellajs');
const config = require('electron-json-config');

const self = module.exports = {
    init: () => {
        const gdprCanvas = u("#gdrpCanvas").first();
        const gdprImageLoading = u("#gdprImageProcessing");

        u("#gdrpChoosePhoto").on('click', e => {
            e.preventDefault();
            const faceApiTrained = config.get('faceApiTrained');
            if (faceApiTrained === true) {
                self.browsePicture().then(picture => {
                    gdprImageLoading.addClass('show');
                    self.processPicture(gdprCanvas, picture).then(() => {
                        gdprImageLoading.removeClass('show');
                    });
                });
            } else {
                self.showMessage('The model has not been trained');
            }
        });
        u("#gdprDownloadResult").on('click', e => {
            self.downloadResult(gdprCanvas);
        });
    },
    deInit: () => {
        u("#gdrpChoosePhoto").off('click');
        u("#gdprDownloadResult").off('click');
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
                properties: ['openFile'],
                filters: [
                    {
                        name: 'Images', 
                        extensions: ['jpeg', 'jpg', 'png']
                    }
                ]
            }
        
            dialog.showOpenDialog(dialogOptions, (fileNames) => {
                if (fileNames && fileNames.length > 0) {
                    resolve(fileNames[0]);
                }
            });
        });
    },
    processPicture: (canvas, picture) => {
        return new Promise((resolve, reject) => {
            const fs = require('fs');
            const path = require('path');
            const faceApi = require('../services/faceapi');
    
            const fWidth = 640;
            const fHeight = 480;
            const context = canvas.getContext('2d');
            canvas.setAttribute('width', fWidth);
            canvas.setAttribute('height', fHeight);
            context.clearRect(0, 0, fWidth, fHeight);
    
            const extension = path.extname(picture);
            let pictureMime = '';
            switch (extension) {
                case '.png':
                    pictureMime = 'data:image/png;base64,';
                    break;
                default:
                case '.jpg':
                case '.jpeg':
                    pictureMime = 'data:image/jpeg;base64,'
                    break
            }
            const imageDataUrl = fs.readFileSync(picture, "base64");
            
            const image = new Image();
            image.src = pictureMime + imageDataUrl;
            image.onload = (a, b) => {
                const fRatio = fWidth / fHeight;
                const iRatio = image.naturalWidth / image.naturalHeight;
                let renderableHeight, renderableWidth, xStart, yStart;
                if (iRatio < fRatio) {
                    renderableHeight = fHeight;
                    renderableWidth = image.width * (renderableHeight / image.height);
                    xStart = (fWidth - renderableWidth) / 2;
                    yStart = 0;
                } else if (iRatio > fRatio) {
                    renderableWidth = fWidth
                    renderableHeight = image.height * (renderableWidth / image.width);
                    xStart = 0;
                    yStart = (fHeight - renderableHeight) / 2;
                } else {
                    renderableHeight = fHeight;
                    renderableWidth = fWidth;
                    xStart = 0;
                    yStart = 0;
                }
                context.drawImage(image, xStart, yStart, renderableWidth, renderableHeight);
                canvas.toBlob(blob => {
                    faceApi.detect(blob).then((persons) => {
                        persons.forEach(person => {
                            if (!person.isPersonOfInterest) {
                                context.fillRect(person.rectangle.left, person.rectangle.top, person.rectangle.width, person.rectangle.height); 
                            }
                        });
                        resolve();
                    });
                });
            };
        });
    },
    downloadResult: (canvas) => {
        const link = document.createElement('a');
        link.download = 'result.png';
        link.href = canvas.toDataURL();
        link.click();
    }
}