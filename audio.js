/**
 * Web Audio API Sound Effects Synthesizer
 * 100% procedurally synthesized audio - zero external audio files needed!
 */

window.SoundEngine = (function () {
  let ctx = null;
  let isMuted = false;
  let engineOsc = null;
  let engineGain = null;

  function getContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  return {
    toggleMute: function () {
      isMuted = !isMuted;
      if (isMuted && engineGain) {
        engineGain.gain.setValueAtTime(0, ctx ? ctx.currentTime : 0);
      }
      return isMuted;
    },

    isMuted: function () {
      return isMuted;
    },

    // Soft typewriter / code keystroke click
    playKeyClick: function () {
      if (isMuted) return;
      const c = getContext();
      if (!c) return;

      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400 + Math.random() * 200, c.currentTime);
      gain.gain.setValueAtTime(0.02, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.05);
    },

    // Plane propeller engine sound
    startEngineSound: function (freq = 75) {
      if (isMuted) return;
      const c = getContext();
      if (!c) return;

      try {
        if (!engineOsc) {
          engineOsc = c.createOscillator();
          const filter = c.createBiquadFilter();
          engineGain = c.createGain();

          engineOsc.type = 'sawtooth';
          engineOsc.frequency.setValueAtTime(freq, c.currentTime);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(220, c.currentTime);

          engineGain.gain.setValueAtTime(0.035, c.currentTime);

          engineOsc.connect(filter);
          filter.connect(engineGain);
          engineGain.connect(c.destination);

          engineOsc.start();
        } else {
          engineOsc.frequency.setTargetAtTime(freq, c.currentTime, 0.1);
          engineGain.gain.setTargetAtTime(0.035, c.currentTime, 0.1);
        }
      } catch (e) {
        // audio context handling
      }
    },

    updateEnginePitch: function (freq) {
      if (engineOsc && ctx && !isMuted) {
        engineOsc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.05);
      }
    },

    stopEngineSound: function () {
      if (engineGain && ctx) {
        engineGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.2);
        setTimeout(() => {
          if (engineOsc) {
            try { engineOsc.stop(); } catch (e) {}
            engineOsc = null;
            engineGain = null;
          }
        }, 250);
      }
    },

    // Paint splatter pop
    playSplatter: function (type = 'red') {
      if (isMuted) return;
      const c = getContext();
      if (!c) return;

      const osc = c.createOscillator();
      const gain = c.createGain();

      const baseFreq = type === 'red' ? 320 : (type === 'blue' ? 440 : 580);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq + (Math.random() * 40 - 20), c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, c.currentTime + 0.08);

      gain.gain.setValueAtTime(0.06, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.09);
    },

    // Magical reaction chime when colors blend into purple!
    playPurpleSparkle: function () {
      if (isMuted) return;
      const c = getContext();
      if (!c) return;

      const notes = [587.33, 659.25, 880.00, 1046.50, 1174.66]; // D, E, A, C, D
      const freq = notes[Math.floor(Math.random() * notes.length)];

      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, c.currentTime);

      gain.gain.setValueAtTime(0.08, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.36);
    },

    // LeetCode "Accepted" Chime
    playAcceptedChime: function () {
      if (isMuted) return;
      const c = getContext();
      if (!c) return;

      const chords = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      chords.forEach((freq, idx) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, c.currentTime + idx * 0.09);

        gain.gain.setValueAtTime(0.12, c.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + idx * 0.09 + 0.4);

        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(c.currentTime + idx * 0.09);
        osc.stop(c.currentTime + idx * 0.09 + 0.42);
      });
    },

    // Grand celebration fanfare!
    playCelebrationFanfare: function () {
      if (isMuted) return;
      const c = getContext();
      if (!c) return;

      const melody = [
        { f: 523.25, t: 0.00, d: 0.15 }, // C5
        { f: 659.25, t: 0.15, d: 0.15 }, // E5
        { f: 783.99, t: 0.30, d: 0.15 }, // G5
        { f: 1046.5, t: 0.45, d: 0.40 }, // C6
        { f: 880.00, t: 0.75, d: 0.20 }, // A5
        { f: 1046.5, t: 0.95, d: 0.65 }  // C6 grand hold
      ];

      melody.forEach(note => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, c.currentTime + note.t);

        gain.gain.setValueAtTime(0.16, c.currentTime + note.t);
        gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + note.t + note.d);

        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(c.currentTime + note.t);
        osc.stop(c.currentTime + note.t + note.d + 0.05);
      });
    }
  };
})();
