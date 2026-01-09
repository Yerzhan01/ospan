import { config } from '../../config/index.js';
import { logger } from '../../common/utils/logger.js';

export interface TranscriptionResult {
    text: string;
    language: string;
    duration: number;
}

/**
 * Service for transcribing audio files using OpenAI Whisper API
 */
class TranscriptionService {
    private get isEnabled(): boolean {
        return config.transcription.enabled && !!config.transcription.openaiApiKey;
    }

    /**
     * Transcribes audio from a URL using OpenAI Whisper API
     * @param audioUrl - URL to the audio file
     * @returns TranscriptionResult or null if transcription is disabled/fails
     */
    async transcribeAudio(audioUrl: string): Promise<TranscriptionResult | null> {
        if (!this.isEnabled) {
            logger.info('Transcription is disabled or API key not configured');
            return null;
        }

        try {
            logger.info({ audioUrl }, 'Starting audio transcription');

            // 1. Download the audio file
            const audioResponse = await fetch(audioUrl);
            if (!audioResponse.ok) {
                logger.error({ status: audioResponse.status }, 'Failed to download audio file');
                return null;
            }

            const audioBuffer = await audioResponse.arrayBuffer();
            const audioBlob = new Blob([audioBuffer], { type: 'audio/ogg' });

            // 2. Create FormData for OpenAI API
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.ogg');
            formData.append('model', 'whisper-1');
            formData.append('language', 'ru'); // Default to Russian

            // 3. Call OpenAI Whisper API
            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.transcription.openaiApiKey}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.text();
                logger.error({ error, status: response.status }, 'Whisper API error');
                return null;
            }

            const data = await response.json() as { text: string };

            logger.info({ textLength: data.text.length }, 'Audio transcription completed');

            return {
                text: data.text,
                language: 'ru',
                duration: 0, // Whisper doesn't return duration in basic response
            };

        } catch (error) {
            logger.error({ err: error }, 'Error during audio transcription');
            return null;
        }
    }
}

export const transcriptionService = new TranscriptionService();
