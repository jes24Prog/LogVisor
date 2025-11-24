"use client";

import { useRef, useState } from "react";
import { LogEntry as LogEntryType } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Clipboard, ClipboardCheck, Code, FileText, Braces } from "lucide-react";
import { getLogLevelColor, getLogLevelIcon } from "@/lib/log-utils";
import { cn } from "@/lib/utils";

interface LogEntryItemProps {
  log: LogEntryType;
  isExpanded?: boolean;
  onToggle: (id: string, open: boolean) => void;
  isSnipping: boolean;
  onSnip: (element: HTMLElement) => void;
}

const CodeBlock = ({ title, content, language }: { title: string; content: string; language: string }) => {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        toast({ title: `${title} copied to clipboard!` });
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const formatJson = (jsonString: string) => {
      try {
        const parsed = JSON.parse(jsonString);
        const formatted = JSON.stringify(parsed, null, 2);
         return formatted
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
      } catch (e) {
        return jsonString; // Not valid JSON, return as is
      }
    };
    
    const formattedContent = language === 'json' ? formatJson(content) : content;

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold flex items-center gap-2">
                    {language === 'json' ? <Braces className="h-4 w-4" /> : language === 'xml' ? <Code className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    {title}
                </p>
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                    {isCopied ? <ClipboardCheck className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
                    <span className="sr-only">Copy {title}</span>
                </Button>
            </div>
            <pre className="text-xs p-4 bg-gray-900 dark:bg-black text-white rounded-md whitespace-pre-wrap font-code break-words">
                <code dangerouslySetInnerHTML={{ __html: formattedContent }} />
            </pre>
        </div>
    );
}

export function LogEntryItem({ log, isExpanded, onToggle, isSnipping, onSnip }: LogEntryItemProps) {
  const { toast } = useToast();
  const itemRef = useRef<HTMLDivElement>(null);

  const LevelIcon = getLogLevelIcon(log.level);
  const levelColor = getLogLevelColor(log.level);

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
  
  const firstLineOfMessage = log.message.split('\n')[0];

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
            <p className="break-words text-sm text-left flex-1 min-w-0">{firstLineOfMessage}</p>
          </div>
        </AccordionTrigger>
        <AccordionContent className={cn("p-4 bg-muted/20 space-y-4", isSnipping && 'pointer-events-none')}>
          <div>
            <p className="text-sm font-semibold">Log Details</p>
            <p className="text-xs text-muted-foreground font-mono">{format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss.SSS 'UTC'")}</p>
          </div>
          
          {log.extractedData ? (
             log.extractedData.map((data, index) => {
                const title = data.type.charAt(0).toUpperCase() + data.type.slice(1);
                if (data.type === 'text' && !data.content.trim()) return null;
                return (
                    <CodeBlock 
                        key={index} 
                        title={title}
                        content={data.content}
                        language={data.type}
                    />
                );
             })
          ) : (
             <CodeBlock title="Message" content={log.message} language="text" />
          )}

          {Object.keys(log.details).length > 0 && (
            <CodeBlock title="Details" content={JSON.stringify(log.details)} language="json" />
          )}

          <CodeBlock title="Raw Log" content={log.raw} language="text" />

        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
