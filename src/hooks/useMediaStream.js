import { useState, useEffect, useCallback } from 'react';

export const useMediaStream = (constraints) => {
  const [stream, setStream] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const startStream = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

        if (mounted) {
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
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [constraints, stream]);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsReady(false);
    }
  }, [stream]);

  return { stream, isReady, error, stopStream };
};
