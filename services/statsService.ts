import { db } from '@/config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type GameId = 'quiz' | 'listening' | 'spelling' | 'memory' | 'scramble';

export type UserStats = {
  gamesPlayed: number;
  totalCorrect: number;
  totalQuestions: number;
  bestStreak: number;        // mejor racha de aciertos seguidos
  dayStreak: number;         // días consecutivos jugando
  lastPlayedDate: string | null; // 'YYYY-MM-DD'
  xp: number;
};

export type GameResult = {
  correct: number;
  total: number;
  bestStreak?: number; // racha máxima de aciertos seguidos en la partida
};

const DEFAULT_STATS: UserStats = {
  gamesPlayed: 0,
  totalCorrect: 0,
  totalQuestions: 0,
  bestStreak: 0,
  dayStreak: 0,
  lastPlayedDate: null,
  xp: 0,
};

// Fecha local en formato YYYY-MM-DD (evita problemas de zona horaria)
function localDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysBetween(fromISO: string, toISO: string): number {
  const from = new Date(`${fromISO}T00:00:00`);
  const to = new Date(`${toISO}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const snapshot = await getDoc(userDocRef);
    const data = snapshot.exists() ? snapshot.data() : null;
    const stats = (data?.stats ?? {}) as Partial<UserStats>;
    return { ...DEFAULT_STATS, ...stats };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return { ...DEFAULT_STATS };
  }
}

// Guarda el resultado de una partida y actualiza la racha diaria.
// Devuelve las estadísticas actualizadas y cuánto XP se ha ganado.
export async function saveGameResult(
  userId: string,
  result: GameResult
): Promise<{ stats: UserStats; xpEarned: number }> {
  const current = await getUserStats(userId);
  const today = localDateString();

  // Racha diaria
  let dayStreak = current.dayStreak;
  if (current.lastPlayedDate === today) {
    dayStreak = current.dayStreak || 1; // ya jugó hoy, se mantiene
  } else if (current.lastPlayedDate && daysBetween(current.lastPlayedDate, today) === 1) {
    dayStreak = (current.dayStreak || 0) + 1; // día consecutivo
  } else {
    dayStreak = 1; // primer día o racha rota
  }

  // XP: 10 por acierto + bonus por partida completada
  const xpEarned = result.correct * 10 + 5;

  const updated: UserStats = {
    gamesPlayed: current.gamesPlayed + 1,
    totalCorrect: current.totalCorrect + result.correct,
    totalQuestions: current.totalQuestions + result.total,
    bestStreak: Math.max(current.bestStreak, result.bestStreak ?? 0),
    dayStreak,
    lastPlayedDate: today,
    xp: current.xp + xpEarned,
  };

  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, { stats: updated }, { merge: true });
  } catch (error) {
    console.error('Error guardando resultado de partida:', error);
  }

  return { stats: updated, xpEarned };
}

// Nivel calculado a partir del XP (100 XP por nivel, creciente)
export function levelFromXp(xp: number): { level: number; current: number; needed: number } {
  let level = 1;
  let remaining = xp;
  let needed = 100;
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = 100 + (level - 1) * 25;
  }
  return { level, current: remaining, needed };
}
