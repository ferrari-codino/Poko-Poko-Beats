import { RPGLevelConfig, RPGDifficultyTier, DrumPartId, Difficulty, RPGProgress, SongData, RhythmNote } from '../types';
import { SONGS } from './songs';

export interface TierInfo {
  tier: RPGDifficultyTier;
  title: string;
  minLevel: number;
  maxLevel: number;
  coachId: string;
  themeColor: string;
  description: string;
  unlockedPartsSummary: string;
}

export const RPG_TIERS: Record<RPGDifficultyTier, TierInfo> = {
  beginner: {
    tier: 'beginner',
    title: '初級コース（基礎トレーニング）',
    minLevel: 1,
    maxLevel: 20,
    coachId: 'rabi_sensei',
    themeColor: '#ec4899',
    description: 'ドラムの心臓であるキックとスネアからスタート。実際のレッスン同様、最小限のパーツから段階的に解放して基本の8ビートをマスター！',
    unlockedPartsSummary: 'バスドラム → スネア → ハイハット → クラッシュ → フロアタム',
  },
  intermediate: {
    tier: 'intermediate',
    title: '中級コース（グルーヴ＆フィルイン）',
    minLevel: 21,
    maxLevel: 60,
    coachId: 'fox_senpai',
    themeColor: '#f59e0b',
    description: 'タム回し、ハイハットの開閉、シンコペーション、16ビートを習得！バンドを牽引する躍動感あふれるグルーヴを体得する実戦ステージ。',
    unlockedPartsSummary: 'ハイタム・ロータム → オープンハイハット → 16ビート・ゴーストノート',
  },
  advanced: {
    tier: 'advanced',
    title: '上級コース（プロフェッショナル極）',
    minLevel: 61,
    maxLevel: 100,
    coachId: 'leo_shisho',
    themeColor: '#a855f7',
    description: 'フルキット完全解放！ライドシンバルのカップ打ち分け、5/4・7/8等の変拍子、ポリリズム、パラディドル連打を極める百戦錬磨の頂点。',
    unlockedPartsSummary: 'ライドシンバル含むフルドラムセット完全解放・変拍子・ポリリズム',
  },
};

// Return the tier for a given level
export function getTierForLevel(level: number): RPGDifficultyTier {
  if (level <= 20) return 'beginner';
  if (level <= 60) return 'intermediate';
  return 'advanced';
}

// Return the allowed unlocked parts for a given level
export function getUnlockedPartsForLevel(level: number): DrumPartId[] {
  if (level <= 3) {
    return ['kick'];
  } else if (level <= 7) {
    return ['kick', 'snare'];
  } else if (level <= 12) {
    return ['kick', 'snare', 'hihatClosed'];
  } else if (level <= 16) {
    return ['kick', 'snare', 'hihatClosed', 'crash'];
  } else if (level <= 20) {
    return ['kick', 'snare', 'hihatClosed', 'crash', 'tomFloor'];
  } else if (level <= 30) {
    return ['kick', 'snare', 'hihatClosed', 'crash', 'tomFloor', 'tomHigh', 'tomLow'];
  } else if (level <= 60) {
    return ['kick', 'snare', 'hihatClosed', 'hihatOpen', 'crash', 'tomFloor', 'tomHigh', 'tomLow'];
  } else {
    // 61+ Full Kit including Ride
    return [
      'kick',
      'snare',
      'hihatClosed',
      'hihatOpen',
      'crash',
      'ride',
      'tomHigh',
      'tomLow',
      'tomFloor',
    ];
  }
}

// Lesson titles and technical tips database for realistic drumming coaching
interface LessonTemplate {
  title: string;
  focus: string;
  praise: string;
  tip: string;
}

const BEGINNER_LESSONS: LessonTemplate[] = [
  {
    title: '第一歩！バスドラムの鼓動',
    focus: '足だけで小節頭の4分音符を踏む練習',
    praise: '素晴らしい！ドラムの命であるバスドラムの第一歩を踏み出したね🐰',
    tip: '【プロのコツ】バスドラムを踏む時は、かかとを軽く浮かせて足全体の重みでペダルを落とす（ヒールアップ奏法）と、ブレない重厚な低音が出ます！',
  },
  {
    title: '一定のパルスを刻む',
    focus: 'メトロノームと完全に同期する4分キック',
    praise: '一定のテンポで刻めてる！すごく安定感があるよ！',
    tip: '【プロのコツ】ペダルのビーター（打面を叩くヘッド）を叩いた後、押し付けたままにするか離すかで音の余韻が変わります。まずは押し付けずに開放するオープンブローを意識してみてね。',
  },
  {
    title: '裏拍を恐れないキック',
    focus: '小節頭と3拍目のキック',
    praise: 'リズムの重心がしっかり定まってきたよ🥕',
    tip: '【プロのコツ】足に力が入りすぎるとすねの筋肉が疲れてしまいます。太ももの付け根からリラックスして落とす感覚を掴みましょう。',
  },
  {
    title: 'スネア解禁！2ビートの誕生',
    focus: 'キック（1拍）とスネア（2拍）の交互連動',
    praise: 'スネア解禁おめでとう！手足の分離、上手にできてるよ！',
    tip: '【プロのコツ】スネアを叩く左手は、手首のスナップをしなやかに使って打面の中心（スイートスポット）を落とすように叩くと、最も太い音が響きます。',
  },
  {
    title: 'バックビート（2拍・4拍）の確立',
    focus: '王道のドン・パッ・ドン・パッのリズム',
    praise: 'これぞロック＆ポップスの基本！体が自然と揺れてくるね🐰',
    tip: '【プロのコツ】スネアのバックビート（2拍目・4拍目）の音量が揃うと、バンド全体のグルーヴが一気に引き締まります。打点の高さを一定に保ちましょう！',
  },
  {
    title: 'キック連打とスネアの独立',
    focus: 'ドン・ドン・パッのキックダブルの導入',
    praise: '足が2連打になっても手が釣られずに叩けたね！すごい！',
    tip: '【プロのコツ】キックの2連打は、1打目を軽く、2打目をしっかり踏み込む（スライド奏法やスイベル奏法）と、足が疲れず速い連打もラクになります。',
  },
  {
    title: '初級2ビート・マスター認定',
    focus: 'キックとスネアだけで曲を最後まで支え切る',
    praise: '完璧なグルーヴ！二つの太鼓だけで立派に音楽をリードできてるよ！',
    tip: '【プロのコツ】テンポが速くなっても慌てず、自分の心拍数を落ち着かせてビートの中心に居続ける意識を持ちましょう。',
  },
  {
    title: 'ハイハット解禁！王道8ビート',
    focus: '右手ハイハット8分音符キープと手足3連動',
    praise: 'ハイハット解禁！これでドラムセットの基本3点が勢揃いしたね🐰✨',
    tip: '【プロのコツ】ハイハットを叩く右手とスネアの左手が重なる瞬間、2つの音がミリ秒単位でピッタリ同時に落ちるように集中すると、プロのような『タイトなビート』になります！',
  },
  {
    title: 'ハイハットのダウン＆アップ',
    focus: '強弱（アクセント）をつけてビートに命を吹き込む',
    praise: 'リズムに表情がついてきた！すごく人間味のあるいい音だよ！',
    tip: '【プロのコツ】ハイハットは表拍でスティックのショルダー（腹）をエッジに当て、裏拍でチップ（先端）で表面を叩く（アップダウン奏法）と、疲れずに自然なグルーヴが生まれます。',
  },
  {
    title: '疾走する8ビート・チェイス',
    focus: 'アップテンポでの8ビート安定キープ',
    praise: '速いテンポでも崩れずに走り切れたね！素晴らしい集中力！',
    tip: '【プロのコツ】テンポが速い時はスティックを振る振幅（ストローク）を小さくし、最小限の動きで効率よく叩くのがスタミナ温存の秘訣です。',
  },
  {
    title: 'シンコペーション・キック',
    focus: 'ウラ拍に飛び込むスリリングなバスドラム',
    praise: 'ウラ拍のキックがバチッと決まった！鳥肌が立ったよ🐰🔥',
    tip: '【プロのコツ】食い込むキック（シンコペーション）を踏む時も、右手のハイハットは平然と同じリズムをキープするのがポイント。右手というメトロノームに身を預けよう！',
  },
  {
    title: '8ビート完成度チェック',
    focus: 'ブレないタイム感とダイナミクスの統合',
    praise: 'もう立派な8ビートドラマーだよ！誇っていい腕前だね🥕',
    tip: '【プロのコツ】自分の叩く音だけでなく、曲のベースラインやメロディを聴きながら叩くと、バンドアンサンブルが一段と溶け合います。',
  },
  {
    title: 'クラッシュ解禁！展開の合図',
    focus: '小節頭でクラッシュシンバルとキックを同時に打つ',
    praise: 'クラッシュ解禁！パーンと爽快なアクセントが決まったね🎉',
    tip: '【プロのコツ】クラッシュシンバルを叩く時は、シンバル面に対して垂直に叩きつけず、斜めになでるように振り抜く（グランスストローク）と、割れを防ぎ美しく長いサステイン（余韻）が得られます！',
  },
  {
    title: 'クラッシュ直後のハイハット復帰',
    focus: '右手の素早いポジション移動',
    praise: 'クラッシュの後に慌てずハイハットに戻れたね！フォームが綺麗！',
    tip: '【プロのコツ】クラッシュを叩いた反動のリバウンドを利用して、右手をハイハットの上空へ滑らかに戻す軌道をイメージしましょう。',
  },
  {
    title: 'サビ前のビルドアップ・アクセント',
    focus: 'セクション切り替えのクラッシュ連打',
    praise: '曲の盛り上がりが最高潮に伝わってきたよ！迫力満点！',
    tip: '【プロのコツ】シンバルを強く鳴らしたい時ほど、肩や腕の力を抜き、スティック先端のヘッドスピードを上げる意識を持ちましょう。',
  },
  {
    title: 'クラッシュの左右鳴らし分け',
    focus: 'アクセントの強弱とタイミング',
    praise: 'ダイナミックなシンバルワーク！ダイナミクスが効いてるね🐰',
    tip: '【プロのコツ】クラッシュは必ずバスドラム（足）と同時にヒットさせることで、低音と高音が同時に鳴り響き、重厚な音圧を生み出します。',
  },
  {
    title: 'フロアタム解禁！重低音フィル',
    focus: '右手でフロアタムを連打する基礎フィルイン',
    praise: 'フロアタム解禁！ドスドスと力強い重低音、かっこいいよ！',
    tip: '【プロのコツ】フロアタムは大口径（16インチ）でヘッドが緩めなため、スネアよりもスティックの跳ね返り（リバウンド）が弱いです。手首を柔らかく使って押し込まずに鳴らしましょう。',
  },
  {
    title: 'スネアからフロアタムへの移動',
    focus: '2拍フィルイン（タタ・ドンドン）',
    praise: '移動がすごくスムーズ！スティックが引っかからず打ててるね！',
    tip: '【プロのコツ】太鼓間の移動は、前の打面を叩いて跳ね上がった頂点で次の太鼓へ水平移動すると、無駄な動きがゼロになります。',
  },
  {
    title: '8ビート＋フロアタム・フィル',
    focus: '4小節ごとのパターンとフィルの連結',
    praise: 'ビートからフィルへの移行が流れるようだったよ！完璧！',
    tip: '【プロのコツ】フィルインの最後の1拍を叩く直前に、心の中で次の小節頭のクラッシュとキックを狙い定める（先読みする）と、拍がもたりません。',
  },
  {
    title: '初級卒業検定！ベーシック・マスター',
    focus: 'キック・スネア・ハット・クラッシュ・フロアタムの完全調和',
    praise: '初級コース全20レベル完全制覇おめでとう！君はもう本物のドラマーの仲間入りだよ🐰🎉',
    tip: '【ラビ先生からの卒業メッセージ】ドラムの基本は手足の脱力と耳を澄ますこと。基礎がしっかり身についた君なら、中級のタム回しや16ビートも絶対に楽しめるよ！胸を張って次のステージへ進もう！',
  },
];

const INTERMEDIATE_LESSONS: LessonTemplate[] = [
  {
    title: 'ハイタム＆ロータム解禁！',
    focus: '高低2つのタムを使ったメロディックなフィルイン',
    praise: '中級へようこそ！タム回しが入ると一気にドラムセットらしくなるだろ？🦊',
    tip: '【プロのコツ】ハイタム（高）→ロータム（中）→フロアタム（低）と音程が下がっていくフィルは、スティックの高さを揃えて打面の中心を射抜くのが音粒を揃えるコツだぜ！',
  },
  {
    title: '流れるタムロール（滝下り）',
    focus: 'スネア→ハイタム→ロータム→フロアの4連コンボ',
    praise: 'スピーディーなタム回し！音が綺麗につながって聞こえたぜ！',
    tip: '【プロのコツ】腕を振り回すんじゃなく、肘をリラックスさせて両手のオルタネイト（右左・右左）の自然なバウンドに身を任せろ！',
  },
  {
    title: 'タムを組み込んだ変則ビート',
    focus: 'フロアタムをハイハット代わりに刻むジャングルビート',
    praise: '野性的でめちゃくちゃグルーヴィー！フロアが揺れてたぜ🦊🔥',
    tip: '【プロのコツ】フロアタムでビートを刻む時は、打つ位置をエッジ寄りにするとアタックが強調され、リズムの輪郭がハッキリするぞ。',
  },
  {
    title: 'オープンハイハット解禁！',
    focus: 'ペダルを緩めて「チーッ」と鳴らすオープンハット',
    praise: 'ハイハットオープン解禁！音の広がりが一段上がったな！',
    tip: '【プロのコツ】オープンハットは思いっきり開けるんじゃなく、2枚のシンバルがわずかに触れ合う隙間（シズル感）を作るのがプロの抜けの良い音の秘密だ。',
  },
  {
    title: '裏拍オープン＆即クローズ',
    focus: 'ダンピング（音を瞬時に止める）のタイトなキレ',
    praise: 'チッ・ツッのキレが抜群！最高にファンキーだったぜ🦊✨',
    tip: '【プロのコツ】次の拍の頭でハイハットを閉じる時、左足を踏み込むタイミングをスネアと完璧にシンクロさせると、極上のタイトさが生まれるぜ！',
  },
  {
    title: '16ビート入門・ファンクの鼓動',
    focus: '細かい16分音符のグルーヴとゴーストノート',
    praise: '細かな音粒がしっかり揃ってて気持ちいい！体が勝手に動くぜ！',
    tip: '【プロのコツ】16ビートではアクセント（強音）とゴーストノート（弱音）の差をハッキリつけろ。小さな音を恐れずに小さく叩くのが大人なドラムだ！',
  },
  {
    title: 'シャッフル＆スウィング・バウンス',
    focus: '跳ねるハネ系ビート（3連符のノリ）',
    praise: '心地よいバウンス感！重たすぎず軽やかな最高のノリだ！',
    tip: '【プロのコツ】ハネるリズムは、心の中で「チッ・タ・チッ・タ」と3連符の真ん中を抜いたグリッドを感じながら叩くとうねりが出るぞ。',
  },
  {
    title: '中級卒業検定！グルーヴ・マスター',
    focus: '16ビート・タムフィル・オープンハットの完全掌握',
    praise: '中級コース完全制覇！お前のドラムはもうプロ顔負けのグルーヴを放ってるぜ🦊🏆',
    tip: '【フォクス先輩からの熱いメッセージ】お前のビートにはパッションと正確さが同居してる！次はレオ師匠の待つ上級コースだ。ライドシンバルと変拍子の深淵へ、自信を持って飛び込んでこいよ！',
  },
];

const ADVANCED_LESSONS: LessonTemplate[] = [
  {
    title: 'ライドシンバル解禁！大人の響き',
    focus: 'レガート（チン・チッキ・チン）とボウの繊細な響き',
    praise: '上級へようこそ！ライドシンバルの倍音がホールいっぱいに響き渡ったぞ🦁',
    tip: '【師匠の極意】ライドシンバルはスティックのチップ（先端の球）を水平に落とし、真鍮のきらびやかな倍音を歌わせるのじゃ。力を抜けば抜くほど、音は遠くまで届く。',
  },
  {
    title: 'カップ（ベル）の鋭いアクセント',
    focus: 'ライド中央の突起（ベル）をショルダーで射抜く',
    praise: 'カーン！と抜けの良いカップショット！見事な芯の捉え方じゃ！',
    tip: '【師匠の極意】カップを叩く際はスティックの太いショルダー部分を用い、的確な角度で打ち込む。ボウの優しい囁きとカップの強烈なアクセント、その二面性を操るのじゃ。',
  },
  {
    title: '5/4拍子のプログレッシブ・ドライブ',
    focus: '3+2で分割する変拍子のスリル',
    praise: '見事！5拍のうねりを完全に我が物にしておるな🦁⚡',
    tip: '【師匠の極意】変拍子は小節を『3拍と2拍』に心の中で割って捉えること。決して拍を数えて叩くのではなく、一つの大きな循環として呼吸するのじゃ。',
  },
  {
    title: '7/8拍子の高速バトルビート',
    focus: '2+2+3の変拍子リフと手足の連動',
    praise: '疾風怒濤の7拍子！一拍の狂いもなく突き抜けたぞ！',
    tip: '【師匠の極意】速い7拍子では重心を低く保ち、最後の3拍（タタタ）の跳躍を軽やかにこなすのじゃ。体が拍に引っ張られぬよう体幹を固めよ。',
  },
  {
    title: 'ポリリズム・二重の時間の交錯',
    focus: '3対2、4対3の複合リズムの統合',
    praise: '神技！手と足が別の時間を刻みながら、見事な調和を奏でておる！',
    tip: '【師匠の極意】ポリリズムは『右手と左手の対話』じゃ。どちらか一方を主役にせず、両者が重なり合う接点（ポリリズムの公倍数）を全身で感じ取るのじゃ。',
  },
  {
    title: 'パラディドル＆超高速リニアドラミング',
    focus: 'RLRR LRLLのコンビネーションと手足の隙間縫い',
    praise: '圧倒的なテクニックと美学！これぞドラマーの極致じゃ！',
    tip: '【師匠の極意】リニア（どの音も同時に鳴らさず一本の線のように叩く奏法）では、音と音の『隙間』に宿る美を感じよ。一打の価値が無限に研ぎ澄まされる。',
  },
  {
    title: '究極試練！レジェンド・ドラムマスター',
    focus: '9つのパーツ全てを駆使した究極のセッション',
    praise: 'アッパレ！我がドラム道の全てを受け継いだ真のレジェンドよ！感動したぞ🦁👑🎉',
    tip: '【レオ師匠からの免許皆伝】リズムとは命そのもの。叩き手が変われば世界が変わる。汝のドラムは多くの人々の心を揺さぶり、希望を灯す力を持っておる。生涯ドラムを愛し、誇り高くビートを刻み続けよ！',
  },
];

// Generate all 100 level configurations
export function generateAllRPGLevels(): RPGLevelConfig[] {
  const levels: RPGLevelConfig[] = [];

  for (let i = 1; i <= 100; i++) {
    const tier = getTierForLevel(i);
    const unlockedParts = getUnlockedPartsForLevel(i);

    // Pick an appropriate song from catalog
    const songIndex = (i - 1) % SONGS.length;
    const targetSong = SONGS[songIndex];

    let difficulty: Difficulty = 'easy';
    if (tier === 'intermediate') {
      difficulty = i > 40 ? 'hard' : 'normal';
    } else if (tier === 'advanced') {
      difficulty = i > 80 ? 'master' : 'hard';
    }

    // Determine advice template
    let template: LessonTemplate;
    if (tier === 'beginner') {
      template = BEGINNER_LESSONS[Math.min(i - 1, BEGINNER_LESSONS.length - 1)];
    } else if (tier === 'intermediate') {
      const idx = Math.floor(((i - 21) / 40) * INTERMEDIATE_LESSONS.length);
      template = INTERMEDIATE_LESSONS[Math.min(idx, INTERMEDIATE_LESSONS.length - 1)];
    } else {
      const idx = Math.floor(((i - 61) / 40) * ADVANCED_LESSONS.length);
      template = ADVANCED_LESSONS[Math.min(idx, ADVANCED_LESSONS.length - 1)];
    }

    // BPM scaling: Level 1 starts at 60 BPM, progressively increases
    let bpm = 60;
    if (i === 1) {
      bpm = 60;
    } else if (i === 2) {
      bpm = 63;
    } else if (i === 3) {
      bpm = 66;
    } else if (i === 4) {
      bpm = 70;
    } else if (i === 5) {
      bpm = 74;
    } else if (i <= 20) {
      // 78 to 120 at Lv.20
      bpm = 74 + Math.round(((i - 5) / 15) * 46);
    } else if (i <= 60) {
      // 120 to 155 at Lv.60
      bpm = 120 + Math.round(((i - 21) / 39) * 35);
    } else {
      // 155 to 200 at Lv.100
      bpm = 155 + Math.round(((i - 61) / 39) * 45);
    }

    // Visual approach glow preview seconds: Level 1 starts at 1.5s, progressively tightens
    let previewSeconds = 1.50;
    if (i === 1) {
      previewSeconds = 1.50;
    } else if (i === 2) {
      previewSeconds = 1.40;
    } else if (i === 3) {
      previewSeconds = 1.30;
    } else if (i === 4) {
      previewSeconds = 1.20;
    } else if (i === 5) {
      previewSeconds = 1.10;
    } else if (i <= 20) {
      // 1.10s down to 0.65s
      previewSeconds = Number((1.10 - ((i - 5) / 15) * 0.45).toFixed(2));
    } else if (i <= 60) {
      // 0.62s down to 0.45s
      previewSeconds = Number((0.62 - ((i - 21) / 39) * 0.17).toFixed(2));
    } else {
      // 0.44s down to 0.30s
      previewSeconds = Number((0.44 - ((i - 61) / 39) * 0.14).toFixed(2));
    }

    // Minimum clear score: Level 1 is 1000 so anyone clears it on first try!
    let minScore = 1000;
    if (i === 1) {
      minScore = 1000;
    } else if (i === 2) {
      minScore = 1500;
    } else if (i === 3) {
      minScore = 2000;
    } else if (i === 4) {
      minScore = 2800;
    } else if (i === 5) {
      minScore = 3500;
    } else if (i <= 20) {
      minScore = 3500 + (i - 5) * 950;
    } else if (i <= 60) {
      minScore = 18000 + (i - 20) * 800;
    } else {
      minScore = 50000 + (i - 60) * 900;
    }

    levels.push({
      level: i,
      tier,
      title: `Lv.${i} ${template.title}`,
      focusLesson: template.focus,
      unlockedParts,
      targetSongId: targetSong.id,
      difficulty,
      clearMinScore: minScore,
      bpm,
      previewSeconds,
      coachAdvice: {
        praise: template.praise,
        technicalTip: template.tip,
      },
    });
  }

  return levels;
}

export const ALL_RPG_LEVELS: RPGLevelConfig[] = generateAllRPGLevels();

export function getRPGLevelConfig(level: number): RPGLevelConfig {
  const safeLevel = Math.max(1, Math.min(100, level));
  return ALL_RPG_LEVELS[safeLevel - 1];
}

// Generate tailored rhythmic training notes for RPG levels
export function generateRPGLevelNotes(
  level: number,
  config: RPGLevelConfig,
  targetSong: SongData
): RhythmNote[] {
  const bpm = config.bpm;
  const beatSec = 60 / bpm;
  const measureSec = beatSec * 4;
  const leadIn = Math.max(3.0, config.previewSeconds * 1.5);

  if (level === 1) {
    // Level 1: BPM 60, Preview 1.5s, 100% accessible first-try clear
    // Half-notes / beats 1 and 3 in 60BPM (spaced 2.0s apart)
    const notes: RhythmNote[] = [];
    const timestamps = [
      leadIn,
      leadIn + 2.0,
      leadIn + 4.0,
      leadIn + 6.0,
      leadIn + 8.0,
      leadIn + 10.0,
      leadIn + 12.0,
      leadIn + 14.0,
      leadIn + 16.0,
      leadIn + 18.0,
      leadIn + 20.0,
      leadIn + 22.0,
    ];
    timestamps.forEach((t, idx) => {
      notes.push({
        id: `rpg-1-${idx}`,
        time: Number(t.toFixed(3)),
        part: 'kick',
        type: 'tap',
      });
    });
    return notes;
  }

  if (level === 2) {
    // Level 2: BPM 63, regular pulses on beats 1 and 3
    const notes: RhythmNote[] = [];
    for (let m = 0; m < 8; m++) {
      const base = leadIn + m * measureSec;
      notes.push({ id: `rpg-2-${m}-1`, time: Number(base.toFixed(3)), part: 'kick', type: 'tap' });
      notes.push({ id: `rpg-2-${m}-3`, time: Number((base + beatSec * 2).toFixed(3)), part: 'kick', type: 'tap' });
    }
    return notes;
  }

  if (level === 3) {
    // Level 3: BPM 66, beats 1, 2, 3
    const notes: RhythmNote[] = [];
    for (let m = 0; m < 8; m++) {
      const base = leadIn + m * measureSec;
      notes.push({ id: `rpg-3-${m}-1`, time: Number(base.toFixed(3)), part: 'kick', type: 'tap' });
      notes.push({ id: `rpg-3-${m}-2`, time: Number((base + beatSec).toFixed(3)), part: 'kick', type: 'tap' });
      notes.push({ id: `rpg-3-${m}-3`, time: Number((base + beatSec * 2).toFixed(3)), part: 'kick', type: 'tap' });
    }
    return notes;
  }

  if (level <= 6) {
    // Level 4..6: Kick & Snare standard beat
    const notes: RhythmNote[] = [];
    for (let m = 0; m < 8; m++) {
      const base = leadIn + m * measureSec;
      notes.push({ id: `rpg-${level}-${m}-k1`, time: Number(base.toFixed(3)), part: 'kick', type: 'tap' });
      notes.push({ id: `rpg-${level}-${m}-s2`, time: Number((base + beatSec).toFixed(3)), part: 'snare', type: 'tap' });
      notes.push({ id: `rpg-${level}-${m}-k3`, time: Number((base + beatSec * 2).toFixed(3)), part: 'kick', type: 'tap' });
      notes.push({ id: `rpg-${level}-${m}-s4`, time: Number((base + beatSec * 3).toFixed(3)), part: 'snare', type: 'tap' });
    }
    return notes;
  }

  if (level <= 11) {
    // Level 7..11: Kick, Snare, Hihat Closed 8-beat
    const notes: RhythmNote[] = [];
    for (let m = 0; m < 8; m++) {
      const base = leadIn + m * measureSec;
      for (let b = 0; b < 8; b++) {
        notes.push({
          id: `rpg-${level}-${m}-hh-${b}`,
          time: Number((base + (b * beatSec) / 2).toFixed(3)),
          part: 'hihatClosed',
          type: 'tap',
        });
      }
      notes.push({ id: `rpg-${level}-${m}-k1`, time: Number(base.toFixed(3)), part: 'kick', type: 'tap' });
      notes.push({ id: `rpg-${level}-${m}-k3`, time: Number((base + beatSec * 2).toFixed(3)), part: 'kick', type: 'tap' });
      notes.push({ id: `rpg-${level}-${m}-s2`, time: Number((base + beatSec).toFixed(3)), part: 'snare', type: 'tap' });
      notes.push({ id: `rpg-${level}-${m}-s4`, time: Number((base + beatSec * 3).toFixed(3)), part: 'snare', type: 'tap' });
    }
    return notes;
  }

  if (level <= 15) {
    // Level 12..15: 8-beat with Crash accents
    const notes: RhythmNote[] = [];
    for (let m = 0; m < 8; m++) {
      const base = leadIn + m * measureSec;
      if (m % 2 === 0) {
        notes.push({ id: `rpg-${level}-${m}-cr`, time: Number(base.toFixed(3)), part: 'crash', type: 'tap' });
      }
      for (let b = 0; b < 8; b++) {
        if (!(m % 2 === 0 && b === 0)) {
          notes.push({
            id: `rpg-${level}-${m}-hh-${b}`,
            time: Number((base + (b * beatSec) / 2).toFixed(3)),
            part: 'hihatClosed',
            type: 'tap',
          });
        }
      }
      notes.push({ id: `rpg-${level}-${m}-k1`, time: Number(base.toFixed(3)), part: 'kick', type: 'tap' });
      notes.push({ id: `rpg-${level}-${m}-k3`, time: Number((base + beatSec * 2).toFixed(3)), part: 'kick', type: 'tap' });
      notes.push({ id: `rpg-${level}-${m}-s2`, time: Number((base + beatSec).toFixed(3)), part: 'snare', type: 'tap' });
      notes.push({ id: `rpg-${level}-${m}-s4`, time: Number((base + beatSec * 3).toFixed(3)), part: 'snare', type: 'tap' });
    }
    return notes;
  }

  // Level 16+: Adapt song notes, adjust tempo by time-scaling factor, and filter by unlocked parts
  const rawNotes = targetSong.difficulties[config.difficulty]?.notes || targetSong.difficulties['easy'].notes;
  const scale = targetSong.bpm / config.bpm;
  const filtered = rawNotes
    .filter((n) => config.unlockedParts.includes(n.part))
    .map((n, idx) => ({
      ...n,
      id: `rpg-${level}-${idx}-${n.part}`,
      time: Number((leadIn + (n.time * scale)).toFixed(3)),
    }));

  if (filtered.length >= 8) {
    return filtered;
  }

  // Fallback if needed
  const fallbackNotes: RhythmNote[] = [];
  for (let m = 0; m < 8; m++) {
    const base = leadIn + m * measureSec;
    fallbackNotes.push({ id: `rpg-fb-${level}-${m}-k1`, time: Number(base.toFixed(3)), part: 'kick', type: 'tap' });
    fallbackNotes.push({ id: `rpg-fb-${level}-${m}-s2`, time: Number((base + beatSec).toFixed(3)), part: 'snare', type: 'tap' });
  }
  return fallbackNotes;
}

// Local storage helper for RPG Progress
const RPG_PROGRESS_KEY = 'pokopoko_rpg_progress_v1';

export function loadRPGProgress(): RPGProgress {
  try {
    const raw = localStorage.getItem(RPG_PROGRESS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.currentLevel === 'number') {
        return {
          currentLevel: parsed.currentLevel,
          highestClearedLevel: typeof parsed.highestClearedLevel === 'number' ? parsed.highestClearedLevel : 0,
          clearedLevels: parsed.clearedLevels && typeof parsed.clearedLevels === 'object' ? parsed.clearedLevels : {},
          activeTier: parsed.activeTier || 'beginner',
        };
      }
    }
  } catch {}

  // Default starting progress: Level 1 in Beginner tier
  return {
    currentLevel: 1,
    highestClearedLevel: 0,
    clearedLevels: {},
    activeTier: 'beginner',
  };
}

export function saveRPGProgress(progress: RPGProgress): void {
  try {
    localStorage.setItem(RPG_PROGRESS_KEY, JSON.stringify(progress));
  } catch {}
}

export function recordLevelClear(
  level: number,
  score: number,
  rank: string,
  accuracy: number
): RPGProgress {
  const current = loadRPGProgress();

  const newCleared = {
    ...current.clearedLevels,
    [level]: {
      score,
      rank,
      accuracy,
      timestamp: Date.now(),
    },
  };

  const newHighest = Math.max(current.highestClearedLevel, level);
  // User level becomes the cleared level, or next level if they cleared their current
  const newLevel = Math.max(current.currentLevel, level + 1 <= 100 ? level + 1 : 100);

  const updated: RPGProgress = {
    ...current,
    currentLevel: newLevel,
    highestClearedLevel: newHighest,
    clearedLevels: newCleared,
  };

  saveRPGProgress(updated);
  return updated;
}
