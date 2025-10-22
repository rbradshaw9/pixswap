import { useState } from 'react';

export const useNSFWMode = () => {
  const [nsfwMode, setNsfwMode] = useState(() => {
    const saved = localStorage.getItem('nsfwMode');
    return saved === 'true';
  });

  const handleNSFWModeChange = (value: boolean) => {
    setNsfwMode(value);
    localStorage.setItem('nsfwMode', String(value));
  };

  return { nsfwMode, handleNSFWModeChange };
};
