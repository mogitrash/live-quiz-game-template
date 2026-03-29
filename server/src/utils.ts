export function isQuestionsValid(raw: unknown): boolean {
  if (!Array.isArray(raw) || raw.length === 0) {
    return false;
  }

  for (let i = 0; i < raw.length; i++) {
    const q = raw[i];
    if (!q || typeof q !== "object") {
      return false;
    }

    const o = q as Record<string, unknown>;

    if (typeof o.text !== "string") {
      return false;
    }

    const opts = o.options;
    if (!Array.isArray(opts) || opts.length !== 4) {
      return false;
    }

    const correctIndex = o.correctIndex;
    if (
      typeof correctIndex !== "number" ||
      !Number.isInteger(correctIndex) ||
      correctIndex < 0 ||
      correctIndex > 3
    ) {
      return false;
    }

    const timeLimitSec = o.timeLimitSec;
    if (typeof timeLimitSec !== "number" || !Number.isFinite(timeLimitSec) || timeLimitSec <= 0) {
      return false;
    }
  }

  return true;
}
