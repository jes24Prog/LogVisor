"use server";

import { LogEntry, LogLevel } from "@/lib/types";

// A mock function to simulate log parsing
const sampleLogs = [
  // JSON log
  `{"level":"error","timestamp":"2024-07-31T10:00:00.123Z","service":"api-gateway","message":"Failed to process request","trace_id":"xyz-123","details":{"code":500,"reason":"upstream service unavailable"}}`,
  // Syslog-like
  `2024-07-31T10:01:30.456Z my-app[1234]: INFO: User 'admin' logged in successfully`,
  // key=value
  `timestamp=2024-07-31T10:02:15.789Z level=warn service=db-connector message="Connection pool nearing capacity" usage=95%`,
  // multiline stack trace
  `2024-07-31T10:03:00.000Z my-app[1234]: ERROR: Unhandled exception\njava.lang.NullPointerException\n\tat com.example.MyService.process(MyService.java:42)\n\tat com.example.Main.main(Main.java:10)`,
  // debug log
  `2024-07-31T10:04:00.000Z my-app[1234]: DEBUG: Received payload: { "user_id": 42, "action": "update" }`,
  // trace log
  `2024-07-31T10:05:00.000Z my-app[1234]: TRACE: Entering function calculate_score`
];

const parseLine = (line: string, index: number): LogEntry | null => {
  try {
    const json = JSON.parse(line);
    return {
      id: `log-${index}-${Date.now()}`,
      timestamp: json.timestamp || new Date().toISOString(),
      level: (json.level?.toUpperCase() as LogLevel) || 'OTHER',
      message: json.message || 'No message',
      details: json,
      raw: line,
    };
  } catch (e) {
    // Not JSON, try other formats
  }

  const syslogMatch = line.match(/^(\S+) \S+\[\d+\]: (INFO|WARN|ERROR|DEBUG|TRACE): (.*)/);
  if (syslogMatch) {
    const [, timestamp, level, message] = syslogMatch;
    return {
      id: `log-${index}-${Date.now()}`,
      timestamp: new Date(timestamp).toISOString(),
      level: level as LogLevel,
      message,
      details: {},
      raw: line,
    };
  }
  
  const kvMatch = line.match(/level=(\w+).*message="([^"]+)"/);
  if (kvMatch) {
      const timestampMatch = line.match(/timestamp=(\S+)/);
      const [, level, message] = kvMatch;
      return {
          id: `log-${index}-${Date.now()}`,
          timestamp: timestampMatch ? new Date(timestampMatch[1]).toISOString() : new Date().toISOString(),
          level: level.toUpperCase() as LogLevel,
          message,
          details: Object.fromEntries(line.split(' ').map(part => part.split('='))),
          raw: line,
      };
  }
  
  // Free text with level hint
  const freeTextMatch = line.match(/^(\S+) .*?(ERROR|WARN|INFO|DEBUG|TRACE)/i);
  if (freeTextMatch) {
    const [, timestamp, level] = freeTextMatch;
    return {
      id: `log-${index}-${Date.now()}`,
      timestamp: new Date(timestamp).toISOString(),
      level: level.toUpperCase() as LogLevel,
      message: line,
      details: {},
      raw: line
    }
  }

  return {
    id: `log-${index}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    level: 'OTHER',
    message: line,
    details: {},
    raw: line,
  };
};

export async function parseLogs(rawLogs: string): Promise<LogEntry[]> {
  // Simulate network delay and AI processing time
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (!rawLogs.trim()) {
    return [];
  }
  
  // Basic multiline handling for stack traces
  const lines = rawLogs.split('\n');
  const entries: string[] = [];
  let currentEntry = '';

  for (const line of lines) {
    // A simple heuristic: if a line doesn't start with a date/timestamp, it's a continuation.
    const isContinuation = !/^\d{4}-\d{2}-\d{2}T|\s+(at|Caused by:)/.test(line.trim()) && /^\s+/.test(line);

    if (currentEntry && isContinuation) {
      currentEntry += '\n' + line;
    } else {
      if (currentEntry) {
        entries.push(currentEntry);
      }
      currentEntry = line;
    }
  }
  if (currentEntry) {
    entries.push(currentEntry);
  }

  const parsed = entries
    .map((line, index) => parseLine(line, index))
    .filter((log): log is LogEntry => log !== null);

  return parsed;
}

export async function getSampleLogs(): Promise<string> {
    return sampleLogs.join('\n');
}
