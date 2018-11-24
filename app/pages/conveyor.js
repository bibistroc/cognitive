const u = require('umbrellajs');
const customVision = require('../services/customvision');

const self = module.exports = {
    videoCanPlay: false,
    canvasItem: null,
    videoContext: null,
    canvasContext: null,
    videoIsPlaying: false,
    frameCount: 0,
    conveyorPieceOkElement: null,
    conveyorPieceNOkElement: null,
    autopause: true,
    nthFrame: 5,
    init: () => {
        self.conveyorPieceOkElement = u('#conveyorPieceOk');
        self.conveyorPieceNOkElement = u('#conveyorPieceNOk');
        u('#conveyorAutoPause').on('change', e => {
            self.autopause = u(e.target).is(':checked');
        });
        if (self.autopause) {
            u('#conveyorAutoPause').attr('checked', true);
        } else {
            u('#conveyorAutoPause').attr('checked');
        }

        const fWidth = 640;
        const fHeight = 480;
        const canvas = u('#conveyorCanvas').first();
        canvas.setAttribute('width', fWidth);
        canvas.setAttribute('height', fHeight);
        const ctx = canvas.getContext("2d");
        self.canvasItem = canvas;
        self.canvasContext = ctx;

        const videoUrl = './assets/video/lego_conveyor.mp4'
        const video = document.createElement('video');
        video.src = videoUrl;
        video.autoplay = false;
        video.muted = true;
        video.loop = true;
        video.oncanplay = e => {
            self.videoCanPlay = true;
        }
        video.onerror = e => {
            console.error('Video error: ' + e);
        }
        video.ontimeupdate = self.detectFromFrame;
        self.videoContext = video;

        u('#conveyorStartVideo').on('click', e => {
            e.preventDefault();
            console.log('click');
            self.playPauseVideo();
        });
    },
    deInit: () => {
        self.videoCanPlay = false;
        self.canvasItem = null;
        self.videoContext = null;
        self.canvasContext = null;
        self.videoIsPlaying = false;
        self.frameCount = 0;
        u('#conveyorAutoPause').off('change');
        u('#conveyorStartVideo').off('click');
        self.conveyorPieceOkElement.addClass('hidden');
        self.conveyorPieceNOkElement.addClass('hidden');
    },
    playPauseVideo: () => {
        if (!customVision.checkConfig()) {
            return;
        }
        if (self.videoCanPlay) {
            if (self.videoIsPlaying) {
                self.pauseVideo();
            } else {
                self.playVideo();
            }
        }
    },
    pauseVideo: () => {
        self.videoContext.pause();
        self.videoIsPlaying = false;
        u('#conveyorPlayIcon').removeClass('hidden');
        u('#conveyorPauseIcon').addClass('hidden');
    },
    playVideo: () => {
        self.videoContext.play();
        self.videoIsPlaying = true;
        u('#conveyorPlayIcon').addClass('hidden');
        u('#conveyorPauseIcon').removeClass('hidden');
        window.requestAnimationFrame(self.displayFrame);
    },
    displayFrame: () => {
        if (!self.videoIsPlaying) {
            return;
        }
        const fWidth = 640;
        const fHeight = 480;
        const vWidth = self.videoContext.videoWidth;
        const vHeight = self.videoContext.videoHeight;
        self.canvasContext.clearRect(0, 0, fWidth, fHeight);

        const fRatio = fWidth / fHeight;
        const iRatio = vWidth / vHeight;
        let renderableHeight, renderableWidth, xStart, yStart;
        if (iRatio < fRatio) {
            renderableHeight = fHeight;
            renderableWidth = vWidth * (renderableHeight / vHeight);
            xStart = (fwidth - renderableWidth) / 2;
            yStart = 0;
        } else if (iRatio > fRatio) {
            renderableWidth = fWidth
            renderableHeight = vHeight * (renderableWidth / vWidth);
            xStart = 0;
            yStart = (fHeight - renderableHeight) / 2;
        } else {
            renderableHeight = fHeight;
            renderableWidth = fWidth;
            xStart = 0;
            yStart = 0;
        }
        self.canvasContext.drawImage(self.videoContext, xStart, yStart, renderableWidth, renderableHeight);
        window.requestAnimationFrame(self.displayFrame);
    },
    detectFromFrame: () => {
        self.frameCount++;
        if (self.frameCount % self.nthFrame === 0) {
            const frame  = require('canvas-to-buffer');
            const canvasBuffer  = new frame(self.canvasItem);
            const buffer = canvasBuffer.toBuffer();
            customVision.detect(buffer).then(result => {
                self.processDetectedState(result);
            });
        }
    },
    processDetectedState: detectedState => {
        switch (detectedState.tagName) {
            case 'invalid':
                self.conveyorPieceOkElement.addClass('hidden');
                self.conveyorPieceNOkElement.removeClass('hidden');
                if (self.autopause) {
                    self.pauseVideo();
                }
                break;
            case 'valid':
            default:
                self.conveyorPieceOkElement.removeClass('hidden');
                self.conveyorPieceNOkElement.addClass('hidden');
                break;
        }
    } 
};
