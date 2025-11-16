import { useState, useEffect } from 'react';
import { getTimeRemaining } from '../utils/time';

export function useCountdown(timestamp: number) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(timestamp));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(timestamp));
    }, 1000);

    return () => clearInterval(interval);
  }, [timestamp]);

  return timeRemaining;
}
