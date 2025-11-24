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
  // multiline stack trace with JSON
  `2024-07-31T10:03:00.000Z my-app[1234]: ERROR: Unhandled exception processing user data\nPayload: {"userId": 123, "action": "updateProfile", "data": {"name": "John Doe", "email": "john.doe@example.com"}}\njava.lang.NullPointerException\n\tat com.example.MyService.process(MyService.java:42)\n\tat com.example.Main.main(Main.java:10)`,
  // XML in log
  `2024-07-31T10:04:00.000Z my-app[1234]: DEBUG: Received SOAP request:\n<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"><soap:Header/><soap:Body><m:GetResponse xmlns:m="http://www.example.org/stock"><m:Item>Apple</m:Item></m:GetResponse></soap:Body></soap:Envelope>`,
  // trace log
  `2024-07-31T10:05:00.000Z my-app[1234]: TRACE: Entering function calculate_score`
];


const extractStructuredData = (text: string) => {
    const parts: { type: 'json' | 'xml' | 'text'; content: string }[] = [];
    let remainingText = text;
    
    // Regex to find JSON objects/arrays or XML blocks
    const regex = /(<[a-zA-Z/][^>]*>[\s\S]*?<\/[a-zA-Z][^>]*>|{[^}]*}|\[[^\]]*\])/g;

    let lastIndex = 0;
    let match;

    while ((match = regex.exec(remainingText)) !== null) {
        const potentialJson = match[1];
        const potentialXml = match[1];

        // Add text before the match
        if (match.index > lastIndex) {
            parts.push({ type: 'text', content: remainingText.substring(lastIndex, match.index) });
        }

        // Check if it's valid JSON
        try {
            JSON.parse(potentialJson);
            parts.push({ type: 'json', content: potentialJson });
            lastIndex = match.index + potentialJson.length;
            continue;
        } catch (e) {
            // Not valid JSON
        }
        
        // Check if it's likely XML
        if (potentialXml.startsWith('<') && potentialXml.endsWith('>')) {
             parts.push({ type: 'xml', content: potentialXml });
             lastIndex = match.index + potentialXml.length;
             continue;
        }
        
        // If it's neither, treat it as text up to the end of the match
        parts.push({ type: 'text', content: remainingText.substring(lastIndex, match.index + potentialJson.length) });
        lastIndex = match.index + potentialJson.length;
    }

    // Add any remaining text after the last match
    if (lastIndex < remainingText.length) {
        parts.push({ type: 'text', content: remainingText.substring(lastIndex) });
    }
    
    // If no structured data found, return the original text as a single part
    if (parts.length === 0) {
        return [{ type: 'text', content: text }];
    }

    return parts;
};


const parseLine = (line: string, index: number): LogEntry => {
  if (!line.trim()) {
    return {
      id: `log-empty-${index}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'OTHER',
      message: '--- empty line ---',
      details: {},
      raw: line,
    };
  }
  
  try {
    const json = JSON.parse(line);
    const level = (json.level?.toUpperCase() || 'OTHER');
    return {
      id: `log-${index}-${Date.now()}`,
      timestamp: json.timestamp || new Date().toISOString(),
      level: ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'].includes(level) ? level as LogLevel : 'OTHER',
      message: json.message || 'No message',
      details: json,
      raw: line,
    };
  } catch (e) {
    // Not a full JSON line, continue parsing
  }

  // Regex for syslog-like, key-value, or generic timestamped lines
  const logStartRegex = /^(?:(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[.,]\d{3,9}Z?)|(\d{2}:\d{2}:\d{2}[.,]\d{3}))?.*?(INFO|WARN|ERROR|DEBUG|TRACE)/i;
  let match = line.match(logStartRegex);

  let timestamp = new Date();
  let level: LogLevel = 'OTHER';
  let message = line;
  let details = {};

  if (match) {
    const timestampStr = match[1] || match[2];
    level = match[3].toUpperCase() as LogLevel;
    
    if (timestampStr) {
      if (match[2]) { // Time only
        const today = new Date();
        const datePart = today.toISOString().split('T')[0];
        try {
          timestamp = new Date(`${datePart}T${timestampStr.replace(',', '.')}Z`);
        } catch(e) { /* ignore invalid date */ }

      } else { // Full timestamp
         try {
          timestamp = new Date(timestampStr.replace(',', '.'));
        } catch(e) { /* ignore invalid date */ }
      }
    }
    
    // Try to parse key-value pairs
    if (line.includes('=')) {
        const kvPairs = line.match(/(\w+)=("([^"]*)"|'([^']*)'|(\S+))/g);
        if (kvPairs) {
            details = kvPairs.reduce((acc, pair) => {
                const [key, ...valParts] = pair.split('=');
                let value = valParts.join('=').trim();
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                if (key) acc[key] = value;
                return acc;
            }, {} as Record<string, any>);
            
            if (details.message) {
              message = details.message;
            }
        }
    }

  }

  // Fallback for any other line
  const baseEntry: Omit<LogEntry, 'id'> = {
    timestamp: timestamp.toISOString(),
    level,
    message,
    details,
    raw: line,
  };

  const extractedData = extractStructuredData(baseEntry.message);
  
  if (extractedData.length > 1 || extractedData[0].type !== 'text') {
      baseEntry.extractedData = extractedData;
      // The message becomes the first line of the raw log
      baseEntry.message = line.split('\n')[0];
  }


  return {
    id: `log-${index}-${Date.now()}`,
    ...baseEntry,
  };
};

export async function parseLogs(rawLogs: string): Promise<LogEntry[]> {
  // Simulate network delay and AI processing time
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!rawLogs.trim()) {
    return [];
  }
  
  const lines = rawLogs.split('\n');
  const entries: string[] = [];
  let currentEntry = '';

  const newLogEntryRegex = /^(?:\d{4}-\d{2}-\d{2}T|\d{2}:\d{2}:\d{2}[.,]\d{3})|^\s*(?:ERROR|WARN|INFO|DEBUG|TRACE|FATAL|SEVERE)\b|timestamp=/;

  for (const line of lines) {
    if (newLogEntryRegex.test(line) && currentEntry) {
        entries.push(currentEntry);
        currentEntry = line;
    } else {
        currentEntry = currentEntry ? `${currentEntry}\n${line}` : line;
    }
  }

  if (currentEntry) {
    entries.push(currentEntry);
  }

  const parsed = entries
    .map((line, index) => parseLine(line, index))
    .filter((log): log is LogEntry => !!log);

  return parsed;
}

export async function getSampleLogs(): Promise<string> {
    return sampleLogs.join('\n');
}
