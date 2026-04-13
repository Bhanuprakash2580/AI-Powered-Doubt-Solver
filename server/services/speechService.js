const { AssemblyAI } = require('assemblyai');

const isSpeechServiceAvailable = () => {
  return Boolean(process.env.ASSEMBLYAI_API_KEY && process.env.ASSEMBLYAI_API_KEY.trim());
};

const transcribeAudio = async (audioFilePath) => {
  if (!isSpeechServiceAvailable()) {
    throw new Error('Voice transcription is not configured (missing ASSEMBLYAI_API_KEY).');
  }

  const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });

  const transcript = await client.transcripts.transcribe({
    audio: audioFilePath,
    language_detection: true,
    punctuate: true,
    format_text: true,
  });

  if (!transcript || transcript.status === 'error') {
    throw new Error(transcript?.error || 'Transcription failed');
  }

  return transcript.text || '';
};

module.exports = { transcribeAudio, isSpeechServiceAvailable };
