# Task Log v4

A task management web app with subtasks, filtering, and data import/export capabilities.

## Setup
1. Open `index.html` in your browser
2. Start managing tasks

## Features

### Task Management
- Create, edit, and delete tasks with subtasks
- Default status: "Not Started" for new tasks
- Default priority: "Low" for new tasks
- Track task status, priority, and creation time
- Optional alarm time setting
- Subtask support with independent status and priority
- Auto-removal of empty subtasks when closing modal
- Drag-and-drop reordering of subtasks

### Data Fields
- Task: Main task description (required)
- Info: Additional task information
- Tool: Associated tool or resource
- CH: Custom field for additional categorization
- Type: Task type (SW/HK)
- Status: Current task state (Not Started/In Progress/Completed/Wait)
- Priority: Task importance (High/Medium/Low)
- Created: Automatic timestamp (MM/DD HH:mm format)
- Alarm: Optional reminder time

### Organization
- Filter tasks by:
  - Status (Not Started, In Progress, Completed, Wait)
  - Type (SW, HK)
- Sort by:
  - Any column (click column headers)
  - Dedicated sorting for Priority and Creation time
- Automatic sorting of subtasks (active tasks first, completed at bottom)

### Data Management
- Export tasks to CSV format
- Import tasks from CSV files
- Persistent storage using localStorage
- Maintains all task data including subtasks during import/export

### User Interface
- Modern dark theme UI
- Responsive design for all screen sizes
- Intuitive subtask management modal
- Dynamic subtask button showing first subtask name and count
- Drag-and-drop subtask reordering
- Multi-window support

## Technical Notes
- Works in any modern browser
- Uses browser's localStorage for data
- No installation or build process needed
- Only external dependency: Font Awesome (for icons)

## Files
- `index.html`: Main app structure
- `styles.css`: Styling
- `utilities.css`: Helper styles
- `script.js`: App logic

## License
MIT License - Free to use and modify 
