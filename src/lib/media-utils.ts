/**
 * Utility functions for safe audio/video operations
 * Handles AbortError and other media-related errors gracefully
 */

export class MediaError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'MediaError';
  }
}

/**
 * Safely play an audio/video element with proper error handling
 */
export async function safePlay(element: HTMLAudioElement | HTMLVideoElement): Promise<void> {
  try {
    const playPromise = element.play();
    
    if (playPromise !== undefined) {
      await playPromise;
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('Audio/video play was aborted:', error.message);
        return; // Silently handle AbortError
      }
      
      if (error.name === 'NotAllowedError') {
        throw new MediaError('Autoplay is not allowed. User interaction required.', error);
      }
      
      throw new MediaError(`Failed to play media: ${error.message}`, error);
    }
    
    throw new MediaError('Unknown error occurred while playing media', error as Error);
  }
}

/**
 * Safely pause an audio/video element
 */
export function safePause(element: HTMLAudioElement | HTMLVideoElement): void {
  try {
    element.pause();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Audio/video pause was aborted:', error.message);
      return; // Silently handle AbortError
    }
    
    console.error('Error pausing media:', error);
  }
}

/**
 * Safely stop MediaRecorder and clean up tracks
 */
export function safeStopMediaRecorder(recorder: MediaRecorder | null): void {
  if (!recorder) return;
  
  try {
    recorder.stop();
    
    // Clean up tracks if available
    if (recorder.stream) {
      recorder.stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (error) {
          console.warn('Error stopping track:', error);
        }
      });
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('MediaRecorder stop was aborted:', error.message);
      return;
    }
    
    console.error('Error stopping MediaRecorder:', error);
  }
}

/**
 * Check if autoplay is allowed for the current context
 */
export async function checkAutoplaySupport(): Promise<boolean> {
  try {
    const audio = new Audio();
    audio.muted = true;
    await audio.play();
    audio.pause();
    return true;
  } catch {
    return false;
  }
}

/**
 * Request user interaction to enable audio/video playback
 */
export function requestUserInteraction(): Promise<void> {
  return new Promise((resolve) => {
    const handleInteraction = () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      resolve();
    };
    
    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });
  });
}
