import { requestService } from './requestService';
import { knowledgeService } from './knowledgeService';
import { GuestRequest, GuestRequestCategory } from '../types';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
  execute: (args: any, context?: any) => Promise<any>;
}

export const TALA_TOOLS: Record<string, ToolDefinition> = {
  create_guest_request: {
    name: 'create_guest_request',
    description: 'Creates an official guest service request for resort staff (e.g., extra towels, airport shuttle, motorbike rental, housekeeping, breakfast, maintenance).',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short summary of the request' },
        description: { type: 'string', description: 'Detailed request notes' },
        category: {
          type: 'string',
          enum: ['housekeeping', 'transportation', 'food', 'maintenance', 'activity', 'general'],
          description: 'Request category'
        },
        guestLabel: { type: 'string', description: 'Guest name or room identifier' },
        room: { type: 'string', description: 'Room or villa number' }
      },
      required: ['title', 'category']
    },
    execute: async (args, context) => {
      const room = args.room || context?.room || 'Villa 101';
      const guestLabel = args.guestLabel || context?.guestLabel || 'Guest';
      const category: GuestRequestCategory = args.category || 'general';

      const newRequest: GuestRequest = {
        id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: args.title || 'Guest Service Request',
        description: args.description || args.title || 'Requested via TALA Concierge',
        category,
        guestLabel,
        room,
        status: 'new',
        createdAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };

      const updatedRequests = await requestService.saveRequest(newRequest);
      return {
        success: true,
        message: `Request created for ${room}: "${newRequest.title}"`,
        requestId: newRequest.id,
        category: newRequest.category,
        totalActiveRequests: updatedRequests.length
      };
    }
  },

  lookup_resort_info: {
    name: 'lookup_resort_info',
    description: 'Searches the grounded BAIA Resort Knowledge Base for information about facilities, amenities, food, transportation, activities, and policies.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query for BAIA resort knowledge' }
      },
      required: ['query']
    },
    execute: async (args) => {
      const query = args.query || '';
      const matches = knowledgeService.searchKnowledge(query, 3);
      if (matches) {
        return { success: true, excerpts: matches };
      }
      return { success: false, message: 'No specific knowledge base excerpt matched the query.' };
    }
  },

  retrieve_guest_requests: {
    name: 'retrieve_guest_requests',
    description: 'Retrieves current active service requests for the guest or room.',
    parameters: {
      type: 'object',
      properties: {
        room: { type: 'string', description: 'Room or villa identifier' }
      }
    },
    execute: async (args, context) => {
      const targetRoom = args.room || context?.room;
      const allRequests = requestService.getLocalRequests();
      const filtered = targetRoom
        ? allRequests.filter((r) => r.room?.toLowerCase() === targetRoom.toLowerCase())
        : allRequests;
      return { success: true, count: filtered.length, requests: filtered };
    }
  },

  handoff_to_staff: {
    name: 'handoff_to_staff',
    description: 'Flags the current conversation session for human staff intervention.',
    parameters: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Reason staff intervention is needed' }
      },
      required: ['reason']
    },
    execute: async (args) => {
      return {
        success: true,
        status: 'needs_staff',
        message: `Conversation flagged for staff response: ${args.reason}`
      };
    }
  }
};

export async function executeToolCall(toolName: string, args: any, context?: any) {
  const tool = TALA_TOOLS[toolName];
  if (!tool) {
    return { success: false, error: `Tool "${toolName}" not found in TALA registry.` };
  }
  try {
    return await tool.execute(args, context);
  } catch (err: any) {
    return { success: false, error: err.message || 'Tool execution failed' };
  }
}
