/**
 * Morgus Calendar MCP Server
 * 
 * Provides tools for interacting with Google Calendar:
 * - List calendars
 * - List events
 * - Create events
 * - Update events
 * - Delete events
 * - Find free time slots
 */

interface Env {
  ENVIRONMENT: string;
}

interface MCPRequest {
  method: string;
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
  };
  config?: {
    google_access_token?: string;
  };
}

interface MCPResponse {
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

// Tool definitions
const TOOLS = [
  {
    name: 'list_calendars',
    description: 'List all calendars accessible to the user',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'list_events',
    description: 'List events from a calendar within a time range',
    inputSchema: {
      type: 'object',
      properties: {
        calendar_id: {
          type: 'string',
          description: 'Calendar ID (use "primary" for the main calendar)'
        },
        time_min: {
          type: 'string',
          description: 'Start of time range (ISO 8601 format, e.g., 2024-01-01T00:00:00Z)'
        },
        time_max: {
          type: 'string',
          description: 'End of time range (ISO 8601 format)'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of events to return (default: 10)'
        },
        query: {
          type: 'string',
          description: 'Free text search query to filter events'
        }
      },
      required: ['calendar_id']
    }
  },
  {
    name: 'get_event',
    description: 'Get details of a specific event',
    inputSchema: {
      type: 'object',
      properties: {
        calendar_id: {
          type: 'string',
          description: 'Calendar ID'
        },
        event_id: {
          type: 'string',
          description: 'Event ID'
        }
      },
      required: ['calendar_id', 'event_id']
    }
  },
  {
    name: 'create_event',
    description: 'Create a new calendar event',
    inputSchema: {
      type: 'object',
      properties: {
        calendar_id: {
          type: 'string',
          description: 'Calendar ID (use "primary" for the main calendar)'
        },
        summary: {
          type: 'string',
          description: 'Event title/summary'
        },
        description: {
          type: 'string',
          description: 'Event description'
        },
        location: {
          type: 'string',
          description: 'Event location'
        },
        start_time: {
          type: 'string',
          description: 'Start time (ISO 8601 format)'
        },
        end_time: {
          type: 'string',
          description: 'End time (ISO 8601 format)'
        },
        attendees: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of attendee email addresses'
        },
        send_notifications: {
          type: 'boolean',
          description: 'Whether to send email notifications to attendees'
        },
        recurrence: {
          type: 'string',
          description: 'Recurrence rule (RRULE format, e.g., "RRULE:FREQ=WEEKLY;COUNT=10")'
        }
      },
      required: ['calendar_id', 'summary', 'start_time', 'end_time']
    }
  },
  {
    name: 'update_event',
    description: 'Update an existing calendar event',
    inputSchema: {
      type: 'object',
      properties: {
        calendar_id: {
          type: 'string',
          description: 'Calendar ID'
        },
        event_id: {
          type: 'string',
          description: 'Event ID to update'
        },
        summary: {
          type: 'string',
          description: 'New event title'
        },
        description: {
          type: 'string',
          description: 'New event description'
        },
        location: {
          type: 'string',
          description: 'New event location'
        },
        start_time: {
          type: 'string',
          description: 'New start time'
        },
        end_time: {
          type: 'string',
          description: 'New end time'
        }
      },
      required: ['calendar_id', 'event_id']
    }
  },
  {
    name: 'delete_event',
    description: 'Delete a calendar event',
    inputSchema: {
      type: 'object',
      properties: {
        calendar_id: {
          type: 'string',
          description: 'Calendar ID'
        },
        event_id: {
          type: 'string',
          description: 'Event ID to delete'
        },
        send_notifications: {
          type: 'boolean',
          description: 'Whether to send cancellation notifications'
        }
      },
      required: ['calendar_id', 'event_id']
    }
  },
  {
    name: 'find_free_time',
    description: 'Find free time slots across one or more calendars',
    inputSchema: {
      type: 'object',
      properties: {
        calendar_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of calendar IDs to check'
        },
        time_min: {
          type: 'string',
          description: 'Start of time range to search'
        },
        time_max: {
          type: 'string',
          description: 'End of time range to search'
        },
        duration_minutes: {
          type: 'number',
          description: 'Minimum duration of free slot in minutes'
        }
      },
      required: ['calendar_ids', 'time_min', 'time_max', 'duration_minutes']
    }
  },
  {
    name: 'quick_add',
    description: 'Create an event using natural language (e.g., "Meeting with John tomorrow at 3pm")',
    inputSchema: {
      type: 'object',
      properties: {
        calendar_id: {
          type: 'string',
          description: 'Calendar ID'
        },
        text: {
          type: 'string',
          description: 'Natural language description of the event'
        }
      },
      required: ['calendar_id', 'text']
    }
  }
];

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

// Helper to make Google Calendar API requests
async function googleCalendarRequest(
  accessToken: string,
  endpoint: string,
  method: string = 'GET',
  body?: object
): Promise<unknown> {
  const response = await fetch(`${GOOGLE_CALENDAR_API}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Calendar API error: ${error}`);
  }
  
  if (response.status === 204) {
    return { success: true };
  }
  
  return response.json();
}

// Tool implementations
async function listCalendars(accessToken: string) {
  const data = await googleCalendarRequest(accessToken, '/users/me/calendarList') as {
    items: Array<{ id: string; summary: string; primary?: boolean; accessRole: string }>
  };
  
  return {
    calendars: data.items.map(cal => ({
      id: cal.id,
      name: cal.summary,
      primary: cal.primary || false,
      access_role: cal.accessRole
    }))
  };
}

async function listEvents(accessToken: string, args: {
  calendar_id: string;
  time_min?: string;
  time_max?: string;
  max_results?: number;
  query?: string;
}) {
  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(args.max_results || 10)
  });
  
  if (args.time_min) params.set('timeMin', args.time_min);
  if (args.time_max) params.set('timeMax', args.time_max);
  if (args.query) params.set('q', args.query);
  
  // Default to next 7 days if no time range specified
  if (!args.time_min) {
    params.set('timeMin', new Date().toISOString());
  }
  if (!args.time_max) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    params.set('timeMax', nextWeek.toISOString());
  }
  
  const data = await googleCalendarRequest(
    accessToken,
    `/calendars/${encodeURIComponent(args.calendar_id)}/events?${params}`
  ) as {
    items: Array<{
      id: string;
      summary: string;
      description?: string;
      location?: string;
      start: { dateTime?: string; date?: string };
      end: { dateTime?: string; date?: string };
      attendees?: Array<{ email: string; responseStatus: string }>;
    }>
  };
  
  return {
    events: (data.items || []).map(event => ({
      id: event.id,
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      attendees: event.attendees?.map(a => ({ email: a.email, status: a.responseStatus }))
    }))
  };
}

async function getEvent(accessToken: string, args: { calendar_id: string; event_id: string }) {
  const event = await googleCalendarRequest(
    accessToken,
    `/calendars/${encodeURIComponent(args.calendar_id)}/events/${encodeURIComponent(args.event_id)}`
  ) as {
    id: string;
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
    attendees?: Array<{ email: string; responseStatus: string }>;
    htmlLink: string;
  };
  
  return {
    id: event.id,
    summary: event.summary,
    description: event.description,
    location: event.location,
    start: event.start.dateTime || event.start.date,
    end: event.end.dateTime || event.end.date,
    attendees: event.attendees?.map(a => ({ email: a.email, status: a.responseStatus })),
    link: event.htmlLink
  };
}

async function createEvent(accessToken: string, args: {
  calendar_id: string;
  summary: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  attendees?: string[];
  send_notifications?: boolean;
  recurrence?: string;
}) {
  const eventBody: Record<string, unknown> = {
    summary: args.summary,
    start: { dateTime: args.start_time },
    end: { dateTime: args.end_time }
  };
  
  if (args.description) eventBody.description = args.description;
  if (args.location) eventBody.location = args.location;
  if (args.attendees) {
    eventBody.attendees = args.attendees.map(email => ({ email }));
  }
  if (args.recurrence) {
    eventBody.recurrence = [args.recurrence];
  }
  
  const params = new URLSearchParams();
  if (args.send_notifications !== undefined) {
    params.set('sendNotifications', String(args.send_notifications));
  }
  
  const event = await googleCalendarRequest(
    accessToken,
    `/calendars/${encodeURIComponent(args.calendar_id)}/events?${params}`,
    'POST',
    eventBody
  ) as { id: string; htmlLink: string };
  
  return {
    id: event.id,
    link: event.htmlLink,
    message: 'Event created successfully'
  };
}

async function updateEvent(accessToken: string, args: {
  calendar_id: string;
  event_id: string;
  summary?: string;
  description?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
}) {
  // First get the existing event
  const existing = await getEvent(accessToken, {
    calendar_id: args.calendar_id,
    event_id: args.event_id
  });
  
  const eventBody: Record<string, unknown> = {
    summary: args.summary || existing.summary,
    start: { dateTime: args.start_time || existing.start },
    end: { dateTime: args.end_time || existing.end }
  };
  
  if (args.description !== undefined) eventBody.description = args.description;
  if (args.location !== undefined) eventBody.location = args.location;
  
  await googleCalendarRequest(
    accessToken,
    `/calendars/${encodeURIComponent(args.calendar_id)}/events/${encodeURIComponent(args.event_id)}`,
    'PUT',
    eventBody
  );
  
  return { message: 'Event updated successfully' };
}

async function deleteEvent(accessToken: string, args: {
  calendar_id: string;
  event_id: string;
  send_notifications?: boolean;
}) {
  const params = new URLSearchParams();
  if (args.send_notifications !== undefined) {
    params.set('sendNotifications', String(args.send_notifications));
  }
  
  await googleCalendarRequest(
    accessToken,
    `/calendars/${encodeURIComponent(args.calendar_id)}/events/${encodeURIComponent(args.event_id)}?${params}`,
    'DELETE'
  );
  
  return { message: 'Event deleted successfully' };
}

async function findFreeTime(accessToken: string, args: {
  calendar_ids: string[];
  time_min: string;
  time_max: string;
  duration_minutes: number;
}) {
  // Use freebusy API
  const freebusyBody = {
    timeMin: args.time_min,
    timeMax: args.time_max,
    items: args.calendar_ids.map(id => ({ id }))
  };
  
  const data = await googleCalendarRequest(
    accessToken,
    '/freeBusy',
    'POST',
    freebusyBody
  ) as {
    calendars: Record<string, { busy: Array<{ start: string; end: string }> }>
  };
  
  // Merge all busy times
  const allBusy: Array<{ start: Date; end: Date }> = [];
  for (const calId of args.calendar_ids) {
    const calData = data.calendars[calId];
    if (calData?.busy) {
      for (const slot of calData.busy) {
        allBusy.push({
          start: new Date(slot.start),
          end: new Date(slot.end)
        });
      }
    }
  }
  
  // Sort by start time
  allBusy.sort((a, b) => a.start.getTime() - b.start.getTime());
  
  // Find free slots
  const freeSlots: Array<{ start: string; end: string; duration_minutes: number }> = [];
  const rangeStart = new Date(args.time_min);
  const rangeEnd = new Date(args.time_max);
  const minDuration = args.duration_minutes * 60 * 1000;
  
  let currentTime = rangeStart;
  
  for (const busy of allBusy) {
    if (busy.start > currentTime) {
      const gapDuration = busy.start.getTime() - currentTime.getTime();
      if (gapDuration >= minDuration) {
        freeSlots.push({
          start: currentTime.toISOString(),
          end: busy.start.toISOString(),
          duration_minutes: Math.round(gapDuration / 60000)
        });
      }
    }
    if (busy.end > currentTime) {
      currentTime = busy.end;
    }
  }
  
  // Check for free time after last busy slot
  if (currentTime < rangeEnd) {
    const gapDuration = rangeEnd.getTime() - currentTime.getTime();
    if (gapDuration >= minDuration) {
      freeSlots.push({
        start: currentTime.toISOString(),
        end: rangeEnd.toISOString(),
        duration_minutes: Math.round(gapDuration / 60000)
      });
    }
  }
  
  return { free_slots: freeSlots };
}

async function quickAdd(accessToken: string, args: { calendar_id: string; text: string }) {
  const event = await googleCalendarRequest(
    accessToken,
    `/calendars/${encodeURIComponent(args.calendar_id)}/events/quickAdd?text=${encodeURIComponent(args.text)}`,
    'POST'
  ) as { id: string; summary: string; htmlLink: string };
  
  return {
    id: event.id,
    summary: event.summary,
    link: event.htmlLink,
    message: 'Event created from natural language'
  };
}

// Main request handler
async function handleMCPRequest(request: MCPRequest): Promise<MCPResponse> {
  const { method, params, config } = request;
  
  switch (method) {
    case 'tools/list':
      return { result: { tools: TOOLS } };
      
    case 'tools/call':
      if (!params?.name) {
        return { error: { code: -32602, message: 'Missing tool name' } };
      }
      
      const accessToken = config?.google_access_token;
      if (!accessToken) {
        return { 
          error: { 
            code: -32602, 
            message: 'Google access token not configured. Please connect your Google account in settings.' 
          } 
        };
      }
      
      const args = params.arguments || {};
      
      try {
        let result;
        switch (params.name) {
          case 'list_calendars':
            result = await listCalendars(accessToken);
            break;
          case 'list_events':
            result = await listEvents(accessToken, args as {
              calendar_id: string;
              time_min?: string;
              time_max?: string;
              max_results?: number;
              query?: string;
            });
            break;
          case 'get_event':
            result = await getEvent(accessToken, args as { calendar_id: string; event_id: string });
            break;
          case 'create_event':
            result = await createEvent(accessToken, args as {
              calendar_id: string;
              summary: string;
              description?: string;
              location?: string;
              start_time: string;
              end_time: string;
              attendees?: string[];
              send_notifications?: boolean;
              recurrence?: string;
            });
            break;
          case 'update_event':
            result = await updateEvent(accessToken, args as {
              calendar_id: string;
              event_id: string;
              summary?: string;
              description?: string;
              location?: string;
              start_time?: string;
              end_time?: string;
            });
            break;
          case 'delete_event':
            result = await deleteEvent(accessToken, args as {
              calendar_id: string;
              event_id: string;
              send_notifications?: boolean;
            });
            break;
          case 'find_free_time':
            result = await findFreeTime(accessToken, args as {
              calendar_ids: string[];
              time_min: string;
              time_max: string;
              duration_minutes: number;
            });
            break;
          case 'quick_add':
            result = await quickAdd(accessToken, args as { calendar_id: string; text: string });
            break;
          default:
            return { error: { code: -32601, message: `Unknown tool: ${params.name}` } };
        }
        
        return { result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] } };
      } catch (error) {
        return { 
          error: { 
            code: -32603, 
            message: error instanceof Error ? error.message : 'Unknown error' 
          } 
        };
      }
      
    default:
      return { error: { code: -32601, message: `Unknown method: ${method}` } };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    
    try {
      const mcpRequest = await request.json() as MCPRequest;
      const response = await handleMCPRequest(mcpRequest);
      
      return new Response(JSON.stringify(response), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: {
          code: -32700,
          message: 'Parse error'
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};
