const STORAGE_KEY = 'CHICKEN_RUN_V2_DATA';

const defaultData = {
  highScores: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  unlockedStages: [1],
  selectedCharacter: 'funny_chicken',
  featherLives: 4,
  bgmVolume: 0.8,
  sfxVolume: 0.9,
  viewMode: 'LANDSCAPE'
};

class SaveSystem {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return Object.assign({}, defaultData, JSON.parse(stored));
      }
    } catch (e) {
      console.warn('LocalStorage load failed, using defaults', e);
    }
    return Object.assign({}, defaultData);
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }

  getHighScore(stageId) {
    return this.data.highScores[stageId] || 0;
  }

  setHighScore(stageId, score) {
    if (!this.data.highScores[stageId] || score > this.data.highScores[stageId]) {
      this.data.highScores[stageId] = score;
      this.save();
      return true;
    }
    return false;
  }

  unlockNextStage(currentStageId) {
    const nextStage = currentStageId + 1;
    if (nextStage <= 5 && !this.data.unlockedStages.includes(nextStage)) {
      this.data.unlockedStages.push(nextStage);
      this.save();
    }
  }

  isStageUnlocked(stageId) {
    return this.data.unlockedStages.includes(stageId);
  }

  getFeatherLives() {
    return this.data.featherLives || 4;
  }

  setFeatherLives(count) {
    this.data.featherLives = count;
    this.save();
  }

  getSelectedCharacter() {
    return this.data.selectedCharacter || 'funny_chicken';
  }

  setSelectedCharacter(charId) {
    this.data.selectedCharacter = charId;
    this.save();
  }

  getSettings() {
    return {
      bgmVolume: this.data.bgmVolume,
      sfxVolume: this.data.sfxVolume,
      viewMode: this.data.viewMode
    };
  }

  setSettings(settings) {
    Object.assign(this.data, settings);
    this.save();
  }
}

export const saveSystem = new SaveSystem();
