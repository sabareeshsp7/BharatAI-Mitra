import type {
  SupportedLanguage,
  TranslationResult,
  SpeechToTextResult,
  TextToSpeechResult,
} from "@/lib/ai/types";

// ─── Sarvam AI Client ─────────────────────────────────────────────────────────

const SARVAM_BASE_URL = process.env.SARVAM_BASE_URL || "https://api.sarvam.ai";
const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

if (!SARVAM_API_KEY) {
  console.warn("⚠️ SARVAM_API_KEY not set — Sarvam AI features will be disabled");
}

function sarvamHeaders(): HeadersInit {
  return {
    "api-subscription-key": SARVAM_API_KEY || "",
    "Content-Type": "application/json",
  };
}

// ─── Language Code Mapping (Sarvam uses BCP-47 codes) ────────────────────────

const SARVAM_LANG_MAP: Record<SupportedLanguage, string> = {
  en: "en-IN",
  hi: "hi-IN",
  ta: "ta-IN",
  te: "te-IN",
  mr: "mr-IN",
  bn: "bn-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  or: "od-IN",
  as: "as-IN",
};

function toSarvamCode(lang: string): string {
  return SARVAM_LANG_MAP[lang as SupportedLanguage] || "en-IN";
}

// ─── Retry Helper ─────────────────────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error("Max retries reached");
}

// ─── Language Detection ───────────────────────────────────────────────────────

/**
 * Detect the language of the given input text.
 * Returns a language code like "hi-IN" or "en-IN".
 */
export async function detectLanguage(text: string): Promise<string> {
  if (!SARVAM_API_KEY) return "en-IN";

  // Try translate with auto-detect via trying to translate to English;
  // if language is already en-IN, Sarvam returns it unchanged
  try {
    const response = await withRetry(() =>
      fetch(`${SARVAM_BASE_URL}/translate`, {
        method: "POST",
        headers: sarvamHeaders(),
        body: JSON.stringify({
          input: text.substring(0, 200),
          source_language_code: "auto",
          target_language_code: "en-IN",
          speaker_gender: "Female",
          mode: "formal",
          model: "mayura:v1",
          enable_preprocessing: false,
        }),
      })
    );

    if (!response.ok) return "en-IN";
    const data = await response.json();
    // Sarvam returns detected source in some responses
    return data.source_language_code || data.language_code || "en-IN";
  } catch {
    return "en-IN";
  }
}

// ─── Translation ──────────────────────────────────────────────────────────────

/**
 * Translate text between languages using Sarvam Mayura model.
 * Supports 22 Indian languages + English.
 */
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> {
  if (!SARVAM_API_KEY || sourceLang === targetLang) {
    return {
      translatedText: text,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      model: "sarvam-mayura",
    };
  }

  const response = await withRetry(() =>
    fetch(`${SARVAM_BASE_URL}/translate`, {
      method: "POST",
      headers: sarvamHeaders(),
      body: JSON.stringify({
        input: text,
        source_language_code: toSarvamCode(sourceLang),
        target_language_code: toSarvamCode(targetLang),
        speaker_gender: "Female",
        mode: "formal",
        model: "mayura:v1",
        enable_preprocessing: true,
      }),
    })
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Sarvam translate error:", response.status, error);
    // Fallback: return original text
    return {
      translatedText: text,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      model: "sarvam-mayura",
    };
  }

  const data = await response.json();
  return {
    translatedText: data.translated_text || text,
    sourceLanguage: sourceLang,
    targetLanguage: targetLang,
    model: "sarvam-mayura",
  };
}

// ─── Speech to Text ───────────────────────────────────────────────────────────

/**
 * Transcribe audio to text using Sarvam Saaras model.
 * Supports Indian accents and code-mixed speech.
 * @param audioBuffer - Raw audio buffer (WAV, MP3, etc.)
 * @param languageHint - Optional language hint
 */
export async function speechToText(
  audioBuffer: Buffer | ArrayBuffer,
  languageHint?: string
): Promise<SpeechToTextResult> {
  if (!SARVAM_API_KEY) {
    throw new Error("Sarvam API key not configured for speech-to-text");
  }

  const formData = new FormData();
  // Convert Buffer/ArrayBuffer to a fixed Uint8Array with a strict ArrayBuffer
  const audioArray = Buffer.isBuffer(audioBuffer)
    ? (new Uint8Array(audioBuffer)).buffer as ArrayBuffer
    : audioBuffer as ArrayBuffer;
  const blob = new Blob([audioArray], { type: "audio/wav" });
  formData.append("file", blob, "audio.wav");
  formData.append("model", "saaras:v2");
  if (languageHint) {
    formData.append("language_code", toSarvamCode(languageHint));
  }
  formData.append("with_timestamps", "false");
  formData.append("with_disfluencies", "false");

  const response = await withRetry(() =>
    fetch(`${SARVAM_BASE_URL}/speech-to-text`, {
      method: "POST",
      headers: {
        "api-subscription-key": SARVAM_API_KEY!,
        // Note: Don't set Content-Type for FormData, browser sets it with boundary
      },
      body: formData,
    })
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Sarvam STT error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return {
    transcript: data.transcript || "",
    detectedLanguage: data.language_code || languageHint || "en-IN",
    confidence: data.disfluencies ? undefined : 0.9,
  };
}

// ─── Text to Speech ───────────────────────────────────────────────────────────

/**
 * Convert text to natural-sounding Indian language speech using Sarvam Bulbul model.
 * Returns base64-encoded audio.
 */
export async function textToSpeech(
  text: string,
  language: SupportedLanguage = "hi",
  speaker: string = "meera"
): Promise<TextToSpeechResult> {
  if (!SARVAM_API_KEY) {
    throw new Error("Sarvam API key not configured for text-to-speech");
  }

  // Truncate text to 500 chars (Sarvam limit per request)
  const truncatedText = text.length > 500 ? text.substring(0, 497) + "..." : text;

  const response = await withRetry(() =>
    fetch(`${SARVAM_BASE_URL}/text-to-speech`, {
      method: "POST",
      headers: sarvamHeaders(),
      body: JSON.stringify({
        inputs: [truncatedText],
        target_language_code: toSarvamCode(language),
        speaker: speaker,
        pitch: 0,
        pace: 1.0,
        loudness: 1.5,
        speech_sample_rate: 22050,
        enable_preprocessing: true,
        model: "bulbul:v1",
      }),
    })
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Sarvam TTS error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return {
    audioBase64: data.audios?.[0] || "",
    mimeType: "audio/wav",
    language,
  };
}

// ─── Transliteration ──────────────────────────────────────────────────────────

/**
 * Convert text between scripts (e.g., Roman → Devanagari).
 */
export async function transliterate(
  text: string,
  sourceLanguageCode: string,
  targetLanguageCode: string,
  numeralsFormat: "native" | "western" = "western"
): Promise<string> {
  if (!SARVAM_API_KEY) return text;

  const response = await withRetry(() =>
    fetch(`${SARVAM_BASE_URL}/transliterate`, {
      method: "POST",
      headers: sarvamHeaders(),
      body: JSON.stringify({
        input: text,
        source_language_code: toSarvamCode(sourceLanguageCode),
        target_language_code: toSarvamCode(targetLanguageCode),
        numerals_format: numeralsFormat,
      }),
    })
  );

  if (!response.ok) {
    console.error("Sarvam transliterate error:", response.status);
    return text;
  }

  const data = await response.json();
  return data.transliterated_text || text;
}

// ─── Speech to Text + Translate ──────────────────────────────────────────────

/**
 * Transcribe audio and translate to English in one shot.
 * Uses Sarvam's /speech-to-text-translate endpoint.
 */
export async function speechToTextAndTranslate(
  audioBuffer: Buffer | ArrayBuffer
): Promise<{ englishText: string; detectedLanguage: string }> {
  if (!SARVAM_API_KEY) {
    throw new Error("Sarvam API key not configured");
  }

  const formData = new FormData();
  const audioArray2 = Buffer.isBuffer(audioBuffer)
    ? (new Uint8Array(audioBuffer)).buffer as ArrayBuffer
    : audioBuffer as ArrayBuffer;
  const blob = new Blob([audioArray2], { type: "audio/wav" });
  formData.append("file", blob, "audio.wav");
  formData.append("model", "saaras:v2");

  const response = await withRetry(() =>
    fetch(`${SARVAM_BASE_URL}/speech-to-text-translate`, {
      method: "POST",
      headers: {
        "api-subscription-key": SARVAM_API_KEY!,
      },
      body: formData,
    })
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Sarvam STT-Translate error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return {
    englishText: data.transcript || "",
    detectedLanguage: data.language_code || "en-IN",
  };
}
