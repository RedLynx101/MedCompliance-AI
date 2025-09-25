import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square, Trash2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioRecorderProps {
  onTranscription: (audio: Blob, speaker: 'doctor' | 'patient', timestamp: number) => void;
  currentTime: number;
  isEncounterRecording: boolean;
}

export function AudioRecorder({ onTranscription, currentTime, isEncounterRecording }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState<'doctor' | 'patient'>('doctor');
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000, // Whisper works well with 16kHz
        } 
      });
      
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  // Send audio for transcription
  const sendAudio = useCallback(() => {
    if (audioBlob) {
      onTranscription(audioBlob, selectedSpeaker, currentTime);
      setAudioBlob(null);
      setRecordingDuration(0);
    }
  }, [audioBlob, selectedSpeaker, currentTime, onTranscription]);

  // Clear recording
  const clearRecording = useCallback(() => {
    setAudioBlob(null);
    setRecordingDuration(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Format duration display
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isEncounterRecording) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Start the encounter recording to enable audio transcription
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Audio Transcription</h3>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Real-time • Whisper AI
        </div>
      </div>

      {/* Speaker Selection */}
      <div className="flex space-x-2">
        <Button
          variant={selectedSpeaker === 'doctor' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedSpeaker('doctor')}
          data-testid="button-speaker-doctor"
        >
          Doctor
        </Button>
        <Button
          variant={selectedSpeaker === 'patient' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedSpeaker('patient')}
          data-testid="button-speaker-patient"
        >
          Patient
        </Button>
      </div>

      {/* Recording Controls */}
      <div className="flex items-center space-x-3">
        {!isRecording && !audioBlob && (
          <Button
            onClick={startRecording}
            className="flex-1"
            data-testid="button-start-recording"
          >
            <Mic className="w-4 h-4 mr-2" />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <>
            <Button
              onClick={stopRecording}
              variant="destructive"
              className="flex-1"
              data-testid="button-stop-recording"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Recording
            </Button>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {formatDuration(recordingDuration)}
            </div>
          </>
        )}

        {audioBlob && (
          <div className="flex items-center space-x-2 flex-1">
            <Button
              onClick={sendAudio}
              className="flex-1"
              data-testid="button-send-audio"
            >
              <Send className="w-4 h-4 mr-2" />
              Transcribe ({selectedSpeaker})
            </Button>
            <Button
              onClick={clearRecording}
              variant="outline"
              size="sm"
              data-testid="button-clear-recording"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Visual feedback */}
      {isRecording && (
        <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
          <div className={cn(
            "w-2 h-2 rounded-full bg-red-500 animate-pulse"
          )} />
          <span>Recording as {selectedSpeaker}...</span>
        </div>
      )}

      {audioBlob && (
        <div className="text-sm text-green-600 dark:text-green-400">
          ✓ Audio ready for transcription ({formatDuration(recordingDuration)})
        </div>
      )}
    </div>
  );
}