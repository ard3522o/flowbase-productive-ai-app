"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type UseAssemblyAIStreamingReturn = {
  isRecording: boolean;
  isConnecting: boolean;
  error: string | null;
  liveTranscript: string;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
};

export function useAssemblyAIStreaming(
  onTranscript: (text: string, endOfTurn: boolean) => void
): UseAssemblyAIStreamingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const onTranscriptRef = useRef(onTranscript);

  // Keep ref fresh without re-creating startRecording
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const cleanup = useCallback(() => {
    try { processorRef.current?.disconnect(); } catch {}
    processorRef.current = null;

    try {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
    } catch {}
    audioCtxRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.send(JSON.stringify({ type: "Terminate" }));
        }
        wsRef.current.close();
      } catch {}
    }
    wsRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => () => cleanup(), [cleanup]);

  const startRecording = useCallback(async () => {
    setError(null);
    setLiveTranscript("");
    setIsConnecting(true);

    try {
      // 1. Get temporary token from server
      const tokenRes = await fetch("/api/assemblyai/token");
      if (!tokenRes.ok) throw new Error("Failed to fetch token");
      const { token } = await tokenRes.json();
      if (!token) throw new Error("No token received");

      // 2. Get microphone stream
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = micStream;

      // 3. Connect WebSocket to AssemblyAI
      const params = new URLSearchParams({
        speech_model: "universal-3-5-pro",
        sample_rate: "16000",
        token,
      });
      const wsUrl = `wss://streaming.assemblyai.com/v3/ws?${params}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Wait for open
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("Connection timeout")),
          15000
        );
        ws.onopen = () => {
          clearTimeout(timer);
          resolve();
        };
        ws.onerror = () => {
          clearTimeout(timer);
          reject(new Error("WebSocket failed to connect"));
        };
      });

      // 4. Handle incoming messages
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "Turn") {
            const text = data.transcript || "";
            setLiveTranscript(text);
            console.log("[STT Turn]", { text, end_of_turn: data.end_of_turn, turn_order: data.turn_order });
            onTranscriptRef.current(text, data.end_of_turn === true);
          }
          if (data.type === "Error") {
            setError(data.message || data.error || "Streaming error");
          }
          if (data.type === "Begin") {
            // Session started successfully
          }
        } catch {}
      };

      ws.onerror = () => {
        setError("Connection lost");
        cleanup();
        setIsRecording(false);
        setIsConnecting(false);
      };

      ws.onclose = () => {
        setIsRecording((prev) => {
          if (prev) cleanup();
          return false;
        });
        setIsConnecting(false);
      };

      // 5. Set up audio capture and send PCM16 chunks
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(micStream);

      const bufferSize = 4096;
      const processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const inputData = event.inputBuffer.getChannelData(0);
        // Float32 -> Int16 PCM conversion
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const sample = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        }
        ws.send(pcm16.buffer);
      };

      source.connect(processor);
      // Connect to a silent gain node to keep ScriptProcessor alive
      const silentGain = audioCtx.createGain();
      silentGain.gain.value = 0;
      processor.connect(silentGain);
      silentGain.connect(audioCtx.destination);

      setIsRecording(true);
      setIsConnecting(false);
    } catch (err: any) {
      const msg = err?.name === "NotAllowedError"
        ? "Microphone access denied"
        : err?.message || "Failed to start recording";
      setError(msg);
      cleanup();
      setIsRecording(false);
      setIsConnecting(false);
    }
  }, [cleanup]);

  const stopRecording = useCallback(() => {
    cleanup();
    setLiveTranscript("");
    setIsRecording(false);
  }, [cleanup]);

  return {
    isRecording,
    isConnecting,
    error,
    liveTranscript,
    startRecording,
    stopRecording,
  };
}
