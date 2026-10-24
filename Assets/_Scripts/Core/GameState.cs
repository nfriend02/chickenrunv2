namespace ChickenRun.Core
{
    public enum GameState
    {
        Title,
        Intro,
        Playing,
        Paused,
        StageClear,
        GameOver
    }

    public enum ControlMode
    {
        MobileLandscape,
        MobilePortrait,
        DesktopHover
    }

    public enum ItemType
    {
        Rice,
        Corn,
        SpicyPepper,
        GoldenBanana,
        MagnetSeed
    }
}
