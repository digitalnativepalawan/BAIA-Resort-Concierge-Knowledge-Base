/**
 * Utility functions for TALA voice & telemetry processing.
 */

/**
 * Strips model safety evaluation headers (e.g. "User Safety: safe", "Response Safety: safe")
 * returned by certain open models before display or voice synthesis.
 */
export function stripSafetyMetadata(text: string): string {
  if (!text) return '';
  return text
    .replace(/(?:User|Response|System)?\s*Safety\s*:\s*(?:safe|unsafe|pass|flagged|neutral|none|low|medium|high)/gi, '')
    .replace(/Safety\s*Rating\s*:\s*[^\n]+/gi, '')
    .trim();
}

/**
 * Clean system responses before passing to Speech Synthesis engine.
 * Automatically strips all markdown tags, brackets, code blocks, URLs,
 * safety metadata, and special symbols, and converts abbreviations/time/currency
 * into phonetically human-friendly spoken forms.
 */
export function cleanTextForSpeech(rawText: string): string {
  if (!rawText) return '';

  const sanitized = stripSafetyMetadata(rawText);

  return sanitized
    // Remove markdown code blocks ```...```
    .replace(/```[\s\S]*?```/g, '. Code snippet omitted. ')
    // Remove inline code backticks `code` -> code
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove raw URLs
    .replace(/https?:\/\/\S+/g, '')
    // Remove bracketed system tags e.g. [SYSTEM STATUS], [VOCALIZING], [ERROR], [TALA SYSTEM ALERT]
    .replace(/\[[A-Z0-9_\s:!?-]+\]/gi, '')
    // Remove markdown headers e.g. ### Header, ## Header, # Header
    .replace(/^#+\s+/gm, '')
    // Remove markdown formatting: **, __, *, _, ~, ~~
    .replace(/[*_~]{1,3}/g, '')
    // Expand tech & resort abbreviations for humanlike natural pronunciation
    .replace(/\bwi-?fi\b/gi, 'Why-Fy')
    .replace(/\be\.?g\.?\b/gi, 'for example')
    .replace(/\bi\.?e\.?\b/gi, 'that is')
    .replace(/\bapprox\.?\b/gi, 'approximately')
    .replace(/\bmin\b/gi, 'minutes')
    .replace(/\bhrs?\b/gi, 'hours')
    .replace(/\ba\/c\b/gi, 'air conditioning')
    .replace(/\bac\b/gi, 'air conditioning')
    .replace(/\ba\.m\.\b/gi, 'A M')
    .replace(/\bp\.m\.\b/gi, 'P M')
    // Currency & numbers phonetic conversions
    .replace(/₱\s?(\d+)/g, '$1 pesos')
    .replace(/PHP\s?(\d+)/gi, '$1 pesos')
    .replace(/\$\s?(\d+)/g, '$1 dollars')
    // Replace bullet points e.g. - item or * item or 1. item with smooth sentence pause
    .replace(/^\s*[-+*]\s+/gm, '. ')
    .replace(/^\s*\d+\.\s+/gm, '. ')
    // Remove HTML tags
    .replace(/<[^>]*>/g, ' ')
    // Clean remaining special symbols that sound unnatural when spoken
    .replace(/[<>#\\/|{}=@$^&~]/g, ' ')
    // Collapse multiple spaces/newlines into clean sentence pauses
    .replace(/\s+/g, ' ')
    .trim();
}
