export class AudioService {
  private remoteAudio: HTMLAudioElement | null = null;
  private isInitialized = false;

  initialize() {
    if (!this.isInitialized) {
      this.remoteAudio = document.createElement('audio');
      this.remoteAudio.autoplay = true;
      this.remoteAudio.setAttribute('playsinline', '');
      document.body.appendChild(this.remoteAudio);
      this.isInitialized = true;
    }
  }

  handleTrack(event: RTCTrackEvent) {
    if (!this.remoteAudio) {
      this.initialize();
    }

    if (event.track.kind === 'audio' && this.remoteAudio) {
      this.remoteAudio.srcObject = event.streams[0];
      
      // Ensure audio plays when ready
      this.remoteAudio.oncanplay = () => {
        if (this.remoteAudio) {
          const playPromise = this.remoteAudio.play();
          if (playPromise) {
            playPromise.catch((error) => {
              console.error('Audio playback failed:', error);
            });
          }
        }
      };
    }
  }

  cleanup() {
    if (this.remoteAudio && document.body.contains(this.remoteAudio)) {
      this.remoteAudio.srcObject = null;
      document.body.removeChild(this.remoteAudio);
      this.remoteAudio = null;
      this.isInitialized = false;
    }
  }
}