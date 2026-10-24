# 🐔 [개발 기획서] Chicken Run Game Version2

## 1. 프로젝트 개요 (Project Overview)

* **게임 제목:** Chicken Run Game Version2
* **장르:** 종스크롤 / 횡스크롤 반응형 러닝 액션 (Responsive Running Action)
* **엔진 및 개발 환경:** Unity 2D/3D Hybrid (Universal Render Pipeline)
* **타겟 플랫폼:** 모바일 (iOS / Android) & 데스크톱 (WebGL / PC)
* **비주얼 콘셉트:** 코믹 퍼니 3D 카툰 애니메이션 스타일 (Toon Shading)
* **주요 특징:**
  * 모바일 가로/세로 화면 및 데스크톱 환경 각각에 최적화된 **반응형 UX/UI 세팅**
  * **6초 인트로 동영상 컷씬** 및 심리스(Seamless) 게임 진입 연출
  * 5개 테마 스테이지와 스테이지별 **고양이 추격전(Boss Chase) 피날레**
  * 코믹한 특수 아이템(매운 고추, 황금 바나나, 자석 씨앗) 및 피버 모드

---

## 2. 반응형 UX/UI 및 조작 체계 (Responsive Control Scheme)

| 플랫폼/화면 모드 | 스크롤 방향 | 조작 방식 (왼손 / 오른손) | UX 특징 |
| :--- | :--- | :--- | :--- |
| **모바일 가로 (16:9 / 20:9)** | 횡스크롤 (좌 → 우) | **왼손:** 점프 버튼 (공중제비)<br>**오른손:** 4방향 화살표 터치 | 양손 거치 편의성 최적화 배치 |
| **모바일 세로 (9:16)** | 종스크롤 (하 → 상) | **하단:** 원핸드(One-Hand) 통합 조작 레이아웃 | 9:16 쿼터뷰 종스크롤 시야 확보 |
| **데스크톱 (WebGL / PC)** | 횡스크롤 (좌 → 우) | **마우스 Hover:** 화살표 버튼에 마우스 올리기만 해도 이동<br>**점프:** 클릭 또는 Spacebar | 마우스 클릭 없이 직관적 조작 |

---

## 3. 6초 인트로 동영상 컷씬 연출 (Cinematic Intro)

* **영상 길이:** 6.0초 (In-Engine Realtime Cutscene)
* **주요 타임라인:**
  * **0.0s ~ 1.2s:** 시골 농가 풍경 → 자고 있던 늙은 고양이("funny look cat") 콧방울 *팡!* 터지며 눈 번쩍 각성
  * **1.2s ~ 3.5s:** 고양이의 침입 → 닭들(수탉3, 암탉20, 병아리30) 대혼란, 깃털 분사 파티클
  * **3.5s ~ 5.0s:** 주인공 암탉("funny chicken")이 엉겁결에 공중으로 솟구쳐 닭장 밖으로 슬로모션 탈출
  * **5.0s ~ 6.0s:** 마당 자갈길 착지 후 "RUN!" 텍스트 팝업, Stage 1 게임 시점으로 심리스(Seamless) 카메라 전환

---

## 4. 코어 게임 메커니즘 (Core Gameplay Mechanics)

1. **체력 시스템 (깃털 HP):**
   * 기본 체력: **깃털 3개**
   * 충돌 시 깃털 1개 차감, 1.2초간 무적(깜빡임) + 속도 20% 일시 감속 후 재가속
2. **피버 타임 (Chicken Fever):**
   * 먹이 수집 시 게이지 상승, 100% 충전 시 5초간 **무적 거대화 + 장애물 팝콘 변환**
3. **스테이지 클리어 규칙:**
   * 각 스테이지 90초~120초 분량, 종료 15초 전 **'고양이 추격전(Boss Chase)'** 성공 시 클리어

---

## 5. 스테이지별 상세 설계 (Stage 1 ~ Stage 5)

* **Stage 1 [농장 마당]:** 난이도 ★☆☆☆☆ | 속도 1.0x | 연못(감속), 강아지, 오리 | 자석 씨앗 등장 | 고양이가 건초더미에 파묻힘
* **Stage 2 [울타리 초원]:** 난이도 ★★☆☆☆ | 속도 1.2x | 목장 울타리, 느낌표`!` 경고 후 돌진하는 소/염소 | 매운 고추 (불 뿜기 무적 부스터) | 고양이 트랙터 걸림
* **Stage 3 [시골 집안]:** 난이도 ★★★☆☆ | 속도 1.3x | 미끄러운 찻물(관성), 높은 문턱, 굴러오는 절구공이 | 황금 바나나 (2단 점프) | 고양이가 비단이불에 뒹굴며 클리어
* **Stage 4 [시골 산길]:** 난이도 ★★★★☆ | 속도 1.5x | 벼랑 패인 낙사 구멍, 클락션 소리 후 돌진하는 낡은 자동차 | 고득점 야생 열매 | 흔들다리가 끊어지며 고양이 나무에 걸림
* **Stage 5 [시골 5일장]:** 난이도 ★★★★★ | 속도 1.6x | 사과 상자, 수레, 도둑 고양이, 짐 든 사람 | 전설의 황금 옥수수 (피버 타임) | 뻥튀기 기계 폭발과 함께 고양이들이 날아가는 엔딩

---

## 6. 특수 아이템 & 파워업 로직

| 아이템 | 효과 및 지속 시간 | 비주얼 연출 |
| :--- | :--- | :--- |
| **쌀알 / 옥수수알** | 기본 점수 획득 (+10~20점), 피버 게이지 충전 | "팡!" 팝콘 터짐 이펙트 |
| **매운 고추 (Pepper)** | 4초간 이동속도 1.8배 + 입에서 불 뿜기 + 장애물 무적 돌진 | 불 파티클 및 붉은 잔상 연출 |
| **황금 바나나 (Banana)** | 8초간 공중제비 2단 점프(Double Jump) 가능 | 황금빛 스프라이트 오라 연출 |
| **자석 씨앗 (Magnet)** | 6초간 6m 반경 내 모든 먹이 자동 흡수 | 아이템들이 암탉을 향해 가속 이동 |

---

## 7. 유니티 C# 아키텍처 및 시스템 스크립트

```text
Assets/Scripts/
├── Core/               # GameManager.cs, StageManager.cs
├── Player/             # ChickenController.cs (이동/2단점프/부스터/자석)
├── Input/              # InputManager.cs, HoverInputHandler.cs
├── Spawner/            # ObjectPooler.cs, ObstacleSpawner.cs, ItemSpawner.cs
├── Environment/        # ScrollBackground.cs, Obstacle.cs, Item.cs
└── UI/                 # UIManager.cs, SafeAreaHandler.cs, ResponsiveUIManager.cs
```

---

## 8. 비주얼 아트 & 배경 패러랙스 스크롤 (Visual & Parallax)

* **아트 스타일:** 3D 카툰 렌더링 (Toon Shading)
* **3단 패러랙스 레이어 세팅:**
  * **원경 (Far Layer - `0.2x`):** 산등성이, 하늘, 뭉게구름, 노을
  * **중경 (Mid Layer - `0.6x`):** 헛간, 울타리, 가구, 천막
  * **근경 (Fore Layer - `1.0x`):** 도로, 잡초, 자갈, 흩날리는 깃털 및 파티클

---

## 9. Unity 프로젝트 폴더 구조 및 기본 세팅

* **Player Settings:** Auto Rotation 허용 (`Landscape Left/Right`, `Portrait`)
* **Collision Matrix 세팅:** `JumpingPlayer` 레이어와 `Obstacle` 레이어 간 물리 충돌 해제 (공중제비 무적 판정)
* **Canvas Scaler:** Reference Resolution `1920x1080` / `1080x1920`, Match `0.5`
