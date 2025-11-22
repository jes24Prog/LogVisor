# LogVisor

LogVisor is an intelligent, web-based log analysis and visualization tool built with Next.js and Shadcn/ui. It provides developers with a powerful and intuitive interface to parse, view, filter, and analyze raw log data in real-time.

## ✨ Features

- **Advanced Log Parsing**: Simply paste any raw text-based logs, and LogVisor will automatically parse them into a structured, easy-to-read format. It intelligently handles various common log formats, including:
  - JSON
  - Syslog-style
  - `key=value` pairs
  - Multi-line stack traces

- **Interactive Log Viewer**:
  - **Structured Display**: View logs in a clean, organized list with clear indicators for different log levels.
  - **Color-Coded Levels**: Log levels (ERROR, WARN, INFO, etc.) are color-coded and have unique icons for quick identification.
  - **Expandable Details**: Click on any log entry to expand and view detailed information, including formatted JSON payloads and the original raw log line.
  - **Word Wrapping**: Both log messages and code blocks wrap correctly, ensuring readability without horizontal scrolling.

- **Powerful Filtering and Searching**:
  - **Full-Text Search**: Instantly search through all log messages and raw content.
  - **Filter by Level**: Isolate specific log levels (e.g., show only `ERROR` and `WARN`).
  - **Date Range Picker**: Filter logs to a specific time window.
  - **Clear Filters**: A single click to reset all active filters.

- **UI and UX Enhancements**:
  - **Light & Dark Mode**: Seamlessly switch between light, dark, and system-default themes.
  - **Resizable Panes**: Adjust the view by dragging the divider between the raw log editor and the structured log viewer.
  - **Responsive Design**: A clean and usable interface on both desktop and mobile devices.

- **Data Management & Export**:
  - **Load Sample Data**: Instantly load a set of sample logs to explore the app's features.
  - **Export to JSON**: Download the currently filtered structured logs as a JSON file for external analysis or record-keeping.

- **Snipping Screenshot Tool**:
  - Activate "Snip" mode to capture a screenshot of any specific UI component.
  - Hover and click to capture the raw log editor, the entire log list, or even a single log entry.
  - The captured image is immediately downloaded as a PNG.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn/ui](https://ui.shadcn.com/)
- **UI Layout**: [React Resizable Panels](https://react-resizable-panels.vercel.app/)
- **Code Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **Screenshot Functionality**: [html2canvas](https://html2canvas.hertzen.com/)

## 🚀 Getting Started

To get started with the application, simply paste your logs into the "Raw Log Input" editor on the left and click the **Parse Logs** button. Alternatively, click **Load Sample** to see how the tool works with a predefined set of logs.