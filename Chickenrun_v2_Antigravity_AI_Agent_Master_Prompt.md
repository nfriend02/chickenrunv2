### 🚀 [Antigravity AI Agent Master Prompt] 종/횡스크롤 미니게임 '치킨런 (Chicken Run Game Version2)' 풀패키지 완제 개발 지시서

--------------------------------------------------------------------------------

#### 1. 프롬프트 개요 & 에이전트 미션 (Agent Mission)
* **수신 에이전트** : Antigravity (풀스택 게임 개발 & 풀패키지 프로덕션 코딩 AI 에이전트)
* **발신자** : Lead Game Producer & Architect
* **프로젝트명** : **미니게임 치킨런 (Chicken Run Game Version2)**
* **목표** : 제공된 **Chicken Run Game Version2 개발 기획서** 및 **Chickenrun_Game_Design_Doc**의 모든 요구사항을 100% 충실히 반영하여, 단 하나의 기능 누락 없이 상용 배포 가능한 수준의 **모바일/데스크톱 반응형 코믹 러닝 액션 미니게임** 풀패키지 코드를 구축할 것.
* **개발 환경 표준** :
    * **Engine** : Unity 2022.3 LTS / 2023 LTS (Universal Render Pipeline - URP 2D/3D Hybrid)
    * **Target Platform** : Mobile (Landscape 16:9~20:9 / Portrait 9:16 완전 반응형) & Desktop (WebGL / PC)
    * **Build Target** : APK / AAB / IPA 배포 가능 구조 + WebGL 포팅 호환성 유지

--------------------------------------------------------------------------------

#### 2. 참조 표준 문서 및 사양 준수 가이드
에이전트는 다음 두 문서의 모든 스펙을 연계하여 시스템을 구조화해야 합니다.
1. **Chicken Run Game Version2 개발 기획서** :
   * 6초 인트로 동영상 연출 및 심리스(Seamless) 게임 화면 전환
   * 모바일 가로/세로 및 데스크톱 Hover 반응형 조작 체계
   * 깃털 HP(3개), 피버 모드(Chicken Party), 특수 아이템 3종(매운 고추, 황금 바나나, 자석 씨앗)
2. **Chickenrun_Game_Design_Doc** :
   * 5개 테마 스테이지 상세 기믹, 스크롤 속도 배율 및 고양이 추격전(Boss Chase) 피날레 연출
   * 3단 패러랙스 스크롤(Far/Mid/Fore) 및 카툰 툰 렌더링(Toon Shading) 비주얼
   * 모바일 최적화 (Object Pooling, GC 최소화, Canvas Scaler & Safe Area)

--------------------------------------------------------------------------------

#### 3. 핵심 아키텍처 & 스크립트 모듈 구조 (Architecture Design)
에이전트는 단일 모놀리식 스크립트를 배제하고, 다음과 같이 명확히 분리된 **모듈형 C# Architecture**를 구축해야 합니다.

```
Assets/_Scripts/
├── Core/
│   ├── GameManager.cs              // 전체 게임 상태(Intro, Playing, Fever, Pause, Clear, GameOver) 관리
│   ├── GameState.cs                // GameState, StageState, ControlMode Enum 모음
│   └── SaveSystem.cs               // PlayerPrefs 기반 최고 점수, 스테이지 해금, 옵션 저장소
├── Input/
│   ├── InputManager.cs             // 모바일 터치, 데스크톱 Hover, 키보드 통합 입력 중앙 관리자
│   ├── HoverInputHandler.cs        // 데스크톱 마우스 Hover(PointerEnter/Exit) 조작 처리기
│   └── SafeAreaAdapter.cs          // 모바일 노치/펀치홀 Safe Area 자동 여백 조율
├── Entities/
│   ├── Player/
│   │   ├── ChickenController.cs    // 암탉 이동, 공중제비 점프, 2단 점프, 매운 고추 부스터, 자석 수집
│   │   └── PlayerHitbox.cs         // 충돌 판정, 깃털 HP 차감, 무적 깜빡임 연출
│   ├── Items/
│   │   ├── Item.cs                 // 먹이/아이템 공통 동작, 플레이어 자력 끌림, 획득 FX
│   │   └── ItemData.cs             // 쌀알, 옥수수, 매운 고추, 황금 바나나, 자석 씨앗 스펙
│   └── Hazards/
│       ├── Obstacle.cs             // 장애물 공통 (건초더미, 울타리, 절구공이, 돌진 동물, 자동차)
│       └── WarningIndicator.cs     // 느낌표(!) 경고 인디케이터 및 클락션 경고 로직
├── Boss/
│   └── BossCatChase.cs             // 스테이지 피날레 늙은 고양이 추격전 FSM 및 기믹 파괴 연출
├── Managers/
│   ├── StageManager.cs             // 5개 스테이지 진행률, 배경 패러랙스 스크롤 속도, 피날레 트리거
│   ├── ObstacleSpawner.cs          // Object Pool 기반 장애물 스폰, 느낌표 경고 후 돌진 로직
│   ├── ItemSpawner.cs              // 쌀알 연사 라인 패턴, 가중치 기반 아이템 스포너
│   ├── ScoreManager.cs             // 점수, 콤보 타이머, 피버 게이지(Chicken Party), Pitch Shifted SFX
│   └── AudioManager.cs             // BGM, SFX, 꼬꼬댁 효과음, Haptic 피드백
├── UI/
│   ├── UIMainTitle.cs              // 메인 타이틀, 인트로 동영상 재생 트리거
│   ├── UIHUD.cs                    // 상단 깃털 HP, STAGE PROGRESS, SCORE, COMBO, FEVER BAR
│   ├── ResponsiveUIManager.cs      // 가로/세로/데스크톱 UI 레이아웃 동적 전환 관리자
│   ├── UISettingsModal.cs          // 사운드, 조작 오프셋 및 투명도 설정
│   └── UIResultModal.cs            // Stage Clear / Game Over 리포트, 별점(Star Rating), 점수 카운터
└── Data/
    ├── ScriptableObjects/
    │   ├── ItemDataSO.cs           // 아이템 스탯, 가중치, 파티클, 버프 지속시간
    │   ├── ObstacleDataSO.cs       // 장애물 속도, 경고시간, 출현 스테이지 조건
    │   └── StageDataSO.cs          // 스테이지 배경 팔레트, 스크롤 배속, 보스 추격전 파라미터
    └── ObjectPooler.cs             // 범용 오브젝트 풀링 클래스
```

--------------------------------------------------------------------------------

#### 4. 세부 시스템 구현 스펙 (Detailed Specifications)

##### 4.1. 6초 인트로 동영상 컷씬 & 심리스 전환 스펙 (IntroCutscene.cs & StageManager.cs)
* **컷씬 타임라인 (6.0s)** :
  * **0.0s ~ 1.2s** : 평화로운 농가 → 자고 있던 늙은 고양이("funny look cat") 콧방울 *팡!* 터지며 눈 번쩍 각성.
  * **1.2s ~ 3.5s** : 고양이의 닭장 침입 → 닭들(수탉3, 암탉20, 병아리30) 대혼란, 깃털 파티클 대량 분사.
  * **3.5s ~ 5.0s** : 주인공 암탉("funny chicken")이 공중으로 솟구쳐 닭장 밖으로 슬로모션 탈출.
  * **5.0s ~ 6.0s** : 마당 자갈길 착지, "RUN!" 텍스트 팝업 후 Cinemachine Virtual Camera Blending으로 Stage 1 게임 시점 심리스 전환 (Fade 없음).

##### 4.2. 주인공 암탉 제어 & 특수 파워업 로직 스펙 (ChickenController.cs)
* **기본 조작 & 물리** :
  * **점프 (Somersault)** : 1.2초간 공중제비 돌기, JumpingPlayer 레이어로 변경되어 장애물 충돌 완전 회피.
  * **체력 (Feathers)** : 깃털 3개. 피격 시 깃털 1개 차감 + 1.2초간 깜빡이는 무적 시간 + 20% 일시 감속 후 재가속.
* **특수 파워업 3종 스펙** :
  * **매운 고추 (Spicy Pepper)** : 4초간 이동속도 1.8배 증가, 입에서 불 파티클 분사, 장애물 충돌 시 즉시 파괴하며 무적 돌진.
  * **황금 바나나 (Golden Banana)** : 8초간 2단 점프(Double Jump) 해금, 공중에서 2차 공중제비 수행, 황금빛 오라 연출.
  * **자석 씨앗 (Magnet Seed)** : 6초간 6.0m 반경 내 모든 먹이 아이템이 플레이어를 향해 부드럽게 가속 이동하며 자동 흡수.

##### 4.3. 5개 스테이지 & 장애물/고양이 추격전 구현 스펙 (StageManager.cs & BossCatChase.cs)
1. **Stage 1: 시골 농장 마당 (Farm Yard)**
   * **속도 & 난이도** : 1.0x | ★☆☆☆☆
   * **장애물** : 잡초, 나무의자, 연못(-30% 감속), 어슬렁거리는 강아지/오리.
   * **피날레 고양이 추격전** : 고양이가 헛간 문을 부수고 등장, 연속 건초더미 3개 피하면 고양이가 건초더미에 파묻히며 클리어.
2. **Stage 2: 울타리 있는 초원 (Fenced Meadow)**
   * **속도 & 난이도** : 1.2x | ★★☆☆☆
   * **장애물** : 목장 울타리, 대형 돌멩이, 느낌표! 경고 후 직선 돌진하는 소/염소.
   * **피날레 고양이 추격전** : 고양이가 트랙터를 타고 추격, 울타리 장애물 지대를 통과해 트랙터 걸림 유도.
3. **Stage 3: 시골 농가 집안 (Rustic Farmhouse)**
   * **속도 & 난이도** : 1.3x | ★★★☆☆
   * **장애물** : 엎질러진 찻물(관성 미끄러짐), 높은 문턱, 굴러오는 절구공이, 생쥐.
   * **피날레 고양이 추격전** : 고양이 비단이불 뒤집어쓰고 추격, 연속 문턱 넘어가면 이불에 걸려 뒹굴며 클리어.
4. **Stage 4: 시골 넓은 산길 (Mountain Dirt Road)**
   * **속도 & 난이도** : 1.5x | ★★★★☆
   * **장애물** : 벼랑 패인 낙사 구멍, 대형 바위, 클락션 소리("빵빵!") 후 돌진하는 낡은 자동차.
   * **피날레 고양이 추격전** : 고양이가 외륜 자전거 타고 추격, 흔들다리를 건넌 후 줄이 끊어지며 고양이가 나무 가지에 걸림.
5. **Stage 5: 시골 5일장 시장안 (Rural 5-Day Market)**
   * **속도 & 난이도** : 1.6x | ★★★★★
   * **장애물** : 사과 상자, 노점 수레, 떡시루, 짐 들고 가는 사람, 갑자기 뛰어드는 도둑 고양이.
   * **피날레 고양이 추격전** : 고양이 세 마리가 생선 수레 타고 최종 추격, 뻥튀기 기계 앞으로 유인 후 "뻥이요!" 폭발 연출로 하늘 멀리 날아가며 최종 엔딩.

##### 4.4. 반응형 조작계 & 인체공학적 UI/UX (InputManager.cs & ResponsiveUIManager.cs)
* **모바일 가로 (Landscape 16:9 / 20:9)** :
  * 왼손 하단: 점프 버튼 (공중제비), 오른손 하단: 4방향 D-Pad.
* **모바일 세로 (Portrait 9:16)** :
  * 화면 하단 원핸드(One-Hand) 통합 조작 레이아웃, 종스크롤 쿼터뷰 앵글로 카메라 전환.
* **데스크톱 (WebGL / PC)** :
  * 4방향 화살표 UI 위에 마우스 커서 Hover(PointerEnter) 시 클릭 없이 이동.
  * 좌측 점프 UI 클릭 또는 Spacebar 키 입력 시 점프.

##### 4.5. 콤보 & 피버 모드 스펙 (ScoreManager.cs)
* **점수 & 콤보** : 먹이 획득 시 comboTimer = 2.0f 리셋, 연속 포식 시 SFX AudioSource Pitch 값을 1.0f에서 1.05f씩 상승 (최대 2.0f).
* **피버 타임 (Chicken Party)** : 먹이 획득으로 파티 게이지 100% 충전 시 5초간 무적 거대화 + 장애물이 팝콘으로 변환되는 피버 모드 발동.

--------------------------------------------------------------------------------

#### 5. 모바일/데스크톱 성능 최적화 필수 개발 지침 (Optimization Checklist)
Antigravity 에이전트는 코드 작성 시 프레임 드랍 및 메모리 과부하를 방지하기 위해 다음 규칙을 엄격히 준수해야 합니다.
1. **오브젝트 풀링 (Object Pooling) 100% 적용** :
   * 쌀알, 옥수수, 고추, 바나나, 장애물, 파티클, SFX AudioSource는 런타임 게임루프 중 Instantiate() / Destroy() 호출 금지.
   * ObjectPooler.cs를 통해 미리 생성 후 SetActive(true/false)로 재사용할 것.
2. **가비지 컬렉터 (GC) 스파이크 방지** :
   * Update() 내 string 결합(+) 금지 -> StringBuilder 또는 Caching 사용.
   * GetComponent<T>()는 Awake() / Start()에서 미리 캐싱.
   * LINQ 및 foreach 사용 자제 (인덱스 기반 for 문 사용).
3. **반응형 UI & 렌더링 최적화** :
   * Canvas Scaler: Reference Resolution 1920x1080 (가로) / 1080x1920 (세로), Match 0.5.
   * SafeAreaAdapter.cs로 최신 모바일 기기 노치/펀치홀 대응.
   * Application.targetFrameRate = 60; 및 Screen.sleepTimeout = SleepTimeout.NeverSleep; 세팅.

--------------------------------------------------------------------------------

#### 6. 에이전트 실행 단계별 로드맵 (Execution Roadmap)
에이전트는 다음 7단계 시퀀스에 맞춰 순차적으로 코드를 작성하고 검증해야 합니다.
* **[Phase 1: 코어 프레임워크 & 반응형 입력 구축]**
  * GameManager.cs, GameState.cs, SaveSystem.cs 작성.
  * InputManager.cs, HoverInputHandler.cs, SafeAreaAdapter.cs 반응형 입력 바인딩.
* **[Phase 2: 플레이어 물리학 & 파워업 로직]**
  * ChickenController.cs 공중제비 점프, 2단 점프, 매운 고추 부스터, 자석 수집 및 깃털 HP 피격 구현.
* **[Phase 3: 오브젝트 풀링 & 스포너 패턴]**
  * ObjectPooler.cs, ObstacleSpawner.cs(느낌표 경고 로직 포함), ItemSpawner.cs(쌀알 라인 패턴 포함) 구축.
  * ScoreManager.cs 점수, 콤보 타이머, Pitch Shifted SFX, 피버 모드(Chicken Party) 연결.
* **[Phase 4: 5개 스테이지 & 고양이 추격전 FSM]**
  * StageManager.cs 3단 패러랙스 스크롤.
  * BossCatChase.cs 5개 스테이지별 피날레 고양이 추격전 FSM 및 기믹 연출 완성.
* **[Phase 5: UI/UX & 반응형 레이아웃]**
  * UIMainTitle, UIHUD, ResponsiveUIManager (가로/세로/데스크톱 Layout Switcher), UIResultModal 구축.
* **[Phase 6: 오디오, 파티클 & 6초 인트로 컷씬]**
  * IntroCutscene.cs (6초 타임라인 & 심리스 카메라 전환), AudioManager.cs, 스크린 셰이크 및 팝콘 터짐 연출.
* **[Phase 7: 최종 최적화 & 빌드 검증]**
  * GC 스캔, Object Pool 메모리 누수 점검, Android APK/AAB 및 WebGL 빌드 파이프라인 완성.

--------------------------------------------------------------------------------

#### 7. 에이전트 최종 출력 및 완료 조건 (Final Deliverables)
Antigravity 에이전트는 본 프롬프트 수신 즉시 프로젝트의 전체 C# 소스 코드 모듈, ScriptableObject 데이터 구조체, UI/UX 스크립트, 오브젝트 풀링 및 빌드 셋업 가이드를 완성형 코드로 제시해야 합니다.
단 하나의 TODO나 생략 없이 완전 구현된 풀패키지 게임 시스템을 작성하십시오!
