"use client";

import { useRef, useState } from "react";
import { LogEntry as LogEntryType } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Clipboard, ClipboardCheck } from "lucide-react";
import { getLogLevelColor, getLogLevelIcon } from "@/lib/log-utils";
import { cn } from "@/lib/utils";

interface LogEntryItemProps {
  log: LogEntryType;
  isExpanded?: boolean;
  onToggle: (id: string, open: boolean) => void;
  isSnipping: boolean;
  onSnip: (element: HTMLElement) => void;
}

export function LogEntryItem({ log, isExpanded, onToggle, isSnipping, onSnip }: LogEntryItemProps) {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  const LevelIcon = getLogLevelIcon(log.level);
  const levelColor = getLogLevelColor(log.level);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const handleToggle = (value: string) => {
    onToggle(log.id, value === log.id);
  }

  const handleSnipClick = (e: React.MouseEvent) => {
    if (isSnipping && itemRef.current) {
        e.stopPropagation();
        onSnip(itemRef.current);
    }
  }

  const value = isExpanded ? log.id : "";

  const formatJson = (details: Record<string, any>) => {
    const jsonString = JSON.stringify(details, null, 2);
    // Basic syntax highlighting
    return jsonString
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, (match) => {
        let cls = 'text-green-400';
        if (/:$/.test(match)) {
          cls = 'text-purple-400 dark:text-purple-300';
        }
        return `<span class="${cls}">${match}</span>`;
      })
      .replace(/\b(true|false)\b/g, '<span class="text-blue-500 dark:text-blue-300">$1</span>')
      .replace(/\b(null)\b/g, '<span class="text-gray-500">$1</span>')
      .replace(/\b-?\d+(\.\d+)?([eE][+-]?\d+)?\b/g, '<span class="text-orange-400">$&</span>');
  };

  return (
    <Accordion 
        type="single" 
        collapsible 
        className="w-full" 
        value={value} 
        onValueChange={isSnipping ? undefined : handleToggle}
    >
      <AccordionItem 
        ref={itemRef} 
        value={log.id} 
        className={cn(
            "border rounded-lg bg-card overflow-hidden transition-all duration-300 ease-in-out hover:shadow-md focus-within:shadow-md focus-within:ring-2 focus-within:ring-ring",
            isSnipping && 'cursor-crosshair hover:ring-2 hover:ring-primary hover:ring-offset-2 hover:ring-offset-background'
        )}
        onClick={handleSnipClick}
      >
        <AccordionTrigger 
            className={cn(
                "px-4 py-2 hover:no-underline [&[data-state=open]]:border-b",
                isSnipping && 'pointer-events-none'
            )}
        >
          <div className="flex items-center gap-4 w-full">
            <LevelIcon className={`h-5 w-5 shrink-0 ${levelColor}`} />
            <Badge
              variant="outline"
              className={`hidden md:inline-flex border-0 font-semibold ${levelColor}`}
            >
              {log.level}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono shrink-0">
              {format(new Date(log.timestamp), "HH:mm:ss.SSS")}
            </span>
            <p className="break-words text-sm text-left flex-1 min-w-0">{log.message}</p>
          </div>
        </AccordionTrigger>
        <AccordionContent className={cn("p-4 bg-muted/20", isSnipping && 'pointer-events-none')}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-semibold">Log Details</p>
              <p className="text-xs text-muted-foreground font-mono">{format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss.SSS 'UTC'")}</p>
            </div>
            <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={() => handleCopy(JSON.stringify(log, null, 2))}>
                {isCopied ? <ClipboardCheck className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
                <span className="sr-only">Copy JSON</span>
                </Button>
            </div>
          </div>
          <pre className="text-xs p-4 bg-gray-900 dark:bg-black text-white rounded-md whitespace-pre-wrap font-code break-words">
            <code dangerouslySetInnerHTML={{ __html: formatJson(log.details) }} />
          </pre>
          <p className="text-sm font-semibold mt-4 mb-2">Raw Log</p>
          <pre className="text-xs p-4 bg-gray-900 dark:bg-black text-white rounded-md whitespace-pre-wrap font-code break-words">
            <code>{log.raw}</code>
          </pre>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
