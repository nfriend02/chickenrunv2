# 늙은 심술 고양이(cat_grumpy) 3D 애니메이션 요구서 + Flow 프롬프트

## 1. 현재 고양이 연출 분석

### 1-1. 게임 속 고양이의 위치와 카메라 관계

- 카메라는 주인공 **뒤쪽 위**에서 길 앞쪽을 내려다봅니다.
- 고양이는 주인공 **뒤(카메라와 주인공 사이)**에서 주인공을 쫓아 **화면 안쪽(카메라 반대 방향)**으로 달립니다.
- 그래서 플레이어에게 고양이는 거의 항상 **뒷모습 또는 뒤쪽 3/4 각도**로 보여야 자연스럽습니다.
- 고양이는 평소 주인공 옆 차선에서 따라오다가, 덮칠 때 주인공 차선으로 비스듬히 이동합니다. 이때는 **대각선 뒤쪽 3/4 각도**가 필요합니다.

### 1-2. 상태별 현재 클립과 문제점

| 게임 상태 | 하는 일 | 현재 클립 | 문제 |
|---|---|---|---|
| 등장 (ENTERING) | 뒤에서 달려와 따라붙음 | walk (뒷모습 걷기) | 걷기라 느릿함, 추격 긴장감 없음 |
| 추적 (STALKING) | 옆 차선에서 따라옴 | chase (**옆모습**, 왼쪽을 보며 걷기) | 화면 안쪽으로 달리는데 옆을 보고 있어 **종이 인형처럼 미끄러져 보임** |
| 덮치기 준비 (CHARGING) | 0.85초 경고 | angry (**정면**, 팔짱 끼고 서 있음) | 주인공은 화면 안쪽에 있는데 고양이가 **카메라(플레이어)를 보고 있음**, 움직임 거의 없음 |
| 덮치기 (LUNGING) | 앞으로 돌진 | chase (옆모습 걷기) | 도약 없이 옆모습으로 미끄러짐 |
| 회피당함 (EVADED) | 헛짚고 지나감 | angry + **그림 자체를 빙글빙글 회전** | 2D 그림이 평면 회전 → 가장 어색한 장면 |
| 후퇴 (RETREAT) | 뒤로 물러남 | walk (뒷모습) | 뒤로 가는데 앞으로 걷는 모습 → **문워크** |
| 건초더미 돌진 (BURY_RUN, Stage 1) | 건초더미로 달려듦 | chase (옆모습) | 위와 같음 |
| 파묻힘 (BURIED, Stage 1) | 건초더미에 박힘 | defeated (정면 서 있기) + 그림 흔들기 | 박히는 동작이 없음 |
| 패배 (DEFEATED, Stage 2~5) | 날아가며 퇴장 | defeated + **그림 회전하며 하늘로 상승** | 평면 회전, 날아가는 동작 없음 |

공통 문제:
- 원본 영상 4개 중 3개(angry, chase, defeated)가 **정면 또는 옆모습**이라 카메라 방향과 맞지 않습니다.
- angry, defeated는 거의 **제자리에 서 있는 영상**이라 움직임이 적습니다.
- 부족한 움직임을 코드가 **그림 전체를 기울이거나 회전**시켜 메우고 있어 2D 느낌이 강해집니다.

### 1-3. 개선 방향

1. 모든 이동 클립을 **카메라가 고양이 뒤 위쪽에서 따라가며 찍은 영상(뒷모습 / 뒤쪽 3/4)**으로 교체합니다.
2. 회전·넘어짐·날아감은 **영상 속 고양이가 직접 3D로 구르고 뒹구는 동작**으로 만들고, 코드의 평면 회전은 없앱니다.
3. 좌우 대각선 이동은 **오른쪽 방향 한 가지만** 만들고, 왼쪽은 게임에서 좌우 반전해 씁니다.
4. 상태마다 전용 클립을 줘서 행동이 바뀔 때 모습도 확실히 바뀌게 합니다.

## 2. 필요한 동작 목록 (요구서)

저장 위치: `raw_videos/cat_grumpy/<파일명>.mp4` (기존 4개 파일은 그대로 둬도 됩니다)

| 우선 | 파일명 | 동작 | 카메라 각도 | 반복 | 게임 사용처 |
|---|---|---|---|---|---|
| 필수 | `run_back.mp4` | 뒤뚱뒤뚱 전력 질주 (추격 달리기) | 정뒤 위쪽 | 반복 | 등장, 추적, 건초더미 돌진 |
| 필수 | `run_diag.mp4` | 오른쪽 앞 대각선으로 달리기 | 뒤쪽 오른 3/4 | 반복 | 덮치기 전 차선 이동 (왼쪽은 반전) |
| 필수 | `crouch.mp4` | 몸을 낮추고 엉덩이 씰룩, 꼬리 휘두르기 (덮치기 준비) | 정뒤 위쪽 | 반복 | 덮치기 준비 (경고 0.85초) |
| 필수 | `pounce.mp4` | 앞으로 크게 도약, 앞발 쭉 뻗고 날아감 | 정뒤 위쪽 | 1회 | 덮치기 |
| 필수 | `miss_tumble.mp4` | 헛짚고 배로 착지, 앞으로 데굴데굴 구른 뒤 비틀거리며 일어남 | 정뒤 위쪽 | 1회 | 회피당함 (평면 회전 대체) |
| 권장 | `swipe.mp4` | 앞발로 할퀴기 2번 (주인공을 잡았을 때) | 정뒤 위쪽 | 1회 | 덮치기 성공(주인공 피격) 순간 |
| 권장 | `taunt.mp4` | 걸어가며 고개를 돌려 카메라 쪽을 보고 주먹 흔들며 씩씩댐 | 뒤쪽 3/4, 얼굴 보임 | 반복 | 후퇴 (문워크 대체) |
| 권장 | `hiss.mp4` | 멈춰 서서 털 곤두세우고 "하악" 위협, 등 아치 | 뒤쪽 3/4, 옆얼굴 보임 | 1회 | 등장 직후 위협 연출 |
| 필수 | `faceplant.mp4` | 앞으로 고꾸라지며 머리부터 처박힘, 엉덩이 들고 다리 버둥 | 정뒤 위쪽 | 1회 | Stage 1 건초더미 파묻힘 |
| 필수 | `launched.mp4` | 폭발에 날아가듯 위로 튕겨 공중에서 3D로 빙글빙글 구름 | 정뒤 위쪽 | 1회 | Stage 2~5 패배 퇴장 (평면 회전 대체) |
| 선택 | `dizzy.mp4` | 주저앉아 눈이 빙글빙글, 머리 위로 별 도는 듯 비틀 | 앞쪽 3/4 | 반복 | 미션 성공 세레모니 때 화면 뒤쪽 고양이 |

- **필수 7개**만 있어도 위 표의 문제는 모두 해결됩니다.
- 권장·선택 클립이 오면 그 상태에 바로 연결합니다.

## 3. 영상 공통 제작 규격 (중요)

배경 제거와 스프라이트 변환이 잘 되려면 아래 조건을 꼭 지켜 주세요.

1. **길이 4초**, 가로 16:9 (1280×720 이상).
2. **같은 고양이 유지**: Flow에서 `cat_grumpy.png`를 **참조 이미지(Ingredients)**로 넣고 만들어 주세요.
3. **배경은 아무것도 없는 밝은 회색 단색 스튜디오** (바닥 무늬·소품 없음, 연한 그림자만).
4. **다른 동물·사람·물체 금지.** 이전 walk 영상은 배경 멀리 작은 고양이가 하나 더 찍혀 지워야 했습니다.
5. **카메라가 고양이를 따라가서 고양이가 항상 화면 중앙, 같은 크기**로 보이게 (러닝머신 위에서 달리는 느낌). 고양이가 화면 밖으로 멀어지거나 작아지면 안 됩니다.
6. **몸 전체가 항상 화면 안에** (귀·꼬리·발이 잘리지 않게, 위아래 여유).
7. 반복 클립(run_back, run_diag, crouch, taunt, dizzy)은 **처음과 끝 자세가 같게** (자연스러운 반복).
8. 1회 클립은 **0.3초 정도 준비 자세 → 동작 → 마지막 자세 0.5초 유지**.
9. 글자·자막·워터마크·화면 효과(모션 블러 과다, 렌즈 플레어) 없이.

## 4. Flow (Veo) 프롬프트

- 모든 프롬프트는 영어가 결과가 안정적입니다.
- 각 프롬프트는 **[공통 블록] + [동작 블록]**을 합친 것이며, 아래에 합친 완성본을 적었습니다. 그대로 복사해서 쓰시면 됩니다.
- Flow 설정: Text-to-Video 또는 Ingredients-to-Video, 참조 이미지로 `cat_grumpy.png`, 길이 4초, 16:9.

**[공통 블록]** (참고용, 아래 완성본에 이미 들어 있음)

```text
A chubby elderly orange tabby Persian cat with a flat grumpy face, bushy white eyebrows, green eyes, wearing a worn green knitted cardigan, fluffy striped tail with a white tip, Pixar-style 3D animation, soft studio lighting. Plain seamless light-gray studio background, no floor pattern, no props, only a soft contact shadow. No other animals, no people, no text, no watermark. The camera tracks the cat so it stays centered and the same size in frame the whole time, full body always visible with margin around ears, tail and paws. 4 seconds.
```

### 4-1. run_back.mp4 (필수, 반복)

```text
A chubby elderly orange tabby Persian cat with a flat grumpy face, bushy white eyebrows, green eyes, wearing a worn green knitted cardigan, fluffy striped tail with a white tip, Pixar-style 3D animation, soft studio lighting. Plain seamless light-gray studio background, no floor pattern, no props, only a soft contact shadow. No other animals, no people, no text, no watermark. The camera tracks the cat so it stays centered and the same size in frame the whole time, full body always visible with margin around ears, tail and paws. 4 seconds.
Camera directly behind the cat and slightly above (about 30 degrees down), seeing the cat's back. The cat runs straight away from the camera on all fours in a heavy, waddling, determined gallop, belly fur bouncing, cardigan flapping, tail swinging side to side for balance, ears flattened forward. Running in place like on a treadmill, steady speed. Seamless loop: the last frame matches the first frame.
```

### 4-2. run_diag.mp4 (필수, 반복)

```text
A chubby elderly orange tabby Persian cat with a flat grumpy face, bushy white eyebrows, green eyes, wearing a worn green knitted cardigan, fluffy striped tail with a white tip, Pixar-style 3D animation, soft studio lighting. Plain seamless light-gray studio background, no floor pattern, no props, only a soft contact shadow. No other animals, no people, no text, no watermark. The camera tracks the cat so it stays centered and the same size in frame the whole time, full body always visible with margin around ears, tail and paws. 4 seconds.
Rear three-quarter view from behind-left and slightly above: the cat runs diagonally forward and to the right, away from the camera, body angled about 45 degrees, so we see its back, left side and a bit of its grumpy profile. Heavy waddling gallop, leaning into the turn, tail streaming behind. Running in place like on a treadmill. Seamless loop: the last frame matches the first frame.
```

### 4-3. crouch.mp4 (필수, 반복)

```text
A chubby elderly orange tabby Persian cat with a flat grumpy face, bushy white eyebrows, green eyes, wearing a worn green knitted cardigan, fluffy striped tail with a white tip, Pixar-style 3D animation, soft studio lighting. Plain seamless light-gray studio background, no floor pattern, no props, only a soft contact shadow. No other animals, no people, no text, no watermark. The camera stays fixed so the cat is centered and the same size in frame the whole time, full body always visible with margin around ears, tail and paws. 4 seconds.
Camera directly behind the cat and slightly above, seeing its back. The cat crouches low, ready to pounce at something far ahead: front paws pressed down, chest close to the ground, rear end raised, and it wiggles its butt side to side in the classic cat pre-pounce motion, tail lashing back and forth, ears pinned forward, whole body tense. It stays in place and does not jump. Seamless loop: the last frame matches the first frame.
```

### 4-4. pounce.mp4 (필수, 1회)

```text
A chubby elderly orange tabby Persian cat with a flat grumpy face, bushy white eyebrows, green eyes, wearing a worn green knitted cardigan, fluffy striped tail with a white tip, Pixar-style 3D animation, soft studio lighting. Plain seamless light-gray studio background, no floor pattern, no props, only a soft contact shadow. No other animals, no people, no text, no watermark. The camera tracks the cat so it stays centered and the same size in frame the whole time, full body always visible with margin around ears, tail and paws. 4 seconds.
Camera directly behind the cat and slightly above, seeing its back. Starting from a low crouch, the cat launches itself in a big leap forward and upward, away from the camera: front legs stretched far ahead with claws out, back legs fully extended behind, belly and cardigan fluttering, tail straight out. It arcs through the air and lands heavily on its front paws, then holds the landing pose for half a second. One single pounce, no loop.
```

### 4-5. miss_tumble.mp4 (필수, 1회)

```text
A chubby elderly orange tabby Persian cat with a flat grumpy face, bushy white eyebrows, green eyes, wearing a worn green knitted cardigan, fluffy striped tail with a white tip, Pixar-style 3D animation, soft studio lighting. Plain seamless light-gray studio background, no floor pattern, no props, only a soft contact shadow. No other animals, no people, no text, no watermark. The camera tracks the cat so it stays centered and the same size in frame the whole time, full body always visible with margin around ears, tail and paws. 4 seconds.
Camera behind the cat and slightly above. The cat finishes a failed pounce: it belly-flops onto the ground, skids, then somersaults forward in a clumsy full 3D roll over its back, legs flailing, cardigan twisting, and ends sitting up dazed and wobbling, shaking its head angrily. Comedic slapstick timing. One single action, no loop, hold the final dazed sitting pose for half a second.
```

### 4-6. swipe.mp4 (권장, 1회)

```text
A chubby elderly orange tabby Persian cat with a flat grumpy face, bushy white eyebrows, green eyes, wearing a worn green knitted cardigan, fluffy striped tail with a white tip, Pixar-style 3D animation, soft studio lighting. Plain seamless light-gray studio background, no floor pattern, no props, only a soft contact shadow. No other animals, no people, no text, no watermark. The camera stays fixed so the cat is centered and the same size in frame the whole time, full body always visible with margin around ears, tail and paws. 4 seconds.
Camera behind the cat and slightly above, seeing its back and the side of its face. The cat rises onto its hind legs and swipes forward twice with its front paws, claws out, at something just in front of it, body twisting with each swipe, tail whipping, then drops back onto all fours with a satisfied huff. One single action, no loop.
```

### 4-7. taunt.mp4 (권장, 반복)

```text
A chubby elderly orange tabby Persian cat with a flat grumpy face, bushy white eyebrows, green eyes, wearing a worn green knitted cardigan, fluffy striped tail with a white tip, Pixar-style 3D animation, soft studio lighting. Plain seamless light-gray studio background, no floor pattern, no props, only a soft contact shadow. No other animals, no people, no text, no watermark. The camera tracks the cat so it stays centered and the same size in frame the whole time, full body always visible with margin around ears, tail and paws. 4 seconds.
Rear three-quarter view from behind and slightly above. The cat trots slowly away from the camera on its hind legs, then turns its head back over its shoulder toward the camera with a smug, grumpy glare and shakes one fist, muttering, before looking forward again. Walking in place like on a treadmill. Seamless loop: the last frame matches the first frame.
```

### 4-8. hiss.mp4 (권장, 1회)

```text
A chubby elderly orange tabby Persian cat with a flat grumpy face, bushy white eyebrows, green eyes, wearing a worn green knitted cardigan, fluffy striped tail with a white tip, Pixar-style 3D animation, soft studio lighting. Plain seamless light-gray studio background, no floor pattern, no props, only a soft contact shadow. No other animals, no people, no text, no watermark. The camera stays fixed so the cat is centered and the same size in frame the whole time, full body always visible with margin around ears, tail and paws. 4 seconds.
Rear three-quarter view from behind and slightly above, the cat's face visible in profile. The cat stops, arches its back high, all its fur puffs up, tail bristles straight up like a bottle brush, ears flatten, and it hisses fiercely with its mouth wide open toward something ahead, then settles back down, still glaring. One single action, no loop.
```

### 4-9. faceplant.mp4 (필수, 1회)

```text
A chubby elderly orange tabby Persian cat with a flat grumpy face, bushy white eyebrows, green eyes, wearing a worn green knitted cardigan, fluffy striped tail with a white tip, Pixar-style 3D animation, soft studio lighting. Plain seamless light-gray studio background, no floor pattern, no props, only a soft contact shadow. No other animals, no people, no text, no watermark. The camera stays fixed so the cat is centered and the same size in frame the whole time, full body always visible with margin around ears, tail and paws. 4 seconds.
Camera directly behind the cat and slightly above, seeing its back. Running forward, the cat trips and dives head-first, nose-diving into the ground so its head and shoulders are tucked down out of sight, rear end sticking straight up in the air, back legs kicking and paddling helplessly, tail waving frantically. Comedic slapstick. One single action, no loop, end with the cat stuck butt-up and legs still wiggling.
```

### 4-10. launched.mp4 (필수, 1회)

```text
A chubby elderly orange tabby Persian cat with a flat grumpy face, bushy white eyebrows, green eyes, wearing a worn green knitted cardigan, fluffy striped tail with a white tip, Pixar-style 3D animation, soft studio lighting. Plain seamless light-gray studio background, no floor pattern, no props, no smoke, only a soft contact shadow. No other animals, no people, no text, no watermark. The camera tracks the cat so it stays centered and the same size in frame the whole time, full body always visible with margin around ears, tail and paws. 4 seconds.
Camera behind the cat and slightly above. The cat is suddenly blasted upward as if by an explosion: it shoots up off the ground, then tumbles head over heels in the air in full 3D rotations, limbs sprawled, fur and cardigan flapping, eyes wide with shock, mouth yowling. It keeps spinning in mid-air until the end. One single action, no loop.
```

### 4-11. dizzy.mp4 (선택, 반복)

```text
A chubby elderly orange tabby Persian cat with a flat grumpy face, bushy white eyebrows, green eyes, wearing a worn green knitted cardigan, fluffy striped tail with a white tip, Pixar-style 3D animation, soft studio lighting. Plain seamless light-gray studio background, no floor pattern, no props, only a soft contact shadow. No other animals, no people, no text, no watermark. The camera stays fixed so the cat is centered and the same size in frame the whole time, full body always visible with margin around ears, tail and paws. 4 seconds.
Front three-quarter view, slightly above. The defeated cat sits slumped on the ground, swaying in slow circles, eyes spinning in dizzy spirals, tongue sticking out a little, ears drooping, tail limp, occasionally hiccupping. Seamless loop: the last frame matches the first frame.
```

## 5. 영상을 받은 뒤 게임에서 바꿀 내용 (참고)

| 게임 상태 | 새 클립 | 코드 변경 |
|---|---|---|
| 등장 | run_back (+ hiss 1회) | 걷기 대신 달리기, 등장 직후 위협 동작 |
| 추적 | run_back | 옆모습 대신 뒷모습 달리기 |
| 차선 이동 | run_diag | 이동 방향에 따라 좌우 반전 |
| 덮치기 준비 | crouch | 팔짱 정면 포즈 대신 엉덩이 씰룩 |
| 덮치기 | pounce | 도약 높이에 맞춰 공중으로 띄움 |
| 회피당함 | miss_tumble | **평면 회전 제거**, 영상 속 구르기 사용 |
| 주인공 잡음 | swipe | 피격 순간 할퀴기 |
| 후퇴 | taunt | 문워크 제거 |
| 건초더미 파묻힘 | faceplant | 건초더미 앞에서 처박히는 모습 |
| 패배 퇴장 | launched | **평면 회전 제거**, 영상 속 공중제비 + 상승 |
| 미션 성공 뒤 | dizzy | 세레모니 동안 화면 뒤쪽에서 어지러워함 |

- 이동 중 그림 전체를 좌우로 흔들던 효과(기울기 흔들림)도 없애고, 영상 속 몸동작만으로 표현합니다.
- 영상을 넣고 `python scripts/asset_pipeline.py videos --char cat_grumpy` 를 실행하면 스프라이트 시트로 변환됩니다.
