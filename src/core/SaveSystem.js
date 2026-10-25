const STORAGE_KEY = 'CHICKEN_RUN_V2_DATA';

// Progress fields belong to the signed-in account and are mirrored to Firestore users/{uid}.
export const PROGRESS_KEYS = ['mileage', 'totalRuns', 'highScores', 'selectedCharacter', 'featherLives', 'bgmVolume', 'sfxVolume'];

// Mileage earned per run: a tenth of the score, plus a bonus for clearing the mission.
export function mileageForRun(score, isSuccess) {
  return Math.max(0, Math.floor(score / 10)) + (isSuccess ? 200 : 0);
}

const defaultData = {
  ownerUid: null,
  mileage: 0,
  totalRuns: 0,
  highScores: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  unlockedStages: [1, 2, 3, 4, 5],
  selectedCharacter: 'funny_chicken',
  featherLives: 4,
  bgmVolume: 0.8,
  sfxVolume: 0.9,
  viewMode: 'LANDSCAPE'
};

class SaveSystem {
  constructor() {
    this.data = this.load();
    this.onSave = null;
  }

  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = Object.assign({}, defaultData, JSON.parse(stored));
        // Every stage is open; merge so saves made while stages were locked pick that up.
        data.unlockedStages = [...new Set([...(data.unlockedStages || []), ...defaultData.unlockedStages])];
        return data;
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
    if (this.onSave) this.onSave();
  }

  getMileage() {
    return this.data.mileage || 0;
  }

  /** Records a finished run and returns the mileage it earned. */
  addRunMileage(score, isSuccess) {
    const earned = mileageForRun(score, isSuccess);
    this.data.mileage = this.getMileage() + earned;
    this.data.totalRuns = (this.data.totalRuns || 0) + 1;
    this.save();
    return earned;
  }

  progressSnapshot() {
    const out = {};
    for (const k of PROGRESS_KEYS) out[k] = this.data[k];
    return out;
  }

  /**
   * Adopts the account's cloud progress. High scores keep the better of both when the local data
   * already belongs to this account (e.g. a run finished while offline).
   */
  applyCloud(uid, cloud) {
    const sameOwner = this.data.ownerUid === uid;
    const highScores = { ...defaultData.highScores, ...(cloud.highScores || {}) };
    if (sameOwner) {
      for (const [k, v] of Object.entries(this.data.highScores || {})) highScores[k] = Math.max(highScores[k] || 0, v || 0);
    }
    for (const k of PROGRESS_KEYS) if (cloud[k] !== undefined) this.data[k] = cloud[k];
    if (sameOwner) {
      this.data.mileage = Math.max(this.getMileage(), cloud.mileage || 0);
      this.data.totalRuns = Math.max(this.data.totalRuns || 0, cloud.totalRuns || 0);
    }
    this.data.highScores = highScores;
    this.data.ownerUid = uid;
    this.save();
  }

  /** First sign-in on this account: keep progress made as a signed-out player, but not another account's. */
  claimForNewAccount(uid) {
    if (this.data.ownerUid && this.data.ownerUid !== uid) this.resetProgress();
    this.data.ownerUid = uid;
    this.save();
  }

  resetProgress() {
    this.data.mileage = 0;
    this.data.totalRuns = 0;
    this.data.highScores = { ...defaultData.highScores };
    this.data.ownerUid = null;
    this.save();
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
