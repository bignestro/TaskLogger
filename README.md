# Task Logger v4

A modern, responsive web application for managing tasks and subtasks with advanced filtering, sorting, and data import/export capabilities.

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

## Usage

1. Task Creation:
   - Fill in task details in the input fields
   - Required: Task name
   - Optional: Info, Tool, CH, Type, Status, Priority, Alarm
   - Click "Add Task" to create

2. Subtask Management:
   - Click "+Subtask" on any task to open modal
   - Add subtasks with name, status, and priority
   - Drag to reorder subtasks
   - Empty subtasks are automatically removed on modal close

3. Organization:
   - Use filter buttons to show specific task types or status
   - Click column headers to sort
   - Use dedicated sort buttons for Priority and Creation time

4. Data Import/Export:
   - Click "Export CSV" to download task data
   - Click "Import CSV" to load tasks from a file
   - Imported tasks maintain all properties including subtasks

5. Multi-Window:
   - Click "Open in New Window" for multiple views
   - All windows sync through localStorage

## Technical Details

### Files
- `index.html`: Application structure and layout
- `styles.css`: Custom styling and dark theme
- `utilities.css`: Reset rules and utility classes
- `script.js`: Application logic and functionality

### Browser Support
Supports all modern browsers:
- Chrome
- Firefox
- Safari
- Edge

### Data Storage
- Uses browser's localStorage
- Automatic saving of all changes
- CSV import/export for data backup and transfer

## License

MIT License - Feel free to use, modify, and distribute as needed. 