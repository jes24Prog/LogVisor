"use client";

import { useRef } from 'react';
import { Editor } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ClipboardPaste, Loader, Sparkles, Trash2, FileText, Scissors } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { cn } from '@/lib/utils';

interface LogEditorProps {
  value: string;
  onValueChange: (value: string) => void;
  onParse: () => void;
  onLoadSample: () => void;
  onClear: () => void;
  isParsing: boolean;
  isSnipping: boolean;
  onSnip: (element: HTMLElement) => void;
}

export function LogEditor({
  value,
  onValueChange,
  onParse,
  onLoadSample,
  onClear,
  isParsing,
  isSnipping,
  onSnip,
}: LogEditorProps) {
  const { toast } = useToast();
  const { theme } = useTheme();
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onValueChange(text);
      toast({
        title: "Pasted from clipboard!",
      });
    } catch (error) {
      toast({
        title: "Failed to paste",
        description: "Could not read from clipboard. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const handleSnipClick = () => {
    if (isSnipping && editorContainerRef.current) {
        onSnip(editorContainerRef.current);
    }
  }

  return (
    <Card 
        className={cn(
            "flex flex-col h-full transition-all",
            isSnipping && 'cursor-crosshair hover:ring-2 hover:ring-primary hover:ring-offset-2 hover:ring-offset-background'
        )}
        onClick={handleSnipClick}
    >
      <CardHeader>
        <CardTitle>Raw Log Input</CardTitle>
        <CardDescription>
          Paste your logs below or load a sample set to get started.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button onClick={onParse} disabled={isParsing || isSnipping}>
          {isParsing ? (
            <Loader className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Parse Logs
        </Button>
        <Button onClick={handlePaste} variant="secondary" disabled={isSnipping}>
          <ClipboardPaste className="mr-2 h-4 w-4" /> Paste
        </Button>
        <Button onClick={onLoadSample} variant="secondary" disabled={isSnipping}>
          <FileText className="mr-2 h-4 w-4" /> Load Sample
        </Button>
        <Button onClick={onClear} variant="ghost" size="icon" aria-label="Clear logs" disabled={isSnipping}>
            <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
      <div ref={editorContainerRef} className="flex-grow p-6 pt-0">
        <div className={cn("h-full min-h-[400px] lg:min-h-0 w-full rounded-lg overflow-hidden border", isSnipping && 'pointer-events-none')}>
            <Editor
            height="100%"
            language="plaintext"
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            value={value}
            onChange={(v) => onValueChange(v || "")}
            options={{
                minimap: { enabled: false },
                wordWrap: "on",
                fontSize: 14,
                fontFamily: "'Source Code Pro', monospace",
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                automaticLayout: true
            }}
            />
        </div>
      </div>
    </Card>
  );
}
