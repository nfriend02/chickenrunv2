/**
 * Every player-facing string in three languages. Keys are grouped by screen.
 * `{name}` placeholders are filled by i18n.t(key, { name }).
 */
export const STRINGS = {
  // App
  'app.title': { ko: 'Chicken Run Game Version2 (치킨런 v2)', en: 'Chicken Run Game Version2', ja: 'Chicken Run Game Version2 (チキンラン v2)' },
  'app.description': {
    ko: '코믹 퍼니 3D 애니메이션 스타일 종/횡스크롤 반응형 러닝 액션 미니게임 Chicken Run v2',
    en: 'Chicken Run v2: a comic 3D running action mini-game with vertical and side scrolling',
    ja: 'コミカルな3Dアニメ風の縦・横スクロール ランニングアクション ミニゲーム Chicken Run v2'
  },
  // The button names the language it switches to next (ko → en → ja → ko).
  'lang.label': { ko: 'English', en: 'Japanese', ja: 'Korean' },
  'lang.title': { ko: '영어로 변경', en: 'Switch to Japanese', ja: '韓国語に切り替え' },

  // Intro
  'intro.soundTurnOn': { ko: '사운드 켜기 (현재: 음소거)', en: 'Turn sound on (now muted)', ja: 'サウンドをオン（現在: ミュート）' },
  'intro.soundTurnOff': { ko: '사운드 끄기 (현재: 소리 ON)', en: 'Turn sound off (now on)', ja: 'サウンドをオフ（現在: オン）' },
  'intro.soundAria': { ko: '사운드 켜기/끄기', en: 'Sound on/off', ja: 'サウンド オン/オフ' },
  // In-game HUD and banners
  'hud.pause': { ko: '화면 정지 (관리자, F8)', en: 'Freeze frame (admin, F8)', ja: '画面停止（管理者・F8）' },
  'hud.resume': { ko: '계속 진행 (관리자, F8)', en: 'Resume (admin, F8)', ja: '再開（管理者・F8）' },
  'hud.feathers': { ko: '남은 깃털 HP', en: 'Feathers left (HP)', ja: '残りの羽根 (HP)' },
  'hud.warningDefault': { ko: '위험! 돌진 적 접근!', en: 'Danger! Something is charging!', ja: '危険！突進してくる敵！' },
  'warn.rush': { ko: '{name} 돌진 경고!', en: '{name} charging!', ja: '{name}が突進してくる！' },
  'boss.chase': { ko: '🚨 늙은 심술 고양이 추격 시작!! 🚨', en: '🚨 The grumpy old cat is chasing you!! 🚨', ja: '🚨 意地悪な年寄りネコの追跡開始！！ 🚨' },
  'boss.chaseHay': { ko: '🚨 늙은 고양이가 헛간 문을 부수고 추격 시작!! 🚨', en: '🚨 The old cat smashed the barn door and is after you!! 🚨', ja: '🚨 年寄りネコが納屋の扉を壊して追跡開始！！ 🚨' },
  'boss.bannerDefault': { ko: '늙은 심술 고양이 추격 시작!!', en: 'The grumpy old cat is chasing you!!', ja: '意地悪な年寄りネコの追跡開始！！' },
  'boss.appear': { ko: '🚨 늙은 고양이 출현! (회피 목표: {n}회)', en: '🚨 The old cat appears! (Dodge goal: {n})', ja: '🚨 年寄りネコ出現！（回避目標: {n}回）' },
  'boss.appearHay': {
    ko: '🚪💥 늙은 고양이가 헛간 문을 부수고 나왔다! 건초더미 3개를 연속으로 피하세요!',
    en: '🚪💥 The old cat burst out of the barn! Dodge 3 haystacks in a row!',
    ja: '🚪💥 年寄りネコが納屋の扉を壊して出てきた！干し草を3つ連続でよけよう！'
  },
  'boss.pounce': { ko: '⚠️ 고양이 급습 임박! JUMP 버튼으로 회피하세요! 🪶', en: '⚠️ The cat is about to pounce! Dodge with JUMP! 🪶', ja: '⚠️ ネコの奇襲が来る！JUMPボタンで回避しよう！ 🪶' },
  'boss.buried': { ko: '🌾 고양이가 건초더미에 푹 파묻혔다! 미션 성공!', en: '🌾 The cat is buried in the haystack! Mission complete!', ja: '🌾 ネコが干し草に埋もれた！ミッション成功！' },
  'evade.titleCat': { ko: '⚡ 고양이 공격 회피:', en: '⚡ Dodge the cat:', ja: '⚡ ネコの攻撃回避:' },
  'evade.titleHay': { ko: '🌾 건초더미 회피:', en: '🌾 Dodge the haystacks:', ja: '🌾 干し草回避:' },
  'evade.success': { ko: '⚡ 회피 성공! ({n}/{target})', en: '⚡ Dodged! ({n}/{target})', ja: '⚡ 回避成功！({n}/{target})' },
  'cat.alertDefault': { ko: '고양이 하단 급습! JUMP 버튼으로 회피하세요!', en: 'Cat attack from below! Dodge with JUMP!', ja: 'ネコが下から奇襲！JUMPボタンで回避しよう！' },

  // Mission result
  'ceremony.success': { ko: '⭐ 미션 성공! ⭐', en: '⭐ Mission Complete! ⭐', ja: '⭐ ミッション成功！ ⭐' },
  'mission.success': { ko: '⚡ 미션 성공 ⚡', en: '⚡ Mission Complete ⚡', ja: '⚡ ミッション成功 ⚡' },
  'mission.fail': { ko: '🌧️ 미션 실패 🌧️', en: '🌧️ Mission Failed 🌧️', ja: '🌧️ ミッション失敗 🌧️' },
  'mission.successSub': { ko: '늙은 고양이의 공격을 {n}회 완벽히 회피했습니다!', en: 'You dodged the old cat {n} times!', ja: '年寄りネコの攻撃を{n}回かんぺきに回避しました！' },
  'mission.failSub': { ko: '늙은 고양이의 공격에 쓰러졌습니다...', en: 'The old cat got you...', ja: '年寄りネコの攻撃にやられました…' },
  'mission.haySub': {
    ko: '건초더미를 {n}번 피했더니 늙은 고양이가 건초더미에 처박혔습니다!',
    en: 'You dodged {n} haystacks and the old cat crashed into one!',
    ja: '干し草を{n}回よけたら、年寄りネコが干し草に突っ込みました！'
  },
  'mission.evades': { ko: '회피 성공: {n} / {target}', en: 'Dodged: {n} / {target}', ja: '回避成功: {n} / {target}' },
  'mission.scoreBtn': { ko: '🏆 스코어 보기', en: '🏆 View Score', ja: '🏆 スコアを見る' },

  // Controls
  'controls.jumpAria': { ko: '점프 공중제비', en: 'Jump (somersault)', ja: 'ジャンプ（宙返り）' },
  'controls.jumpSub': { ko: '공중제비', en: 'Flip', ja: '宙返り' },
  'controls.up': { ko: '위로 이동', en: 'Move up', ja: '上へ移動' },
  'controls.left': { ko: '왼쪽으로 이동', en: 'Move left', ja: '左へ移動' },
  'controls.right': { ko: '오른쪽으로 이동', en: 'Move right', ja: '右へ移動' },
  'controls.down': { ko: '아래로 이동', en: 'Move down', ja: '下へ移動' },
  'controls.desktopHint': { ko: '💡 마우스 호버(Hover)만 해도 이동! / 스페이스바: 점프', en: '💡 Just hover to move! / Space: jump', ja: '💡 マウスを乗せるだけで移動！ / スペース: ジャンプ' },

  // Title screen
  'title.desc': { ko: '늙은 심술 고양이를 피해 탈출하라!', en: 'Escape the grumpy old cat!', ja: '意地悪な年寄りネコから逃げ出せ！' },
  'title.heroAlt': { ko: '주인공 닭', en: 'Hero chicken', ja: '主人公のニワトリ' },
  'title.skillTag': { ko: '스킬: {skill}', en: 'Skill: {skill}', ja: 'スキル: {skill}' },
  'title.start': { ko: '게임 시작 (START)', en: 'START', ja: 'ゲームスタート (START)' },
  'title.characters': { ko: '캐릭터 선택 (5종)', en: 'Characters (5)', ja: 'キャラクター選択 (5種)' },
  'title.stages': { ko: '스테이지 선택 (5개)', en: 'Stages (5)', ja: 'ステージ選択 (5つ)' },
  'title.settings': { ko: '환경 설정', en: 'Settings', ja: '設定' },
  'title.viewToggle': { ko: '🔄 화면 전환:', en: '🔄 View:', ja: '🔄 画面切替:' },
  'view.portrait': { ko: '세로 쿼터뷰 (Portrait)', en: 'Portrait quarter view', ja: '縦クォータービュー (Portrait)' },
  'view.landscape': { ko: '가로 횡스크롤 (Landscape)', en: 'Landscape side scroll', ja: '横スクロール (Landscape)' },

  // Characters
  'char.funny_chicken.name': { ko: '젊은 암탉 (Funny Chicken)', en: 'Funny Chicken', ja: '若いメンドリ (Funny Chicken)' },
  'char.funny_chicken.role': { ko: '올라운더', en: 'All-rounder', ja: 'オールラウンダー' },
  'char.funny_chicken.title': { ko: '올라운더 / 기본형 (주인공)', en: 'All-rounder / Standard (Hero)', ja: 'オールラウンダー / 基本型（主人公）' },
  'char.funny_chicken.skill': { ko: '공중제비 무적 가드', en: 'Somersault Guard', ja: '宙返り無敵ガード' },
  'char.rooster_king.name': { ko: '대형 수탉 (Rooster King)', en: 'Rooster King', ja: '大きなオンドリ (Rooster King)' },
  'char.rooster_king.role': { ko: '돌파형', en: 'Breaker', ja: '突破型' },
  'char.rooster_king.title': { ko: '묵직한 파워 / 돌파형', en: 'Heavy power / Breaker', ja: '重量パワー / 突破型' },
  'char.rooster_king.skill': { ko: '묵직한 돌파', en: 'Heavy Break', ja: '重量突破' },
  'char.speedy_chick.name': { ko: '아기 병아리 (Speedy Chick)', en: 'Speedy Chick', ja: 'ひよこ (Speedy Chick)' },
  'char.speedy_chick.role': { ko: '회피형', en: 'Dodger', ja: '回避型' },
  'char.speedy_chick.title': { ko: '초고속 / 소형 회피형', en: 'Super fast / Small dodger', ja: '超高速 / 小型回避型' },
  'char.speedy_chick.skill': { ko: '깃털 대시', en: 'Feather Dash', ja: 'フェザーダッシュ' },
  'char.daffy_duck.name': { ko: '레이싱 오리 (Daffy Duck)', en: 'Daffy Duck', ja: 'レーシングアヒル (Daffy Duck)' },
  'char.daffy_duck.role': { ko: '유연형', en: 'Flexible', ja: '柔軟型' },
  'char.daffy_duck.title': { ko: '수륙양용 / 유연형', en: 'Amphibious / Flexible', ja: '水陸両用 / 柔軟型' },
  'char.daffy_duck.skill': { ko: '수면 활주', en: 'Water Glide', ja: '水面滑走' },
  'char.turbo_turkey.name': { ko: '터보 칠면조 (Turbo Turkey)', en: 'Turbo Turkey', ja: 'ターボ七面鳥 (Turbo Turkey)' },
  'char.turbo_turkey.role': { ko: '분노형', en: 'Rager', ja: '怒り型' },
  'char.turbo_turkey.title': { ko: '광란 가속 / 분노형', en: 'Frenzy boost / Rager', ja: '狂乱加速 / 怒り型' },
  'char.turbo_turkey.skill': { ko: '분노의 질주', en: 'Rage Booster', ja: '怒りの疾走' },

  // Stages
  'stage.1.name': { ko: 'Stage 1: 농장 마당 (Farm Yard)', en: 'Stage 1: Farm Yard', ja: 'Stage 1: 農場の庭 (Farm Yard)' },
  'stage.2.name': { ko: 'Stage 2: 울타리 초원 (Fenced Meadow)', en: 'Stage 2: Fenced Meadow', ja: 'Stage 2: 柵の草原 (Fenced Meadow)' },
  'stage.3.name': { ko: 'Stage 3: 시골 집안 (Rustic Farmhouse)', en: 'Stage 3: Rustic Farmhouse', ja: 'Stage 3: いなかの家 (Rustic Farmhouse)' },
  'stage.4.name': { ko: 'Stage 4: 시골 산길 (Mountain Dirt Road)', en: 'Stage 4: Mountain Dirt Road', ja: 'Stage 4: いなかの山道 (Mountain Dirt Road)' },
  'stage.5.name': { ko: 'Stage 5: 시골 5일장 (Rural 5-Day Market)', en: 'Stage 5: Rural 5-Day Market', ja: 'Stage 5: いなかの市場 (Rural 5-Day Market)' },

  // Obstacles
  'obstacle.haystack': { ko: '건초더미', en: 'Haystack', ja: '干し草の山' },
  'obstacle.fence': { ko: '나무 울타리', en: 'Wooden fence', ja: '木の柵' },
  'obstacle.dog': { ko: '시골 강아지', en: 'Farm dog', ja: 'いなかの子犬' },
  'obstacle.duck': { ko: '오리', en: 'Duck', ja: 'アヒル' },
  'obstacle.pond': { ko: '오리 연못', en: 'Duck pond', ja: 'アヒルの池' },
  'obstacle.cow_rushing': { ko: '돌진 황소', en: 'Charging bull', ja: '突進する牛' },
  'obstacle.popcorn_machine': { ko: '뻥튀기 기계', en: 'Popcorn machine', ja: 'ポン菓子機' },

  // Character / stage pickers
  'modal.characters': { ko: '🐔 캐릭터 선택 (5종)', en: '🐔 Choose a Character (5)', ja: '🐔 キャラクター選択 (5種)' },
  'modal.stages': { ko: '🗺️ 스테이지 선택', en: '🗺️ Choose a Stage', ja: '🗺️ ステージ選択' },
  'pick.selected': { ko: '선택됨', en: 'Selected', ja: '選択中' },
  'pick.select': { ko: '선택', en: 'Select', ja: '選択' },
  'pick.play': { ko: '플레이', en: 'Play', ja: 'プレイ' },
  'pick.locked': { ko: '잠김', en: 'Locked', ja: 'ロック' },
  'pick.stageDesc': { ko: '난이도: {d} | 최고점수: {s}', en: 'Difficulty: {d} | Best: {s}', ja: '難易度: {d} | 最高スコア: {s}' },

  // Settings
  'settings.title': { ko: '⚙️ 환경 설정 (Settings)', en: '⚙️ Settings', ja: '⚙️ 設定 (Settings)' },
  'settings.feathers': { ko: '깃털 체력 (목숨 설정):', en: 'Feather lives:', ja: '羽根の体力（ライフ設定）:' },
  'settings.featherUnit': { ko: '개', en: '', ja: '枚' },
  'settings.bgm': { ko: '배경 음악 (BGM):', en: 'Music (BGM):', ja: 'BGM（背景音楽）:' },
  'settings.sfx': { ko: '효과음 (SFX):', en: 'Sound effects (SFX):', ja: '効果音 (SFX):' },
  'settings.guide': { ko: '조작 모드 안내:', en: 'Controls:', ja: '操作ガイド:' },
  'settings.guideDesktop': {
    ko: '• <strong>데스크톱</strong>: 마우스 커서를 D-Pad 버튼 위에 올리기만 해도 이동 / Spacebar로 점프!',
    en: '• <strong>Desktop</strong>: hover the mouse over the D-Pad to move / Space to jump!',
    ja: '• <strong>デスクトップ</strong>: マウスをD-Padに乗せるだけで移動 / スペースでジャンプ！'
  },
  'settings.guideLandscape': {
    ko: '• <strong>모바일 가로</strong>: 왼손 점프(공중제비) / 오른손 4방향 D-Pad 터치',
    en: '• <strong>Mobile landscape</strong>: left thumb jumps (flip) / right thumb taps the D-Pad',
    ja: '• <strong>モバイル横</strong>: 左手でジャンプ（宙返り）/ 右手で4方向D-Padをタッチ'
  },
  'settings.guidePortrait': {
    ko: '• <strong>모바일 세로</strong>: 화면 하단 원핸드 조작 & 쿼터뷰 종스크롤',
    en: '• <strong>Mobile portrait</strong>: one-hand controls at the bottom & quarter-view vertical scroll',
    ja: '• <strong>モバイル縦</strong>: 画面下で片手操作 & クォータービュー縦スクロール'
  },
  'settings.done': { ko: '확인 완료', en: 'Done', ja: '完了' },

  // Result
  'result.score': { ko: '최종 점수:', en: 'Final score:', ja: '最終スコア:' },
  'result.combo': { ko: '최고 콤보:', en: 'Best combo:', ja: '最高コンボ:' },
  'result.feathers': { ko: '남은 깃털:', en: 'Feathers left:', ja: '残りの羽根:' },
  'result.mileage': { ko: '획득 마일리지:', en: 'Mileage earned:', ja: '獲得マイレージ:' },
  'result.mileageValue': { ko: '+{earned} (누적 {total})', en: '+{earned} (total {total})', ja: '+{earned}（累計 {total}）' },
  'result.none': { ko: '없음', en: 'None', ja: 'なし' },
  'result.next': { ko: '다음 스테이지 ⏩', en: 'Next stage ⏩', ja: '次のステージ ⏩' },
  'result.retry': { ko: '다시 도전 🔄', en: 'Try again 🔄', ja: 'もう一度 🔄' },
  'result.home': { ko: '메인으로 🏠', en: 'Main menu 🏠', ja: 'メインへ 🏠' },

  // Login / sign-up
  'login.title': { ko: '로그인', en: 'Log In', ja: 'ログイン' },
  'login.sub': { ko: '로그인하면 마일리지와 기록이 저장돼요', en: 'Log in to save your mileage and records', ja: 'ログインするとマイレージと記録が保存されます' },
  'login.google': { ko: 'Google로 로그인', en: 'Log in with Google', ja: 'Googleでログイン' },
  'login.email': { ko: '이메일로 로그인', en: 'Log in with email', ja: 'メールでログイン' },
  'login.phone': { ko: '휴대폰번호로 로그인', en: 'Log in with phone number', ja: '携帯番号でログイン' },
  'login.guest': { ko: '게스트로 시작', en: 'Play as guest', ja: 'ゲストで始める' },
  'login.signupLink': { ko: '처음이면 <b>회원가입</b> ▶', en: 'New here? <b>Sign up</b> ▶', ja: 'はじめての方は<b>会員登録</b> ▶' },
  'login.submit': { ko: '로그인', en: 'Log in', ja: 'ログイン' },
  'login.forgot': { ko: '비밀번호를 잊으셨나요?', en: 'Forgot your password?', ja: 'パスワードをお忘れですか？' },
  'login.back': { ko: '◀ 다른 방법으로 로그인', en: '◀ Other ways to log in', ja: '◀ 別の方法でログイン' },
  'signup.title': { ko: '회원가입', en: 'Sign Up', ja: '会員登録' },
  'signup.sub': { ko: '가입하면 마일리지와 기록이 계속 보관돼요', en: 'Sign up to keep your mileage and records for good', ja: '登録するとマイレージと記録がずっと保存されます' },
  'signup.email': { ko: '이메일 회원가입', en: 'Sign up with email', ja: 'メールで登録' },
  'signup.phone': { ko: '휴대폰번호 회원가입', en: 'Sign up with phone number', ja: '携帯番号で登録' },
  'signup.haveAccount': { ko: '◀ 이미 계정이 있어요 (로그인)', en: '◀ I already have an account (log in)', ja: '◀ アカウントをお持ちの方（ログイン）' },
  'signup.submit': { ko: '가입하기', en: 'Sign up', ja: '登録する' },
  'signup.back': { ko: '◀ 가입 방법 다시 고르기', en: '◀ Choose another way', ja: '◀ 登録方法を選び直す' },
  'guest.title': { ko: '게스트 별명 정하기', en: 'Choose a Guest Nickname', ja: 'ゲストのニックネーム' },
  'guest.sub': { ko: '게임 기록과 마일리지는 이 별명으로 저장돼요', en: 'Your records and mileage are saved under this nickname', ja: '記録とマイレージはこのニックネームで保存されます' },
  'guest.submit': { ko: '🐣 이 별명으로 시작', en: '🐣 Start with this nickname', ja: '🐣 このニックネームで始める' },
  'guest.note': { ko: '게스트는 로그아웃하면 별명과 마일리지를 다시 불러올 수 없어요.', en: "Guests can't get their nickname and mileage back after logging out.", ja: 'ゲストはログアウトするとニックネームとマイレージを復元できません。' },

  // Form placeholders and labels
  'field.email': { ko: '이메일', en: 'Email', ja: 'メールアドレス' },
  'field.password': { ko: '비밀번호', en: 'Password', ja: 'パスワード' },
  'field.passwordNew': { ko: '비밀번호 (6자 이상)', en: 'Password (6+ characters)', ja: 'パスワード（6文字以上）' },
  'field.passwordConfirm': { ko: '비밀번호 확인', en: 'Confirm password', ja: 'パスワード（確認）' },
  'field.countryCode': { ko: '국가번호', en: 'Country code', ja: '国番号' },
  'field.phone': { ko: '휴대폰번호', en: 'Phone number', ja: '携帯番号' },
  'field.phonePlaceholder': { ko: '10 1234 5678', en: '10 1234 5678', ja: '90 1234 5678' },
  'field.nickname': { ko: '별명 (2~12자)', en: 'Nickname (2–12 characters)', ja: 'ニックネーム（2〜12文字）' },

  // Auth messages
  'auth.err.invalidEmail': { ko: '이메일 형식이 올바르지 않아요.', en: 'That email address looks wrong.', ja: 'メールアドレスの形式が正しくありません。' },
  'auth.err.missingPassword': { ko: '비밀번호를 입력해 주세요.', en: 'Please enter your password.', ja: 'パスワードを入力してください。' },
  'auth.err.weakPassword': { ko: '비밀번호는 6자 이상이어야 해요.', en: 'Passwords need at least 6 characters.', ja: 'パスワードは6文字以上にしてください。' },
  'auth.err.emailInUse': { ko: '이미 가입된 이메일이에요. 로그인해 주세요.', en: 'This email is already registered. Please log in.', ja: 'このメールは登録済みです。ログインしてください。' },
  'auth.err.wrongEmailLogin': { ko: '이메일 또는 비밀번호가 맞지 않아요.', en: 'Wrong email or password.', ja: 'メールアドレスまたはパスワードが違います。' },
  'auth.err.emailNotFound': { ko: '가입되지 않은 이메일이에요.', en: 'No account uses this email.', ja: '登録されていないメールアドレスです。' },
  'auth.err.tooMany': { ko: '시도가 너무 많아요. 잠시 후 다시 해 주세요.', en: 'Too many attempts. Please try again later.', ja: '試行回数が多すぎます。しばらくしてからお試しください。' },
  'auth.err.popupClosed': { ko: '로그인 창이 닫혔어요.', en: 'The login window was closed.', ja: 'ログイン画面が閉じられました。' },
  'auth.err.domain': { ko: '이 주소에서는 로그인할 수 없어요. (Firebase 승인 도메인 확인 필요)', en: "Login isn't allowed from this address (check Firebase authorized domains).", ja: 'このアドレスではログインできません（Firebaseの承認済みドメインを確認）。' },
  'auth.err.disabled': { ko: '이 로그인 방법이 Firebase에서 꺼져 있어요.', en: 'This login method is turned off in Firebase.', ja: 'このログイン方法はFirebaseで無効になっています。' },
  'auth.err.network': { ko: '네트워크 연결을 확인해 주세요.', en: 'Please check your network connection.', ja: 'ネットワーク接続を確認してください。' },
  'auth.err.phoneInUse': { ko: '이미 가입된 휴대폰번호예요. 로그인해 주세요.', en: 'This phone number is already registered. Please log in.', ja: 'この携帯番号は登録済みです。ログインしてください。' },
  'auth.err.wrongPhoneLogin': { ko: '휴대폰번호 또는 비밀번호가 맞지 않아요.', en: 'Wrong phone number or password.', ja: '携帯番号またはパスワードが違います。' },
  'auth.err.phoneNotFound': { ko: '가입되지 않은 휴대폰번호예요.', en: 'No account uses this phone number.', ja: '登録されていない携帯番号です。' },
  'auth.err.phoneInvalid': { ko: '휴대폰번호 형식이 올바르지 않아요.', en: 'That phone number looks wrong.', ja: '携帯番号の形式が正しくありません。' },
  'auth.err.unknown': { ko: '처리하지 못했어요. ({code})', en: "Something went wrong. ({code})", ja: '処理できませんでした。({code})' },
  'auth.in.countryCode': { ko: '국가번호를 확인해 주세요. (예: +82)', en: 'Please check the country code (e.g. +82).', ja: '国番号を確認してください（例: +81）。' },
  'auth.in.phoneDigits': { ko: '휴대폰번호는 숫자만 입력해 주세요.', en: 'Phone numbers can only contain digits.', ja: '携帯番号は数字だけで入力してください。' },
  'auth.in.phoneLength': { ko: '휴대폰번호를 확인해 주세요. (예: 10 1234 5678)', en: 'Please check the phone number (e.g. 10 1234 5678).', ja: '携帯番号を確認してください（例: 90 1234 5678）。' },
  'auth.in.passwordMismatch': { ko: '비밀번호 확인이 일치하지 않아요.', en: "The passwords don't match.", ja: '確認用パスワードが一致しません。' },
  'auth.in.emailRequired': { ko: '이메일을 입력해 주세요.', en: 'Please enter your email.', ja: 'メールアドレスを入力してください。' },
  'auth.in.nickname': { ko: '별명은 2~12자로 정해 주세요.', en: 'Nicknames need 2–12 characters.', ja: 'ニックネームは2〜12文字にしてください。' },
  'auth.in.resetEmail': { ko: '비밀번호를 재설정할 이메일을 먼저 입력해 주세요.', en: 'Enter the email to reset the password for first.', ja: '再設定するメールアドレスを先に入力してください。' },
  'auth.resetSent': { ko: '{email} 로 비밀번호 재설정 메일을 보냈어요.', en: 'We sent a password reset email to {email}.', ja: '{email} にパスワード再設定メールを送りました。' },

  // Account bar and My Page
  'account.guest': { ko: '게스트', en: 'Guest', ja: 'ゲスト' },
  'account.mypage': { ko: '🐔 마이페이지', en: '🐔 My Page', ja: '🐔 マイページ' },
  'account.logout': { ko: '로그아웃', en: 'Log out', ja: 'ログアウト' },
  'provider.guest': { ko: '게스트', en: 'Guest', ja: 'ゲスト' },
  'provider.google': { ko: 'Google', en: 'Google', ja: 'Google' },
  'provider.email': { ko: '이메일', en: 'Email', ja: 'メール' },
  'provider.phone': { ko: '휴대폰번호', en: 'Phone number', ja: '携帯番号' },
  'mypage.mileage': { ko: '마일리지', en: 'Mileage', ja: 'マイレージ' },
  'mypage.runs': { ko: '플레이 <b>{n}</b>회', en: 'Played <b>{n}</b>', ja: 'プレイ <b>{n}</b>回' },
  'mypage.method': { ko: '로그인 방법', en: 'Login method', ja: 'ログイン方法' },
  'mypage.idNickname': { ko: '별명', en: 'Nickname', ja: 'ニックネーム' },
  'mypage.idPhone': { ko: '휴대폰번호', en: 'Phone number', ja: '携帯番号' },
  'mypage.idGoogle': { ko: 'Google 계정', en: 'Google account', ja: 'Googleアカウント' },
  'mypage.idEmail': { ko: '이메일', en: 'Email', ja: 'メールアドレス' },
  'mypage.password': { ko: '비밀번호', en: 'Password', ja: 'パスワード' },
  'mypage.change': { ko: '변경', en: 'Change', ja: '変更' },
  'mypage.passwordHint': {
    ko: '비밀번호는 암호화되어 저장되므로 원래 글자는 다시 볼 수 없어요. 아래에서 새 비밀번호로 바꿀 수 있어요.',
    en: "Passwords are stored encrypted, so they can't be shown. You can set a new one below.",
    ja: 'パスワードは暗号化して保存されるため表示できません。下で新しいパスワードに変更できます。'
  },
  'mypage.currentPassword': { ko: '현재 비밀번호', en: 'Current password', ja: '現在のパスワード' },
  'mypage.newPassword': { ko: '새 비밀번호 (6자 이상)', en: 'New password (6+ characters)', ja: '新しいパスワード（6文字以上）' },
  'mypage.newPasswordConfirm': { ko: '새 비밀번호 확인', en: 'Confirm new password', ja: '新しいパスワード（確認）' },
  'mypage.changePassword': { ko: '비밀번호 변경', en: 'Change password', ja: 'パスワード変更' },
  'mypage.googleManaged': { ko: 'Google 계정에서 관리해요', en: 'Managed by your Google account', ja: 'Googleアカウントで管理されます' },
  'mypage.guestNoPassword': { ko: '게스트는 비밀번호가 없어요', en: "Guests don't have a password", ja: 'ゲストにはパスワードがありません' },
  'mypage.newNickname': { ko: '새 별명 (2~12자)', en: 'New nickname (2–12 characters)', ja: '新しいニックネーム（2〜12文字）' },
  'mypage.changeNickname': { ko: '별명 변경', en: 'Change nickname', ja: 'ニックネーム変更' },
  'mypage.guestWarn': {
    ko: '게스트는 로그아웃하면 이 별명과 마일리지를 다시 불러올 수 없어요. 계속 보관하려면 회원가입을 해 주세요.',
    en: "Guests can't get this nickname and mileage back after logging out. Sign up to keep them.",
    ja: 'ゲストはログアウトするとこのニックネームとマイレージを復元できません。保存するには会員登録してください。'
  },
  'mypage.joined': { ko: '가입일', en: 'Joined', ja: '登録日' },
  'mypage.bestScores': { ko: '🏆 스테이지 최고 점수', en: '🏆 Best Scores', ja: '🏆 ステージ最高スコア' },
  'mypage.err.currentRequired': { ko: '현재 비밀번호를 입력해 주세요.', en: 'Please enter your current password.', ja: '現在のパスワードを入力してください。' },
  'mypage.err.newTooShort': { ko: '새 비밀번호는 6자 이상이어야 해요.', en: 'The new password needs at least 6 characters.', ja: '新しいパスワードは6文字以上にしてください。' },
  'mypage.err.newMismatch': { ko: '새 비밀번호 확인이 일치하지 않아요.', en: "The new passwords don't match.", ja: '新しいパスワードの確認が一致しません。' },
  'mypage.err.wrongCurrent': { ko: '현재 비밀번호가 맞지 않아요.', en: 'The current password is wrong.', ja: '現在のパスワードが違います。' },
  'mypage.err.recentLogin': { ko: '보안을 위해 다시 로그인한 뒤 바꿔 주세요.', en: 'For security, log in again and then change it.', ja: 'セキュリティのため、再ログインしてから変更してください。' },
  'mypage.passwordChanged': { ko: '비밀번호를 바꿨어요. 다음 로그인부터 새 비밀번호를 쓰세요.', en: 'Password changed. Use the new one next time you log in.', ja: 'パスワードを変更しました。次回から新しいパスワードを使ってください。' },
  'mypage.nicknameChanged': { ko: '별명을 바꿨어요.', en: 'Nickname changed.', ja: 'ニックネームを変更しました。' },
  'confirm.cancel': { ko: '취소', en: 'Cancel', ja: 'キャンセル' },
  'confirm.ok': { ko: '확인', en: 'OK', ja: 'OK' },
  'confirm.logoutGuest': {
    ko: '게스트는 로그아웃하면 별명과 마일리지를 다시 불러올 수 없어요. 로그아웃할까요?',
    en: "Guests can't get their nickname and mileage back after logging out. Log out?",
    ja: 'ゲストはログアウトするとニックネームとマイレージを復元できません。ログアウトしますか？'
  },
  'confirm.logout': { ko: '로그아웃할까요? 마일리지와 기록은 계정에 안전하게 보관돼요.', en: 'Log out? Your mileage and records stay safe in your account.', ja: 'ログアウトしますか？マイレージと記録はアカウントに安全に保存されます。' }
};
