import { LogLevel } from "./types";
import { AlertCircle, AlertTriangle, Info, Bug, Footprints, FileText } from "lucide-react";

export const getLogLevelColor = (level: LogLevel): string => {
  switch (level) {
    case "ERROR":
      return "text-red-500";
    case "WARN":
      return "text-yellow-500";
    case "INFO":
      return "text-blue-500";
    case "DEBUG":
      return "text-gray-500";
    case "TRACE":
      return "text-purple-500";
    default:
      return "text-muted-foreground";
  }
};

export const getLogLevelIcon = (level: LogLevel) => {
  switch (level) {
    case "ERROR":
      return AlertCircle;
    case "WARN":
      return AlertTriangle;
    case "INFO":
      return Info;
    case "DEBUG":
      return Bug;
    case "TRACE":
      return Footprints;
    default:
      return FileText;
  }
};
