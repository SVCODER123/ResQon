import { Audio } from 'expo-av';

let _sound = null;
let _playing = false;

export const SirenService = {
  async init() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });
    } catch (e) {
      console.warn('SirenService: audio mode setup failed', e);
    }
  },

  async start() {
    if (_playing) return;

    try {
      if (_sound) {
        await _sound.unloadAsync();
        _sound = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/siren.wav'),
        {
          shouldPlay: true,
          isLooping: true,
          volume: 1.0,
        }
      );

      _sound = sound;
      _playing = true;
    } catch (e) {
      console.warn('SirenService: could not play sound', e);
      _sound = null;
      _playing = false;
    }
  },

  async stop() {
    try {
      if (_sound) {
        await _sound.stopAsync();
        await _sound.unloadAsync();
      }
    } catch (e) {
      console.warn('SirenService: stop failed', e);
    } finally {
      _sound = null;
      _playing = false;
    }
  },

  isPlaying() {
    return _playing;
  },

  async release() {
    await this.stop();
  },
};