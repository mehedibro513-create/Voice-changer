import { useState, useRef, useEffect } from 'react';

export type VoicePreset = 'normal' | 'female' | 'child' | 'robot' | 'monster' | 'chipmunk';

export function useVoiceProcessor() {
  const [isActive, setIsActive] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<VoicePreset>('normal');
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const outputNodeRef = useRef<AudioNode | null>(null);

  // Pitch shift parameters
  const pitchRef = useRef<number>(1.0);

  const stop = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsActive(false);
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      // Simple pitch shifter using ScriptProcessorNode (legacy but works for simple demo)
      // Note: AudioWorklet is preferred but more complex to set up in this environment
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorNodeRef.current = processor;

      let phase = 0;
      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const output = e.outputBuffer.getChannelData(0);
        const pitch = pitchRef.current;

        if (pitch === 1.0) {
          for (let i = 0; i < input.length; i++) output[i] = input[i];
          return;
        }

        // Very basic linear interpolation pitch shifting
        for (let i = 0; i < output.length; i++) {
          const index = Math.floor(phase);
          const nextIndex = (index + 1) % input.length;
          const frac = phase - index;
          
          // Simple interpolation
          if (index < input.length) {
            output[i] = input[index] * (1 - frac) + (input[nextIndex] || 0) * frac;
          } else {
            output[i] = 0;
          }
          
          phase += pitch;
          if (phase >= input.length) {
            phase -= input.length;
          }
        }
      };

      // Effects chain
      let lastNode: AudioNode = source;

      // Apply preset specific nodes if needed (e.g. distortion for robot)
      if (currentPreset === 'robot') {
        const biquad = ctx.createBiquadFilter();
        biquad.type = 'peaking';
        biquad.frequency.value = 1000;
        biquad.Q.value = 10;
        biquad.gain.value = 20;
        lastNode.connect(biquad);
        lastNode = biquad;
      }

      lastNode.connect(processor);
      processor.connect(ctx.destination);
      
      setIsActive(true);
      setError(null);
    } catch (err) {
      console.error('Error starting voice processor:', err);
      setError('Microphone access denied or not supported.');
    }
  };

  useEffect(() => {
    switch (currentPreset) {
      case 'female': pitchRef.current = 1.4; break;
      case 'child': pitchRef.current = 1.8; break;
      case 'chipmunk': pitchRef.current = 2.2; break;
      case 'monster': pitchRef.current = 0.7; break;
      case 'robot': pitchRef.current = 1.0; break; // Handled by filter
      default: pitchRef.current = 1.0;
    }
  }, [currentPreset]);

  return {
    isActive,
    currentPreset,
    setCurrentPreset,
    start,
    stop,
    error
  };
}
