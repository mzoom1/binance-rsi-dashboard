/**
 * Глобальний секрет для /api/prewarm.
 * Забираємо із змінної оточення SECRET.
 */
export const SECRET = process.env.SECRET as string | undefined;
