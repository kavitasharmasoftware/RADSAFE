
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../constants';

export class GeminiLiveService {
  private sessionPromise: Promise<any> | null = null;

  async connect(callbacks: {
    onOpen?: () => void;
    onMessage?: (message: LiveServerMessage) => void;
    onError?: (e: any) => void;
    onClose?: (e: any) => void;
  }) {
    // CRITICAL: Always create a new instance before connecting to ensure fresh API key usage.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let latLng = undefined;
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
      });
      latLng = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    } catch (e) {
      console.warn("Location check bypassed");
    }

    // Fixed: Removed toolConfig and grounding tools (googleMaps, googleSearch) because toolConfig
    // is not supported in LiveConnectConfig. Location data is instead appended to the systemInstruction
    // to provide the model with geographic context for risk assessment in Bihar.
    const systemInstruction = latLng 
      ? `${SYSTEM_INSTRUCTION}\n\nUser's current location: Latitude ${latLng.latitude}, Longitude ${latLng.longitude}.`
      : SYSTEM_INSTRUCTION;

    this.sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: callbacks.onOpen,
        onmessage: callbacks.onMessage,
        onerror: callbacks.onError,
        onclose: callbacks.onClose,
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
        systemInstruction: systemInstruction,
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
    });

    return await this.sessionPromise;
  }

  /**
   * Sends audio data to the model.
   * Fixed: Solely rely on sessionPromise to prevent race conditions and stale closures.
   */
  sendAudio(pcmBlob: { data: string; mimeType: string }) {
    if (this.sessionPromise) {
      this.sessionPromise.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    }
  }

  /**
   * Sends an image frame to the model.
   * Fixed: Solely rely on sessionPromise to prevent race conditions and stale closures.
   */
  sendVideoFrame(base64Data: string) {
    if (this.sessionPromise) {
      this.sessionPromise.then((session) => {
        session.sendRealtimeInput({
          media: { data: base64Data, mimeType: 'image/jpeg' }
        });
      });
    }
  }

  async disconnect() {
    if (this.sessionPromise) {
      const session = await this.sessionPromise;
      try { session.close(); } catch (e) {}
      this.sessionPromise = null;
    }
  }
}
