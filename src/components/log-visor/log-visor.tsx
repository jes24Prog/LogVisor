"use client";

import { useState } from "react";
import { LogEntry } from "@/lib/types";
import { LogEditor } from "./log-editor";
import { LogViewer } from "./log-viewer";
import { getSampleLogs, parseLogs } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import html2canvas from "html2canvas";

export function LogVisor() {
  const [rawLogs, setRawLogs] = useState("");
  const [parsedLogs, setParsedLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSnipping, setIsSnipping] = useState(false);
  const { toast } = useToast();

  const handleParse = async (logsToParse = rawLogs) => {
    if (!logsToParse.trim()) {
      toast({
        title: "Input is empty",
        description: "Please paste some logs or load a sample.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setParsedLogs([]);
    try {
      const result = await parseLogs(logsToParse);
      setParsedLogs(result);
      if (result.length === 0) {
        toast({
          title: "Parsing completed",
          description: "Could not parse any structured log entries.",
        });
      }
    } catch (error) {
      toast({
        title: "Parsing Error",
        description: "An unexpected error occurred while parsing logs.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = async () => {
    setIsLoading(true);
    const sample = await getSampleLogs();
    setRawLogs(sample);
    toast({
      title: "Sample Loaded",
      description: "Sample logs have been loaded into the editor.",
    });
    // Automatically parse sample logs
    await handleParse(sample);
    setIsLoading(false);
  };

  const handleClear = () => {
    setRawLogs("");
    setParsedLogs([]);
    toast({
      title: "Cleared",
      description: "Editor and results have been cleared.",
    });
  };

  const handleSnip = (element: HTMLElement) => {
    if (!element) return;
    html2canvas(element, {
        useCORS: true,
        onclone: (doc) => {
            if (doc.documentElement.classList.contains('dark')) {
                doc.body.style.backgroundColor = '#111';
            }
        }
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `snip-${new Date().toISOString()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
    setIsSnipping(false);
    toast({ title: 'Screenshot saved!' });
  };

  return (
    <PanelGroup direction="horizontal" className="flex-1 gap-4">
      <Panel defaultSize={50}>
        <div className="flex flex-col gap-4 h-full">
          <LogEditor
              value={rawLogs}
              onValueChange={setRawLogs}
              onParse={() => handleParse()}
              onLoadSample={handleLoadSample}
              onClear={handleClear}
              isParsing={isLoading}
              isSnipping={isSnipping}
              onSnip={handleSnip}
          />
        </div>
      </Panel>
      <PanelResizeHandle className="w-1 bg-border rounded-full hover:bg-primary transition-colors" />
      <Panel defaultSize={50}>
        <div className="h-full">
          <LogViewer
            logs={parsedLogs}
            isLoading={isLoading}
            isSnipping={isSnipping}
            onToggleSnipping={() => setIsSnipping(prev => !prev)}
            onSnip={handleSnip}
          />
        </div>
      </Panel>
    </PanelGroup>
  );
}
