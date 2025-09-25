import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(
  audioBuffer: Buffer, 
  mimetype: string, 
  filename: string = "audio.webm"
): Promise<string> {
  try {
    // Create a Blob from the buffer (more compatible with Node.js than File)
    const audioBlob = new Blob([audioBuffer], { type: mimetype });
    
    // Convert blob to file for OpenAI API
    const audioFile = new File([audioBlob], filename, { type: mimetype });
    
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en", // Optional: specify language for better accuracy
      response_format: "text", // Get plain text response
      temperature: 0.2, // Lower temperature for more consistent transcription
    });

    // Handle different response formats from OpenAI SDK
    let transcription: string;
    if (typeof response === 'string') {
      transcription = response;
    } else if (response && typeof response === 'object' && 'text' in response) {
      transcription = response.text as string;
    } else {
      throw new Error('Unexpected response format from OpenAI API');
    }
    
    return transcription.trim();
  } catch (error) {
    // Don't log potentially sensitive audio content or transcription
    console.error("Error transcribing audio - check OpenAI API configuration");
    throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function transcribeAudioWithTimestamps(
  audioBuffer: Buffer, 
  mimetype: string, 
  filename: string = "audio.webm"
): Promise<{
  text: string;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
  }>;
}> {
  try {
    // Create a Blob from the buffer (more compatible with Node.js than File)
    const audioBlob = new Blob([audioBuffer], { type: mimetype });
    
    // Convert blob to file for OpenAI API
    const audioFile = new File([audioBlob], filename, { type: mimetype });
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en",
      response_format: "verbose_json", // Get detailed response with timestamps
      temperature: 0.2,
    });

    return {
      text: transcription.text,
      segments: transcription.segments?.map(segment => ({
        text: segment.text,
        start: segment.start,
        end: segment.end,
      })),
    };
  } catch (error) {
    // Don't log potentially sensitive audio content or transcription
    console.error("Error transcribing audio with timestamps - check OpenAI API configuration");
    throw new Error(`Failed to transcribe audio with timestamps: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}