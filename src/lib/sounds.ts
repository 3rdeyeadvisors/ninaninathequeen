export const playSound = (type: 'success' | 'click' | 'remove' | 'error') => {
  const sounds = {
    success: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
    click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
    remove: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
    error: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'
  };

  const audio = new Audio(sounds[type]);
  audio.volume = 0.3;
  audio.play().catch(() => {
    // Sound play blocked by browser - this is expected behavior
  });
};
