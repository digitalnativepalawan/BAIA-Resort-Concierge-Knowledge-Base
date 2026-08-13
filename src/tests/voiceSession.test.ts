import { VoiceSessionManager } from '../voice/VoiceSessionManager';
import { TALA_PERSONA } from '../data/talaPersona';
import { executeToolCall } from '../services/toolRegistry';
import { requestService } from '../services/requestService';

/**
 * TALA Persistent Voice Session & Provider Test Suite
 */
export async function runVoiceSessionTests(): Promise<{ total: number; passed: number; results: Array<{ name: string; success: boolean; details?: string }> }> {
  const results: Array<{ name: string; success: boolean; details?: string }> = [];

  // 1. Test: Initialize VoiceSessionManager without OpenAI API Key
  try {
    const manager = new VoiceSessionManager({
      pitch: 1.0,
      rate: 1.0,
      selectedVoiceName: 'Native',
      openrouterApiKey: '', // Empty key
      selectedOpenRouterModel: 'openrouter/free',
      customApiKey: '',
      ollamaHost: 'http://localhost:11434',
      systemInstruction: 'Test instruction',
      autoSpeak: false,
      soundEnabled: false,
      continuousListening: false,
      useHybridNeural: false
    });

    const session = manager.getSession();
    const ok = Boolean(session.sessionId && session.activeResort === 'BAIA Resort San Vicente');
    results.push({
      name: 'Initialization without OpenAI API Key',
      success: ok,
      details: `Session initialized successfully with ID ${session.sessionId}`
    });
  } catch (e: any) {
    results.push({ name: 'Initialization without OpenAI API Key', success: false, details: e.message });
  }

  // 2. Test: TALA Persona & System Prompt Constraints
  try {
    const prompt = TALA_PERSONA.buildGroundedSystemInstruction('BAIA Resort check-in time is 2:00 PM.');
    const hasBrevityRule = prompt.includes('1 to 3 sentences maximum');
    const hasPricingRule = prompt.includes('PRICING RESTRICTIONS');
    const hasPersona = prompt.includes('BAIA Resort');

    results.push({
      name: 'TALA Persona & System Prompt Integrity',
      success: hasBrevityRule && hasPricingRule && hasPersona,
      details: 'Grounded system prompt contains brevity, pricing, and resort persona constraints'
    });
  } catch (e: any) {
    results.push({ name: 'TALA Persona & System Prompt Integrity', success: false, details: e.message });
  }

  // 3. Test: Tool Execution for Guest Request Registration
  try {
    const initialRequests = requestService.getLocalRequests().length;
    const toolResult = await executeToolCall('create_guest_request', {
      title: 'Extra Towels Request',
      description: 'Guest requested 2 extra pool towels',
      category: 'housekeeping',
      guestLabel: 'Test Guest',
      room: 'Villa 101'
    });

    const newRequests = requestService.getLocalRequests().length;
    const success = toolResult.success && newRequests === initialRequests + 1;

    results.push({
      name: 'Agentic Tool Call Registration',
      success,
      details: `Tool created request ID ${toolResult.requestId}. Total requests count increased.`
    });
  } catch (e: any) {
    results.push({ name: 'Agentic Tool Call Registration', success: false, details: e.message });
  }

  // 4. Test: Persistent Session Memory Tracking
  try {
    const manager = new VoiceSessionManager({
      pitch: 1.0,
      rate: 1.0,
      selectedVoiceName: 'Native',
      openrouterApiKey: 'test',
      selectedOpenRouterModel: 'openrouter/free',
      customApiKey: '',
      ollamaHost: 'http://localhost:11434',
      systemInstruction: '',
      autoSpeak: false,
      soundEnabled: false,
      continuousListening: false,
      useHybridNeural: false
    });

    await manager.startSession('Elena Vance', 'Villa 202');
    const session = manager.getSession();

    const ok = session.guestLabel === 'Elena Vance' && session.room === 'Villa 202' && session.connectionState === 'active';
    results.push({
      name: 'Persistent Session Metadata',
      success: ok,
      details: `Active session bound to ${session.guestLabel} (${session.room})`
    });
  } catch (e: any) {
    results.push({ name: 'Persistent Session Metadata', success: false, details: e.message });
  }

  // 5. Test: Price Safety Guard
  try {
    const systemPrompt = TALA_PERSONA.systemPrompt;
    const isProtected = systemPrompt.includes('Do NOT invent, estimate, or disclose internal prices');
    results.push({
      name: 'Price Safety Protection',
      success: isProtected,
      details: 'Strict rule preventing invented or unapproved pricing output is active'
    });
  } catch (e: any) {
    results.push({ name: 'Price Safety Protection', success: false, details: e.message });
  }

  const passed = results.filter((r) => r.success).length;
  return { total: results.length, passed, results };
}
