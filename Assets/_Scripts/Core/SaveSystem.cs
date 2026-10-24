using UnityEngine;

namespace ChickenRun.Core
{
    public static class SaveSystem
    {
        private const string HIGH_SCORE_PREFIX = "HighScore_Stage_";
        private const string UNLOCKED_STAGE_KEY = "UnlockedStage";
        private const string FEATHER_LIVES_KEY = "FeatherLives";
        private const string BGM_VOL_KEY = "BgmVolume";
        private const string SFX_VOL_KEY = "SfxVolume";

        public static int GetHighScore(int stageId) => PlayerPrefs.GetInt(HIGH_SCORE_PREFIX + stageId, 0);

        public static void SetHighScore(int stageId, int score)
        {
            if (score > GetHighScore(stageId))
            {
                PlayerPrefs.SetInt(HIGH_SCORE_PREFIX + stageId, score);
                PlayerPrefs.Save();
            }
        }

        public static int GetUnlockedStage() => PlayerPrefs.GetInt(UNLOCKED_STAGE_KEY, 1);

        public static void UnlockNextStage(int currentStage)
        {
            int unlocked = GetUnlockedStage();
            if (currentStage >= unlocked && unlocked < 5)
            {
                PlayerPrefs.SetInt(UNLOCKED_STAGE_KEY, currentStage + 1);
                PlayerPrefs.Save();
            }
        }

        public static int GetFeatherLives() => PlayerPrefs.GetInt(FEATHER_LIVES_KEY, 4);
        public static void SetFeatherLives(int count) { PlayerPrefs.SetInt(FEATHER_LIVES_KEY, count); PlayerPrefs.Save(); }

        public static float GetBgmVolume() => PlayerPrefs.GetFloat(BGM_VOL_KEY, 0.8f);
        public static void SetBgmVolume(float val) { PlayerPrefs.SetFloat(BGM_VOL_KEY, val); PlayerPrefs.Save(); }

        public static float GetSfxVolume() => PlayerPrefs.GetFloat(SFX_VOL_KEY, 0.9f);
        public static void SetSfxVolume(float val) { PlayerPrefs.SetFloat(SFX_VOL_KEY, val); PlayerPrefs.Save(); }
    }
}
