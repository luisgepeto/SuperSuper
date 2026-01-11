import { useState, useEffect, useCallback, useRef } from 'react';

export const useMediaStream = (constraints) => {
  const [stream, setStream] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const startStream = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

        if (mounted) {
          streamRef.current = mediaStream;
          setStream(mediaStream);
          setIsReady(true);
        }
      } catch (err) {
        console.error('Media stream error:', err);
        if (mounted) {
          setError(err.message || 'Unable to access media device');
        }
      }
    };

    startStream();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [constraints]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
      setIsReady(false);
    }
  }, []);

  return { stream, isReady, error, stopStream };
};
