export async function playIntroSound() {
  try {
    // Try to load intro.mp3 from public folder
    const audio = new Audio('/intro.mp3');
    audio.volume = 0.5;

    return new Promise((resolve, reject) => {
      audio.addEventListener('canplaythrough', () => {
        audio.play().then(resolve).catch(reject);
      });
      audio.addEventListener('error', reject);
      // If the file doesn't exist quickly, fall back to synthesized
      setTimeout(() => {
        if (audio.readyState < 2) {
          reject(new Error('Audio not loading'));
        }
      }, 500);
    });
  } catch (e) {
    // Fall back to Web Audio API synthesized sound
    return playSynthesizedTaDum();
  }
}

function playSynthesizedTaDum() {
  return new Promise((resolve) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioContext.currentTime;

      // First hit: low sine thump with pitch drop
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(150, now);
      osc1.frequency.exponentialRampToValueAtTime(80, now + 0.3);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Second hit: rising triangle shimmer through lowpass filter
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(200, now + 0.2);
      osc2.frequency.exponentialRampToValueAtTime(800, now + 0.8);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, now + 0.2);
      filter.frequency.exponentialRampToValueAtTime(2000, now + 0.8);
      gain2.gain.setValueAtTime(0.3, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
      osc2.connect(filter);
      filter.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 1.0);

      setTimeout(resolve, 1200);
    } catch (e) {
      // If Web Audio API fails, just resolve silently
      resolve();
    }
  });
}
