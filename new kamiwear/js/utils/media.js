// Media module for KamiWear

// Media class for handling media functionality
export class Media {
    constructor() {
        this.images = new Map();
        this.videos = new Map();
        this.audio = new Map();
        this.initializeMedia();
    }

    initializeMedia() {
        this.initializeImages();
        this.initializeVideos();
        this.initializeAudio();
    }

    // Images
    initializeImages() {
        document.addEventListener('DOMContentLoaded', () => {
            const images = document.querySelectorAll('img[data-src]');
            images.forEach(image => {
                this.loadImage(image);
            });
        });
    }

    loadImage(image) {
        const src = image.dataset.src;
        if (src) {
            const img = new Image();
            img.onload = () => {
                image.src = src;
                image.classList.add('loaded');
                this.images.set(image, img);
            };
            img.onerror = () => {
                image.src = '/assets/placeholder.jpg';
                image.classList.add('error');
            };
            img.src = src;
        }
    }

    preloadImages(sources) {
        sources.forEach(src => {
            const img = new Image();
            img.src = src;
            this.images.set(src, img);
        });
    }

    getImageDimensions(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height
                });
            };
            img.onerror = reject;
            img.src = src;
        });
    }

    // Videos
    initializeVideos() {
        document.addEventListener('DOMContentLoaded', () => {
            const videos = document.querySelectorAll('video[data-src]');
            videos.forEach(video => {
                this.loadVideo(video);
            });
        });
    }

    loadVideo(video) {
        const src = video.dataset.src;
        if (src) {
            video.src = src;
            video.load();
            this.videos.set(video, src);
        }
    }

    preloadVideos(sources) {
        sources.forEach(src => {
            const video = document.createElement('video');
            video.src = src;
            video.load();
            this.videos.set(src, video);
        });
    }

    getVideoDimensions(src) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.onloadedmetadata = () => {
                resolve({
                    width: video.videoWidth,
                    height: video.videoHeight
                });
            };
            video.onerror = reject;
            video.src = src;
        });
    }

    // Audio
    initializeAudio() {
        document.addEventListener('DOMContentLoaded', () => {
            const audio = document.querySelectorAll('audio[data-src]');
            audio.forEach(audio => {
                this.loadAudio(audio);
            });
        });
    }

    loadAudio(audio) {
        const src = audio.dataset.src;
        if (src) {
            audio.src = src;
            audio.load();
            this.audio.set(audio, src);
        }
    }

    preloadAudio(sources) {
        sources.forEach(src => {
            const audio = document.createElement('audio');
            audio.src = src;
            audio.load();
            this.audio.set(src, audio);
        });
    }

    getAudioDuration(src) {
        return new Promise((resolve, reject) => {
            const audio = document.createElement('audio');
            audio.onloadedmetadata = () => {
                resolve(audio.duration);
            };
            audio.onerror = reject;
            audio.src = src;
        });
    }

    // Media controls
    playMedia(element) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.play();
        }
    }

    pauseMedia(element) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.pause();
        }
    }

    stopMedia(element) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.pause();
            element.currentTime = 0;
        }
    }

    setMediaVolume(element, volume) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.volume = Math.max(0, Math.min(1, volume));
        }
    }

    setMediaMuted(element, muted) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.muted = muted;
        }
    }

    setMediaPlaybackRate(element, rate) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.playbackRate = rate;
        }
    }

    setMediaCurrentTime(element, time) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.currentTime = time;
        }
    }

    // Media events
    onMediaPlay(element, callback) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.addEventListener('play', callback);
        }
    }

    onMediaPause(element, callback) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.addEventListener('pause', callback);
        }
    }

    onMediaEnded(element, callback) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.addEventListener('ended', callback);
        }
    }

    onMediaTimeUpdate(element, callback) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.addEventListener('timeupdate', callback);
        }
    }

    onMediaVolumeChange(element, callback) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.addEventListener('volumechange', callback);
        }
    }

    onMediaRateChange(element, callback) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.addEventListener('ratechange', callback);
        }
    }

    onMediaSeeking(element, callback) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.addEventListener('seeking', callback);
        }
    }

    onMediaSeeked(element, callback) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.addEventListener('seeked', callback);
        }
    }

    onMediaWaiting(element, callback) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.addEventListener('waiting', callback);
        }
    }

    onMediaPlaying(element, callback) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.addEventListener('playing', callback);
        }
    }

    onMediaCanPlay(element, callback) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.addEventListener('canplay', callback);
        }
    }

    onMediaCanPlayThrough(element, callback) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.addEventListener('canplaythrough', callback);
        }
    }

    onMediaLoadStart(element, callback) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.addEventListener('loadstart', callback);
        }
    }

    onMediaProgress(element, callback) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.addEventListener('progress', callback);
        }
    }

    onMediaLoadedData(element, callback) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.addEventListener('loadeddata', callback);
        }
    }

    onMediaLoadedMetadata(element, callback) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.addEventListener('loadedmetadata', callback);
        }
    }

    onMediaError(element, callback) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            element.addEventListener('error', callback);
        }
    }

    // Media state
    isMediaPlaying(element) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            return !element.paused;
        }
        return false;
    }

    isMediaMuted(element) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            return element.muted;
        }
        return false;
    }

    getMediaVolume(element) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            return element.volume;
        }
        return 0;
    }

    getMediaPlaybackRate(element) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            return element.playbackRate;
        }
        return 1;
    }

    getMediaCurrentTime(element) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            return element.currentTime;
        }
        return 0;
    }

    getMediaDuration(element) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            return element.duration;
        }
        return 0;
    }

    getMediaReadyState(element) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            return element.readyState;
        }
        return 0;
    }

    getMediaNetworkState(element) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            return element.networkState;
        }
        return 0;
    }

    getMediaError(element) {
        if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
            return element.error;
        }
        return null;
    }
}

// Create media instance
const media = new Media();

// Export media instance
export default media; 