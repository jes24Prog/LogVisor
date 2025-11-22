"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { LogEntry as LogEntryType, LogLevel } from "@/lib/types";
import { LogEntryItem } from "./log-entry-item";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronsDown, ChevronsUp, Download, Search, X, Scissors } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getLogLevelIcon, getLogLevelColor } from "@/lib/log-utils";
import { cn } from "@/lib/utils";

interface LogViewerProps {
  logs: LogEntryType[];
  isLoading: boolean;
  isSnipping: boolean;
  onToggleSnipping: () => void;
  onSnip: (element: HTMLElement) => void;
}

export function LogViewer({ logs, isLoading, isSnipping, onToggleSnipping, onSnip }: LogViewerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<LogLevel[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [expandedState, setExpandedState] = useState<{ [key: string]: boolean }>({});
  const logContainerRef = useRef<HTMLDivElement>(null);


  const toggleAll = (expand: boolean) => {
    const newState: { [key: string]: boolean } = {};
    filteredLogs.forEach((log) => {
      newState[log.id] = expand;
    });
    setExpandedState(newState);
  };
  
  useEffect(() => {
    setExpandedState({});
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const lowerCaseSearch = searchTerm.toLowerCase();
      const inSearch =
        log.message.toLowerCase().includes(lowerCaseSearch) ||
        log.raw.toLowerCase().includes(lowerCaseSearch);

      const inLevel =
        selectedLevels.length === 0 || selectedLevels.includes(log.level);

      const inDate =
        !dateRange ||
        !dateRange.from ||
        (new Date(log.timestamp) >= dateRange.from &&
          (!dateRange.to || new Date(log.timestamp) <= dateRange.to));

      return inSearch && inLevel && inDate;
    });
  }, [logs, searchTerm, selectedLevels, dateRange]);

  const logLevelCounts = useMemo(() => {
    const counts: { [key in LogLevel]: number } = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0, TRACE: 0, OTHER: 0 };
    logs.forEach(log => {
      if (counts[log.level] !== undefined) {
        counts[log.level]++;
      }
    });
    return counts;
  }, [logs]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedLevels([]);
    setDateRange(undefined);
  }

  const handleExport = () => {
    if (filteredLogs.length === 0) {
      return;
    }
    const data = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleSnipClick = () => {
    if (isSnipping && logContainerRef.current) {
      onSnip(logContainerRef.current);
    }
  }

  const hasActiveFilters = searchTerm || selectedLevels.length > 0 || dateRange;

  return (
    <Card 
      className={cn(
        "h-full flex flex-col transition-all",
        isSnipping && 'cursor-crosshair hover:ring-2 hover:ring-primary hover:ring-offset-2 hover:ring-offset-background'
      )}
      onClick={handleSnipClick}
    >
      <CardHeader>
        <CardTitle>Structured Logs</CardTitle>
        <CardDescription>
          Showing {filteredLogs.length} of {logs.length} entries.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col gap-4">
        <div className={cn(isSnipping && 'pointer-events-none')}>
            <div className="flex flex-col md:flex-row items-center gap-2">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    />
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className="w-full md:w-[280px] justify-start text-left font-normal"
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                        dateRange.to ? (
                            <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(dateRange.from, "LLL dd, y")
                        )
                        ) : (
                        <span>Pick a date range</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                    />
                    </PopoverContent>
                </Popover>
            </div>
          
            <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-2 mt-4">
                <ToggleGroup
                    type="multiple"
                    variant="outline"
                    size="sm"
                    value={selectedLevels}
                    onValueChange={(levels) => setSelectedLevels(levels as LogLevel[])}
                    className="justify-start flex-wrap"
                >
                    {(Object.keys(logLevelCounts) as LogLevel[]).map((level) => {
                        const count = logLevelCounts[level];
                        const Icon = getLogLevelIcon(level);
                        const color = getLogLevelColor(level);
                        if (count === 0 && !selectedLevels.includes(level)) return null;
                        return (
                            <ToggleGroupItem key={level} value={level} aria-label={`Toggle ${level}`} className="data-[state=on]:bg-primary/10 data-[state=on]:text-primary">
                                <Icon className={`mr-2 h-4 w-4 ${selectedLevels.includes(level) ? 'text-primary' : color}`} />
                                {level} ({count})
                            </ToggleGroupItem>
                        );
                    })}
                </ToggleGroup>
                <div className="flex items-center gap-2 self-end sm:self-center flex-wrap justify-end">
                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                            <X className="mr-2 h-4 w-4"/>
                            Clear
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => toggleAll(true)}><ChevronsDown className="mr-2 h-4 w-4" />Expand</Button>
                    <Button variant="outline" size="sm" onClick={() => toggleAll(false)}><ChevronsUp className="mr-2 h-4 w-4" />Collapse</Button>
                    <Button variant={isSnipping ? "default" : "outline"} size="sm" onClick={onToggleSnipping}>
                        <Scissors className="mr-2 h-4 w-4" />
                        {isSnipping ? 'Cancel' : 'Snip'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredLogs.length === 0}><Download className="mr-2 h-4 w-4" />Export</Button>
                </div>
            </div>
        </div>

        <div className="flex-1" ref={logContainerRef}>
          <div className="space-y-2 pr-4">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 rounded-md border p-3">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-32" />
                      <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                      </div>
                  </div>
                ))}
              </div>
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <LogEntryItem
                  key={log.id}
                  log={log}
                  isExpanded={expandedState[log.id]}
                  onToggle={(id, open) => setExpandedState(prev => ({...prev, [id]: open}))}
                  isSnipping={isSnipping}
                  onSnip={onSnip}
                />
              ))
            ) : (
              <div className={cn("flex flex-col items-center justify-center h-full text-center text-muted-foreground rounded-lg border border-dashed min-h-[200px]", isSnipping && 'pointer-events-none')}>
                <Search className="h-12 w-12 mb-4" />
                <p className="text-lg font-semibold">No Logs Found</p>
                <p>Try changing your filters or parsing new logs.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
