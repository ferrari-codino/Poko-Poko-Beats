import { SongData, SongCategory } from '../types';
import { CATALOG_A } from './songCatalogA';
import { CATALOG_B } from './songCatalogB';
export { generateChart, createSong } from './chartGenerator';

export const SONG_CATEGORIES: ('ALL' | SongCategory)[] = [
  'ALL',
  'J-POP',
  'アニメ・ゲーム',
  'EDM・クラブ',
  'ロック',
  'ジャズ・ファンク',
  'クラシック・変拍子',
  '和風・伝統',
  'ワールド・キッズ',
];

export const SONGS: SongData[] = [...CATALOG_A, ...CATALOG_B];

// Quick lookup map by id
export const SONG_MAP: Record<string, SongData> = SONGS.reduce((acc, song) => {
  acc[song.id] = song;
  return acc;
}, {} as Record<string, SongData>);
