/**
 * Utility functions for TALA voice & telemetry processing.
 */

/**
 * Clean system responses before passing to Speech Synthesis engine.
 * Automatically strips all markdown tags, brackets, code blocks, URLs,
 * system tags, and special symbols before sending text to window.speechSynthesis.
 */
export function cleanTextForSpeech(rawText: string): string {
  if (!rawText) return '';

  return rawText
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
    // Replace bullet points e.g. - item or * item or 1. item with smooth pause
    .replace(/^\s*[-+*]\s+/gm, '. ')
    .replace(/^\s*\d+\.\s+/gm, '. ')
    // Remove HTML tags
    .replace(/<[^>]*>/g, ' ')
    // Clean remaining special symbols that sound unnatural when spoken
    .replace(/[<>#\\/|{}=@$^&~]/g, ' ')
    // Collapse multiple spaces/newlines into a single clean sentence pause
    .replace(/\s+/g, ' ')
    .trim();
}
