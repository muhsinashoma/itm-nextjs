// frontend/lib/text-sanitize.ts
//
// Global display sanitizer for legacy mojibake.
//
// Goals:
// - preserve normal Unicode text, including Bangla;
// - repair common repeated Windows-1252/UTF-8 mojibake when possible;
// - if a legacy fragment cannot be repaired, remove only the corrupted fragment;
// - keep readable ASCII data such as model names and dates.

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const MOJIBAKE_MARKER = /[ÃÂâÆƒ�]/u;

const CP1252_EXTRA_TO_BYTE = new Map<number, number>([
    [0x20ac, 0x80],
    [0x201a, 0x82],
    [0x0192, 0x83],
    [0x201e, 0x84],
    [0x2026, 0x85],
    [0x2020, 0x86],
    [0x2021, 0x87],
    [0x02c6, 0x88],
    [0x2030, 0x89],
    [0x0160, 0x8a],
    [0x2039, 0x8b],
    [0x0152, 0x8c],
    [0x017d, 0x8e],
    [0x2018, 0x91],
    [0x2019, 0x92],
    [0x201c, 0x93],
    [0x201d, 0x94],
    [0x2022, 0x95],
    [0x2013, 0x96],
    [0x2014, 0x97],
    [0x02dc, 0x98],
    [0x2122, 0x99],
    [0x0161, 0x9a],
    [0x203a, 0x9b],
    [0x0153, 0x9c],
    [0x017e, 0x9e],
    [0x0178, 0x9f],
]);

function corruptionScore(value: string): number {
    let score = 0;

    for (const character of value) {
        if (MOJIBAKE_MARKER.test(character)) {
            score += 1;
        }
    }

    const knownSequences = [
        "Ãƒ",
        "Ã‚",
        "Ã¢",
        "â€",
        "â‚",
        "â„",
        "ï¿½",
    ];

    for (const sequence of knownSequences) {
        let offset = 0;

        while ((offset = value.indexOf(sequence, offset)) >= 0) {
            score += 2;
            offset += sequence.length;
        }
    }

    return score;
}

function toLegacyBytes(value: string): Uint8Array | null {
    const bytes: number[] = [];

    for (const character of value) {
        const codePoint = character.codePointAt(0);

        if (codePoint === undefined) {
            return null;
        }

        if (codePoint <= 0xff) {
            bytes.push(codePoint);
            continue;
        }

        const mapped = CP1252_EXTRA_TO_BYTE.get(codePoint);

        if (mapped === undefined) {
            return null;
        }

        bytes.push(mapped);
    }

    return Uint8Array.from(bytes);
}

function decodeOneLayer(value: string): string | null {
    const bytes = toLegacyBytes(value);

    if (!bytes) {
        return null;
    }

    try {
        return new TextDecoder("utf-8", {
            fatal: true,
        }).decode(bytes);
    } catch {
        return null;
    }
}

function repairRepeatedEncoding(value: string): string {
    let current = value;

    for (let attempt = 0; attempt < 8; attempt += 1) {
        const beforeScore = corruptionScore(current);

        if (beforeScore === 0) {
            break;
        }

        const decoded = decodeOneLayer(current);

        if (!decoded || decoded === current) {
            break;
        }

        const afterScore = corruptionScore(decoded);

        if (afterScore >= beforeScore) {
            break;
        }

        current = decoded;
    }

    return current;
}

function stripUnrepairableFragments(value: string): string {
    // Keep recognizable dates even when a corrupted prefix/suffix was saved
    // into the same database field.
    const dateMatches =
        value.match(
            /\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/g,
        ) ?? [];

    const isoDateMatches =
        value.match(
            /\b\d{4}-\d{2}-\d{2}\b/g,
        ) ?? [];

    const safeTokens = value
        .split(/\s+/)
        .filter(Boolean)
        .filter((token) => !MOJIBAKE_MARKER.test(token))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

    if (safeTokens) {
        return safeTokens;
    }

    const recoveredDate =
        [...dateMatches, ...isoDateMatches]
            .join(" ")
            .trim();

    return recoveredDate;
}

export function cleanDisplayText(value: string): string {
    if (!value) {
        return value;
    }

    const normalized = value
        .replace(CONTROL_CHARS, "")
        .replace(/\uFFFD/g, "")
        .trim();

    if (!normalized) {
        return "";
    }

    if (!MOJIBAKE_MARKER.test(normalized)) {
        return normalized;
    }

    const repaired = repairRepeatedEncoding(normalized);

    if (!MOJIBAKE_MARKER.test(repaired)) {
        return repaired
            .replace(/\s+/g, " ")
            .trim();
    }

    return stripUnrepairableFragments(repaired);
}

export function sanitizeApiPayload<T>(value: T): T {
    if (typeof value === "string") {
        return cleanDisplayText(value) as T;
    }

    if (Array.isArray(value)) {
        return value.map((item) => sanitizeApiPayload(item)) as T;
    }

    if (value && typeof value === "object") {
        const output: Record<string, unknown> = {};

        for (const [key, item] of Object.entries(
            value as Record<string, unknown>,
        )) {
            output[key] = sanitizeApiPayload(item);
        }

        return output as T;
    }

    return value;
}
