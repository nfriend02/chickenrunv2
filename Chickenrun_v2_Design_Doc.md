### 🐔 [기획서 & 개발 아트북] 종/횡스크롤 반응형 모바일 미니게임: 치킨런 (Chicken Run Game Version2)
**Document Version** : 2.0.0
**Target Platform** : Mobile (Landscape & Portrait / iOS & Android) & Desktop
**Core Theme** : Funny & Comic 3D Animation Running Action

--------------------------------------------------------------------------------

#### 📋 목차 (Table of Contents)
1. [프로젝트 개요 (Project Overview)](#1-프로젝트-개요-project-overview)
2. [조작 방식 및 UI/UX 레이아웃 (Control Scheme & UI/UX)](#2-조작-방식-및-uiux-레이아웃-control-scheme--uiux)
3. [게임 코어 메커니즘 & 규칙 (Core Game Mechanics & Rules)](#3-게임-코어-메커니즘--규칙-core-game-mechanics--rules)
4. [주인공 캐릭터 & 전용 먹이 아이템 10종 (Characters & Food Items)](#4-주인공-캐릭터--전용-먹이-아이템-10종-characters--food-items)
5. [적 & 장애물 요소 (Enemies & Hazards)](#5-적--장애물-요소-enemies--hazards)
6. [스테이지 구성 & 시각 아트 시나리오 (5 Stages & Visual Scenarios)](#6-스테이지-구성--시각-아트-시나리오-5-stages--visual-scenarios)
7. [스테이지별 보스전 & 특수 이벤트 (Boss Chases & Special Events)](#7-스테이지별-보스전--특수-이벤트-boss-chases--special-events)
8. [캐릭터별 스탯, 물리 조작감 & 밸런스 설계 (Stats, Physics & Balance)](#8-캐릭터별-스탯-물리-조작감--밸런스-설계-stats-physics--balance)
9. [콤보 및 피버 시스템 구조 (Combo & Fever System Architecture)](#9-콤보-및-피버-시스템-구조-combo--fever-system-architecture)
10. [인게임 UI 레이아웃 정밀 시안 (In-Game UI Specifications)](#10-인게임-ui-레이아웃-정밀-시안-in-game-ui-specifications)
11. [디자인 종합 아트북 & AI 생성 프롬프트 (Design Artbook & AI Prompts)](#11-디자인-종합-아트북--ai-생성-프롬프트-design-artbook--ai-prompts)
12. [Unity 엔진 모바일/데스크톱 반응형 최적화 가이드 (Engine Optimization Guide)](#12-unity-엔진-모바일데스크톱-반응형-최적화-가이드-engine-optimization-guide)

--------------------------------------------------------------------------------

#### 1. 프로젝트 개요 (Project Overview)
* **게임 제목** : **Chicken Run Game Version2**
* **장르** : 종스크롤 / 횡스크롤 반응형 러닝 액션 (Responsive Running Action Arcade)
* **플랫폼** : 모바일 (가로/세로 완전 반응형, 16:9 ~ 20:9 & 9:16 대응) & 데스크톱 (WebGL / PC)
* **타깃 유저** : 직관적이고 편안한 양손 엄지 조작으로 유쾌하고 코믹한 슬랩스틱 액션을 즐기는 남녀노소 캐주얼 유저
* **비주얼 콘셉트** : 코믹 퍼니 3D 애니메이션 스타일 (Pixar / DreamWorks 풍 툰 렌더링)
* **핵심 루프 (Core Loop)** :
  1. 6초 인트로 동영상(고양이의 닭장 침입 및 주인공 암탉의 탈출)으로 시동
  2. 농장 마당, 울타리 초원, 시골 집안, 산길, 5일장까지 5개 테마 무대를 질주
  3. 다양한 장애물(건초더미, 연못, 울타리, 문턱, 돌진하는 소/자동차, 노점 수레) 회피
  4. 쌀알, 옥수수, 매운 고추, 황금 바나나, 자석 씨앗 등 먹이 아이템 포식 및 피버 모드(Chicken Party) 발동
  5. 스테이지별 늙은 고양이("funny look cat")의 고양이 추격전(Boss Chase) 피날레 극복 및 최고 점수 달성

--------------------------------------------------------------------------------

#### 2. 조작 방식 및 UI/UX 레이아웃 (Control Scheme & UI/UX)

##### 2.1. 모바일 가로화면 UI/UX 레이아웃 (Landscape 16:9 / 20:9)
양손 손바닥 위에 모바일을 편안하게 올린 상태에서 왼손 엄지는 점프(공중제비), 오른손 엄지는 D-Pad 방향 조종에 최적화된 레이아웃입니다.

```
+---------------------------------------------------------------------------------+
| [Safe Area Left: 44pt]                                    [Safe Area Right: 44pt]|
| [≡]  (🪶)(🪶)(🪶)(♡)     [ === Stage 1: Farm Yard (65%) 🐔===> ]      SCORE: 018,250 |
| PAUSE FEATHERS (3/3)                                                COMBO x8!   |
+---------------------------------------------------------------------------------+
|                                                                                 |
|   <--- [배경: 3단계 패러랙스 스크롤 Layer (Far / Mid / Fore)] --->               |
|                                                                                 |
|               [!] WARNING                                                       |
|               (돌진 소 접근)                                                    |
|                                🐔 (Funny Chicken) ---->   🌾 🌽 🌶️              |
|                                                          (먹이 아이콘)          |
|                      🌾 (건초더미)      🪵 (울타리)                             |
|                                                                                 |
+---------------------------------------------------------------------------------+
|  [LEFT THUMB ZONE]                                        [RIGHT THUMB ZONE]    |
|   +----------------+                                     +------------------+   |
|   |   ( O JUMP )   |                                     |       ( ▲ )      |   |
|   |   [공중제비]    |                                     |   ( ◄  ▼  ► )    |   |
|   +----------------+                                     |     [D-PAD]      |   |
|   (Center: X:8%, Y:12%)                                  +------------------+   |
|                                                          (Center: X:88%, Y:10%)  |
+---------------------------------------------------------------------------------+
```

##### 2.2. 모바일 세로화면 UI/UX 레이아웃 (Portrait 9:16)
세로 화면에서는 하단에 점프 및 방향 조작부를 원핸드(One-Hand) 통합 조작 형태로 집약하고, 하단에서 위로 달려나가는 종스크롤 쿼터뷰 앵글로 자동 변환됩니다.

```
+--------------------------------------------------+
| [≡]  (🪶)(🪶)(🪶)    Stage 1 (45%)    SCORE: 012,300 |
+--------------------------------------------------+
|                                                  |
|            ▲ (위로 달려나가는 종스크롤)          |
|                                                  |
|                   🌾 (건초더미)                  |
|                                                  |
|              🌽 (옥수수)                         |
|                                                  |
|            🐔 (주인공 암탉)                      |
|                                                  |
+--------------------------------------------------+
|               [통합 하단 조작 ZONE]              |
|   +---------------+         +----------------+   |
|   |  ( O JUMP )   |         |    ( ▲ )       |   |
|   |   [공중제비]   |         |  ( ◄  ▼  ► )   |   |
|   +---------------+         +----------------+   |
+--------------------------------------------------+
```

##### 2.3. 데스크톱 UI/UX (WebGL / PC)
* **마우스 Hover 조작** : 오른쪽 화살표 아이콘들 위에 마우스 커서를 **클릭 없이 올려놓기만 해도(Hover)** 해당 방향으로 캐릭터가 즉시 이동합니다.
* **점프 조작** : 왼쪽 점프 버튼을 마우스 좌클릭하거나 `Spacebar` 키를 누르면 공중제비를 돌며 장애물을 피합니다.

--------------------------------------------------------------------------------

#### 3. 게임 코어 메커니즘 & 규칙 (Core Game Mechanics & Rules)

##### 3.1. 생명력 및 설정 (Feather HP & Lives System)
* **깃털 체력 시스템 (3회 ~ 6회 설정)** : 환경 설정 메뉴에서 플레이 전 목숨 수(깃털 아이콘)를 **3회, 4회, 5회, 6회 중 선택**할 수 있습니다.
* **피격 판정 & 무적 시간** :
  * 장애물/적 충돌 시 깃털 1개가 차감되며, 1.2초간 **깜빡이는 무적 시간(Invincibility Frame)**이 부여됩니다.
  * 피격 직후 이동 속도가 20% 일시 감속되었다가 부드럽게 재가속됩니다.
* **게임 오버** : 깃털 체력을 모두 소진하면 늙은 고양이에게 잡히는 코믹 컷씬과 함께 결과 화면으로 전환됩니다.

##### 3.2. 점수, 콤보 및 피버 모드 (Chicken Party Fever)
* **먹이 포식 점수** : 쌀알(+10점), 옥수수(+20점), 사과/대추(+30~50점), 매운 고추/황금 바나나(+100점).
* **콤보 타이머 (2.0s)** : 2.0초 이내 연속 포식 시 콤보 배율이 x1.5, x2.0, x3.0까지 증가합니다.
* **치킨 파티 피버 모드 (Chicken Fever)** :
  * 먹이 획득 시 하단 파티 게이지가 상승하며, 100% 충전 시 5초간 **무적 거대 암탉**으로 변신합니다.
  * 피버 타임 동안 모든 장애물은 팝콘과 씨앗으로 변해 부딪히기만 해도 보너스 점수를 쓸어담습니다.

##### 3.3. 스테이지 클리어 조건 & 고양이 추격전 (Boss Chase)
* 각 스테이지는 **90초 ~ 120초** 플레이 분량입니다.
* 스테이지 종료 15초 전 긴박한 경고음과 함께 **늙은 심술 고양이("funny look cat")의 추격전(Boss Chase)**이 발동하며, 이를 성공적으로 피하면 스테이지 클리어 연출로 이어집니다.

--------------------------------------------------------------------------------

#### 4. 주인공 캐릭터 & 전용 먹이 아이템 10종 (Characters & Food Items)

5종의 플레이어블 캐릭터와 각 캐릭터별 10종의 고유 전용 먹이 아이템 매트릭스입니다.

| 캐릭터 | 특성 콘셉트 | 전용 먹이 아이템 10종 |
| :--- | :--- | :--- |
| **젊은 암탉** *(Funny Chicken)* | **올라운더 / 기본형** (주인공) | 1. 쌀알 <br> 2. 옥수수알 <br> 3. 감 <br> 4. 사과 <br> 5. 대추 <br> 6. 바나나 <br> 7. 해바라기 씨앗 <br> 8. 마른 나물 <br> 9. 매운 고추 <br> 10. 황금 옥수수 |
| **대형 수탉** *(Rooster King)* | **묵직한 파워 / 돌파형** | 1. 대형 옥수수 <br> 2. 왕사과 <br> 3. 수박 조각 <br> 4. 땅콩 <br> 5. 콩나물 <br> 6. 황금 벼이삭 <br> 7. 호박씨 <br> 8. 건포도 <br> 9. 왕고추 <br> 10. 황금 바나나 |
| **아기 병아리** *(Speedy Chick)* | **초고속 / 소형 회피형** | 1. 좁쌀 <br> 2. 빵가루 <br> 3. 옥수수가루 <br> 4. 작은 씨앗 <br> 5. 지렁이 <br> 6. 깨소금 <br> 7. 콩가루 <br> 8. 딸기 조각 <br> 9. 미니 고추 <br> 10. 병아리 모이 |
| **레이싱 오리** *(Daffy Duck)* | **수륙양용 / 유연형** | 1. 미꾸라지 <br> 2. 우렁이 <br> 3. 개구리밥 <br> 4. 연못 새우 <br> 5. 물풀 <br> 6. 올챙이 <br> 7. 다첩 조개 <br> 8. 피라미 <br> 9. 매운 수초 <br> 10. 황금 미꾸라지 |
| **터보 칠면조** *(Turbo Turkey)* | **광란 가속 / 분노형** | 1. 통옥수수 <br> 2. 도토리 <br> 3. 밤알 <br> 4. 은행 열매 <br> 5. 감자 조각 <br> 6. 고구마 <br> 7. 호두 <br> 8. 잣 <br> 9. 왕불고추 <br> 10. 무지개 열매 |

--------------------------------------------------------------------------------

#### 5. 적 & 장애물 요소 (Enemies & Hazards)

##### 5.1. 고정 장애물 (Static Obstacles)
1. **농장 지형** : 연못(진입 시 속도 -30% 감속), 건초더미, 울타리, 헛간 벽, 나무의자, 수레, 절구, 절구공이, 호스.
2. **집안 지형** : 높은 문턱, 앤틱 가구, 방석, 엎질러진 찻상, 항아리.
3. **산길 & 시장 지형** : 벼랑 패인 낙사 구멍, 부러진 가드레일, 사과 상자, 노점 좌판, 떡시루.

##### 5.2. 어슬렁거리는 가축 및 돌진 적 (Roaming & Rushing Hazards)
1. **어슬렁거리는 가축** : 강아지, 개, 오리, 닭, 돼지, 생쥐, 다람쥐, 두더지, 양, 염소, 도둑 고양이.
2. **경고 후 돌진 적 (`!` Indicator Rushing)** :
   * **Stage 2** : 돌진하는 성난 소 및 염소.
   * **Stage 3** : 사선으로 굴러오는 대형 절구공이.
   * **Stage 4** : 클락션 소리("빵빵!")와 함께 고속 통과하는 낡은 자동차, 굴러 떨어지는 대형 바위.
   * **Stage 5** : 불규칙하게 뛰어드는 장꾼 인파 및 생선 수레.

--------------------------------------------------------------------------------

#### 6. 스테이지 구성 & 시각 아트 시나리오 (5 Stages & Visual Scenarios)

```
[ Stage 1: 농장 마당 ]     [ Stage 2: 울타리 초원 ]     [ Stage 3: 시골 집안 ]     [ Stage 4: 시골 산길 ]     [ Stage 5: 시골 5일장 ]
  따스한 햇살 & 자갈길      탁 트인 푸른 목장       레트로 장판 & 마루       석양 산길 & 벼랑       와글와글 뻥튀기 시장
```

##### Stage 1: 시골 농장 마당 (Farm Yard) — *포근하고 어수선한 농가 마당*
* **비주얼 아트** : 햇살 내리쬐는 시골 농가, 건초더미, 나무 울타리, 오리 연못, 자갈길. 공기 중에 피어오르는 짚가루와 민들레 홀씨.
* **대표 컬러** : #D2B48C (Khaki), #7CFC00 (Lawn Green), #E6C280 (Straw), #FFD700 (Warm Gold)

##### Stage 2: 울타리 있는 초원 (Fenced Meadow) — *바람 부는 청량한 목장*
* **비주얼 아트** : 탁 트인 푸른 초원, 길게 늘어선 통나무 울타리, 바람에 흔들리는 긴 풀잎과 흙먼지 연출.
* **대표 컬러** : #50C878 (Emerald Green), #A0522D (Sienna Earth), #87CEEB (Sky Blue)

##### Stage 3: 시골 농가 집안 (Rustic Farmhouse) — *아늑하고 미끄러운 대청마루*
* **비주얼 아트** : 윤기 나는 장판 바닥, 높은 문턱, 병풍, 앤틱 장롱, 엎질러진 찻물의 반사 광택.
* **대표 컬러** : #3B2F2F (Dark Brown), #8B0000 (Dark Red), #8FBC8F (Jade Green), #FFA500 (Amber Lamp)

##### Stage 4: 시골 넓은 산길 (Mountain Dirt Road) — *석양 감도는 고속 비포장 산길*
* **비주얼 아트** : 강렬한 붉은 석양 노을, 비포장 산길, 벼랑 끝 가드레일, 낡은 이정표와 속도감 있는 스피드라인.
* **대표 컬러** : #FF4500 (Sunset Orange), #DC143C (Crimson), #696969 (Dim Gray)

##### Stage 5: 시골 5일장 시장안 (Rural 5-Day Market) — *와글와글 화려한 축제 시장*
* **비주얼 아트** : 알록달록한 노점 천막, 떡시루 연기, 과일 상자, 뻥튀기 기계 폭발 연기.
* **대표 컬러** : #FF0000 (Stall Red), #0000FF (Stall Blue), Rainbow Colors (과일/떡 원색)

--------------------------------------------------------------------------------

#### 7. 스테이지별 보스전 & 특수 이벤트 (Boss Chases & Special Events)

##### 1. Stage 1: 농장 마당
* **보스 추격전** : 헛간 문을 차고 등장한 늙은 고양이. 연속 배치된 건초더미 3개를 회피하여 고양이가 건초더미에 파묻히게 유도.
* **특수 이벤트** : **‘아기 병아리 구출 대작전’** (흩어진 병아리 3마리를 모으면 보너스 점수 +1,000점).

##### 2. Stage 2: 울타리 초원
* **보스 추격전** : 방치된 농가 트랙터를 타고 쫓아오는 고양이. 울타리 좁은 길을 통과하여 트랙터가 울타리에 걸려 파괴되게 유도.
* **특수 이벤트** : **‘카우 런 (Cow Stampede)’** (소가 떼지어 뒤에서 함께 달려오는 대혼란 구간).

##### 3. Stage 3: 시골 집안
* **보스 추격전** : 비단이불을 뒤집어쓰고 대청마루에서 쫓아오는 고양이. 연속 문턱을 넘어가면 고양이가 이불에 걸려 뒹굴음.
* **특수 이벤트** : **‘참기름 바닥 슬라이딩’** (미끄러운 구간에서 초고속 미끄러지며 먹이 쓸어담기).

##### 4. Stage 4: 시골 산길
* **보스 추격전** : 낡은 외륜 자전거를 타고 페달을 지치며 쫓아오는 고양이. 산길 흔들다리를 건넌 후 줄이 끊어져 고양이가 나무에 걸림.
* **특수 이벤트** : **‘낙석 경보 & 바위 스피드 라이더’** (굴러오는 바위를 피해 벼랑 길 탈출).

##### 5. Stage 5: 시골 5일장 (최종 피날레)
* **보스 추격전** : 생선 수레를 탄 고양이 3마리가 최종 집념으로 추격.
* **최종 클리어 연출** : 시장 중앙 **"뻥튀기 기계"** 앞으로 유인하여 **"뻥이요!"** 소리와 함께 기계가 터지며 고양이들이 하늘 멀리 날아가버리는 대단원 엔딩.

--------------------------------------------------------------------------------

#### 8. 캐릭터별 스탯, 물리 조작감 & 밸런스 설계 (Stats, Physics & Balance)

##### 8.1. 캐릭터 스탯 매트릭스 (5점 만점)
| 캐릭터 | 이동 속도 | 점프/공중제비 | 피격 판정(Hitbox) | 먹이 자석 흡입 | 추천 플레이 스타일 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **젊은 암탉** | ★3 | ★3 | 보통 (3) | ★3 | **[입문자용]** 올라운더 / 균형 잡힌 물리 |
| **대형 수탉** | ★2 | ★2 | 큼 (4) | ★4 | **[중급자용]** 묵직한 중량감 & 장애물 돌파 |
| **아기 병아리**| ★5 | ★5 | 매우 작음 (1) | ★2 | **[상급자용]** 초고속 반응 & 정밀 회피 |
| **레이싱 오리**| ★4 | ★3 | 보통 (3) | ★3 | **[중급자용]** 수중/기름 바닥 슬라이딩 특화 |
| **터보 칠면조**| ★3 | ★4 | 큼 (4) | ★5 | **[상급자용]** 폭발적 가속 & 분노 게이지 |

##### 8.2. 고유 패시브 & 특수 스킬
1. **젊은 암탉 (Somersault Guard)** : 점프(공중제비) 중 충돌 판정 완벽 무시 및 Landing 피드백 개선.
2. **대형 수탉 (Heavy Break)** : 장애물 충돌 시 1회에 한해 깃털 차감 없이 장애물을 파괴.
3. **아기 병아리 (Feather Dash)** : 이동 속도 +15% 기본 패시브 및 좁은 장애물 사이 통과 가능.
4. **레이싱 오리 (Water Glide)** : 연못 및 기름 바닥 진입 시 감속 패널티 없이 오히려 속도 +20% 증가.
5. **터보 칠면조 (Rage Booster)** : 피격 시 3초간 분노 상태가 되어 무적 속도로 전방 돌진.

--------------------------------------------------------------------------------

#### 9. 콤보 및 피버 시스템 구조 (Combo & Fever System Architecture)

##### 9.1. 기본 메커니즘
* **유효 타이머 (2.0s)** : 먹이 획득 시 2.0초 유효 타이머 게이지 리셋.
* **배율 스케일링** :
  * 1~4 Combo: x1.0 기본 점수
  * 5~9 Combo: x1.5 + 코믹 "꼬꼬!" 효과음
  * 10~19 Combo: x2.0 + 스피드라인 이펙트
  * 20+ Combo (MAX): **x3.0 + CHICKEN FEVER MODE (화면 무지개 빛 발광 & 스크린 셰이크)**
* **리셋** : 2.0초 경과 시 콤보 리셋, 장애물 충돌 시 즉시 리셋.

--------------------------------------------------------------------------------

#### 10. 인기술 UI 레이아웃 정밀 시안 (In-Game UI Specifications)

##### 10.1. 컨트롤러 정밀 스펙

```
[ JUMP (공중제비) 버튼 레이아웃 ]           [ 4방향 D-PAD 레이아웃 ]

      Outer Ring (84dp)                           ( ▲ )  Up Key (36dp)
    +-------------------+                       +-------+
    |   Inner Button    |                       |       |
    |     (68dp)        |         Left Key (36dp)|       | Right Key (36dp)
    |   (( JUMP ))      |          +-------+    +-------+    +-------+
    |                   |          |  ◄    |    | Dead  |    |    ►  |
    +-------------------+          +-------+    | Zone  |    +-------+
       Ripple Effect                             +-------+
       (터치 시 깃털 파동)                      |  ▼    |
                                                +-------+
                                              Down Key (36dp)
```

* **JUMP 버튼 (Left 8%, Bottom 12% 중심)** :
  * Normal: Semi-transparent Yellow (#FFD700, 40% opacity)
  * Pressed: Bright Orange (#FF4500, 80% opacity) + Feather Particle FX.
* **4방향 D-Pad (Right 8%, Bottom 10% 중심)** :
  * 전체 130 × 130dp, 방향키 36 × 36dp.
  * Normal: Semi-transparent White (#FFFFFF, 35% opacity)

--------------------------------------------------------------------------------

#### 11. 디자인 종합 아트북 & AI 생성 프롬프트 (Design Artbook & AI Prompts)

##### 11.1. 비주얼 브랜딩 & 컬러 코드
* **Main Yellow** : #FFD700 (따뜻한 옥수수 골드)
* **Accent Orange** : #FF4500 (화끈한 고추 오렌지)
* **Background Earth** : #D2B48C (포근한 농장 흙색)
* **Deep Brown** : #3B2F2F (레트로 대청마루 브라운)

##### 11.2. 6초 인트로 동영상 시나리오 & Sora 프롬프트
* **시나리오** : 시골 농가 나른한 풍경(0~1.2s) → 늙은 고양이 눈 번쩍 각성 및 닭장 침입(1.2~3.5s) → 주인공 암탉 슬로모션 공중 탈출(3.5~5.0s) → 자갈길 착지 & RUN! 텍스트 팝업(5.0~6.0s).

**Sora Video Prompt** :
A 6-second cinematic 3D Pixar-style arcade game intro video. Starts in a peaceful sunny rural farmyard with a sleeping old grumpy cat. The cat wakes up suddenly as its nose bubble pops with a loud sound and dashes angrily into a bustling wooden chicken coop. Inside, 50 frantic chickens and tiny yellow chicks erupt in total chaos, white feathers flying everywhere. In slow-motion, a funny cute young hen with big round eyes gets bumped and flies gracefully out of the coop window, making a heroic somersault in the air. She lands heroically on the gravel yard, shakes her tail feathers, and starts sprinting forward as bold comic text reading "RUN!" pops up. Vibrant colors, Octane render, 8k resolution, Unreal Engine 5 style toon render, hyper-detailed feather physics, 60fps --ar 16:9

##### 11.3. 첫 화면 (타이틀/메인 화면) 디자인 & 프롬프트
**Title Screen Image Prompt** :
Mobile game main title screen for a horizontal arcade game named "Chicken Run Game Version2". Sunny 3D cartoon farmyard background with green grass, wooden fences, and haystacks. In the center, a funny stylized 3D young hen stands proudly in a heroic somersault pose with glowing yellow light trails. Bold 3D glossy typography logo reading "CHICKEN RUN V2" at top center with wooden and corn texture. Bright orange round button at bottom center labeled "START". Clean mobile UI, 8k resolution, Pixar animation style --ar 16:9

##### 11.4. 스테이지 1~5 배경 이미지 프롬프트
* **Stage 1 (농장 마당)** : Side-scrolling game background stage 1, sunny rural farmyard, golden haystacks, wooden fences, small duck pond with water splashes, green weeds, warm sunlight filtering through barn roof, seamless parallax layer --ar 16:9
* **Stage 2 (울타리 초원)** : Side-scrolling game background stage 2, vast emerald green meadow, long log fences, distant pasture hills, dust clouds from running cattle, bright blue sky with fluffy white clouds, seamless parallax --ar 16:9
* **Stage 3 (시골 집안)** : Side-scrolling game background stage 3, Korean traditional farmhouse interior, glossy polished wooden floor, high door sills, vintage folding screen, spilling tea cups and clay jars, cozy ambient lighting, seamless parallax --ar 16:9
* **Stage 4 (시골 산길)** : Side-scrolling game background stage 4, sunset mountain dirt road, dramatic crimson orange sky, cliff side wooden guardrails, old vintage cars passing by, speed lines, high-contrast lighting, seamless parallax --ar 16:9
* **Stage 5 (시골 5일장)** : Side-scrolling game background stage 5, bustling rural 5-day traditional market, colorful vinyl stall tents, steaming rice cake pots, puffed rice machine with white smoke explosion, festive arcade atmosphere, seamless parallax --ar 16:9

##### 11.5. 게임 설정 화면 (Settings Modal) 프롬프트
**Settings UI Prompt** :
Game UI settings modal pop-up window for mobile game "Chicken Run V2". Dark translucent frosted glass panel overlaying a cartoon farmyard scene. Includes toggle buttons for "Feathers (Lives): 3, 4, 5, 6" with glowing yellow border, slider bars for BGM and SFX with corn-shaped knobs, a button labeled "Controls Setup", clean modern UI icons, glossy arcade style --ar 16:9

##### 11.6. 스코어 / 결과 화면 (Score/Result Screen) 프롬프트
**Score UI Prompt** :
Game score result screen UI for mobile game "Chicken Run V2". A polished wooden card modal floating over a sunny farm background. Displays "STAGE CLEAR" in glowing golden 3D text, large digital score counter reading "182,500", feather bonus stats, and 3 golden star icons at top. Three arcade buttons at bottom: Green "NEXT STAGE", Yellow "RETRY", Blue "HOME". Clean UX, festive feather particle effects --ar 16:9

##### 11.7. 모바일 & 데스크톱 앱 아이콘 프롬프트
* **모바일 스퀘어 아이콘** : Mobile game app icon, squircle shape with rounded corners. Features a dynamic 3D stylized cute hen leaping in a somersault with glowing yellow speed trails over a warm farmyard background. Glossy finish, modern app icon design, 3D render --ar 1:1
* **데스크톱 원형 엠블럼 아이콘** : Desktop game app icon, transparent background, circular 3D golden badge style. Features a funny chicken head popping out of a corn wreath badge with glowing feather effects. Premium metallic and wooden texture, polished game launcher icon --ar 1:1

--------------------------------------------------------------------------------

#### 12. Unity 엔진 모바일/데스크톱 반응형 최적화 가이드 (Engine Optimization Guide)

##### 12.1. 그래픽 & 렌더링 최적화
1. **Sprite Atlas & SRP Batcher** : UI, 먹이, 장애물 스프라이트 텍스처를 Sprite Atlas로 바인딩하여 드로우콜(Draw Call)을 20 이하로 최소화.
2. **Toon Shader 최적화** : URP Simple Lit 기반 모바일 최적화 카툰 셰이더 적용.

##### 12.2. 메모리 관리 & 가비지 컬렉션 (GC)
1. **오브젝트 풀링 (Object Pooling) 필수 도입** :
   * `ObjectPooler.cs`를 이용하여 장애물, 먹이, 파티클, 경고 UI(!) 생성 시 `Instantiate` / `Destroy` 호출을 완전히 금지하고 백그라운드 풀에서 재사용.
2. **C# Managed Heap 파편화 방지** :
   * `Update()` 내 문자열 연결 연산(+) 배제 (`StringBuilder` 또는 텍스트 캐싱 사용).

##### 12.3. 반응형 Canvas Scaler 세팅
* **Canvas Scaler** : `Scale With Screen Size` (Reference Resolution: `1920x1080` / `1080x1920`, Match: `0.5`).
* **Safe Area** : `Screen.safeArea` 코드를 부착하여 기기별 노치 및 카메라 홀 자동 대응.

##### 12.4. 발열 및 디바이스 성능
* `Application.targetFrameRate = 60;` 고정으로 열 스로틀링(Thermal Throttling) 방지.

--------------------------------------------------------------------------------

*End of Game Design Document - Chicken Run Game Version2*
