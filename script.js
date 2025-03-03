// Global Variables
let sortOrders = {};
const STORAGE_KEY = 'taskLoggerTasks';

// DOM Elements
const taskTable = document.getElementById('taskTable');
const addTaskBtn = document.getElementById('addTaskBtn');
const subtaskModal = document.getElementById('subtaskModal');
const closeModal = document.querySelector('.close');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadTasksFromStorage();
    setupEventListeners();
    setupTimeInput();
});

function setupTimeInput() {
    const alarmTimeInput = document.getElementById('alarmTime');
    
    // Handle direct input
    alarmTimeInput.addEventListener('input', (e) => {
        let val = e.target.value;
        
        // Remove any non-digit characters except colon
        val = val.replace(/[^\d:]/g, '');
        
        // Handle colon input
        if (val.length === 2 && !val.includes(':')) {
            val += ':';
            e.target.value = val;
            // Create a range to move cursor after the colon
            const range = e.target.createTextRange();
            range.collapse(true);
            range.moveEnd('character', val.length);
            range.moveStart('character', val.length);
            range.select();
        }
        
        // Parse hours and minutes
        let [hours, minutes] = val.split(':');
        
        // Handle hours
        if (hours && hours.length) {
            hours = parseInt(hours, 10);
            if (hours > 23) hours = 23;
            hours = String(hours).padStart(2, '0');
        }
        
        // Handle minutes
        if (minutes && minutes.length) {
            minutes = parseInt(minutes, 10);
            if (minutes > 59) minutes = 59;
            minutes = String(minutes).padStart(2, '0');
        }
        
        // Format the final value
        if (hours && minutes) {
            e.target.value = `${hours}:${minutes}`;
        } else if (hours) {
            e.target.value = hours + (val.includes(':') ? ':' : '');
        } else {
            e.target.value = val;
        }
    });

    // Validate on blur
    alarmTimeInput.addEventListener('blur', (e) => {
        const val = e.target.value;
        if (val && !val.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
            e.target.value = '';
        }
    });
}

function setupEventListeners() {
    addTaskBtn.addEventListener('click', addNewTask);
    closeModal.addEventListener('click', () => {
        // Remove empty subtasks before closing
        const subtaskTable = document.getElementById('subtaskTable');
        const emptySubtasks = Array.from(subtaskTable.querySelectorAll('tbody tr')).filter(row => {
            return !row.querySelector('input').value.trim();
        });
        emptySubtasks.forEach(row => row.remove());
        
        // Update the task and storage
        const taskRow = document.querySelector('#subtaskModal').taskRow;
        if (taskRow) {
            const subtasksButton = taskRow.querySelector('.action-btn');
            updateSubtasks(taskRow, subtasksButton);
        }
        
        subtaskModal.style.display = 'none';
    });
    window.addEventListener('click', (e) => {
        if (e.target === subtaskModal) {
            // Remove empty subtasks before closing
            const subtaskTable = document.getElementById('subtaskTable');
            const emptySubtasks = Array.from(subtaskTable.querySelectorAll('tbody tr')).filter(row => {
                return !row.querySelector('input').value.trim();
            });
            emptySubtasks.forEach(row => row.remove());
            
            // Update the task and storage
            const taskRow = document.querySelector('#subtaskModal').taskRow;
            if (taskRow) {
                const subtasksButton = taskRow.querySelector('.action-btn');
                updateSubtasks(taskRow, subtasksButton);
            }
            
            subtaskModal.style.display = 'none';
        }
    });
}

// Task Management Functions
function addNewTask() {
    const taskInput = document.getElementById('taskInput');
    const infoInput = document.getElementById('infoInput');
    const toolInput = document.getElementById('toolInput');
    const chInput = document.getElementById('chInput');
    const typeDropdown = document.getElementById('typeDropdown');
    const statusDropdown = document.getElementById('statusDropdown');
    const priorityDropdown = document.getElementById('priorityDropdown');
    const alarmTime = document.getElementById('alarmTime');

    if (!taskInput.value.trim()) {
        alert('Task name is required!');
        return;
    }

    // Get current time in ISO format
    const now = new Date();
    const created = now.toISOString();

    const taskRow = createTaskRow(
        taskInput.value,
        infoInput.value,
        toolInput.value,
        chInput.value,
        typeDropdown.value || '',
        statusDropdown.value || 'Not Started',
        priorityDropdown.value || 'Low',
        created,
        alarmTime.value,
        [],
        { text: '', images: [] }
    );

    taskTable.querySelector('tbody').appendChild(taskRow);
    updateLocalStorage();

    // Clear inputs
    [taskInput, infoInput, toolInput, chInput, typeDropdown, statusDropdown, priorityDropdown, alarmTime]
        .forEach(input => input.value = '');
}

function createTaskRow(task, info, tool, ch, type, status, priority, created, alarm, subtasks, notes) {
    const tr = document.createElement('tr');
    tr.dataset.originalIndex = document.querySelectorAll('tbody tr').length;
    tr.dataset.subtasks = JSON.stringify(subtasks || []);
    
    // Ensure notes object has the correct structure before storing
    const normalizedNotes = {
        text: (notes && notes.text) || '',
        images: (notes && Array.isArray(notes.images)) ? notes.images : []
    };
    tr.dataset.notes = JSON.stringify(normalizedNotes);

    const cells = [
        createEditableCell('task', task),
        createEditableCell('info', info),
        createEditableCell('tool', tool),
        createEditableCell('ch', ch),
        createTypeCell(type),
        createStatusCell(status),
        createPriorityCell(priority),
        createEditableTimeCell('created', created, 'datetime-local'),
        createEditableTimeCell('alarm', alarm, 'time'),
        createActionsCell()
    ];

    cells.forEach((cell, index) => {
        const td = document.createElement('td');
        if (cell.element) {
            td.appendChild(cell.element);
        } else {
            const input = document.createElement('input');
            input.type = cell.type || 'text';
            input.value = cell.displayValue || cell.text;
            input.className = 'task-input';
            if (index === 7) {
                input.readOnly = true;
                input.dataset.fullDate = cell.text;
            }
            input.addEventListener('input', () => updateLocalStorage());
            setCellInputStyle(input);
            td.appendChild(input);
        }
        tr.appendChild(td);
    });

    return tr;
}

function createEditableCell(type, value) {
    return { text: value || '' };
}

function createTypeCell(value) {
    const select = document.createElement('select');
    ['', 'SW', 'HK'].forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type || 'Type';
        select.appendChild(option);
    });
    select.value = value;
    select.addEventListener('change', () => updateLocalStorage());
    setCellSelectStyle(select);
    return { element: select };
}

function createStatusCell(value) {
    const select = document.createElement('select');
    ['Not Started', 'In Progress', 'Completed', 'Wait'].forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        select.appendChild(option);
    });
    select.value = value;
    select.className = `status-${value.toLowerCase().replace(' ', '-')}`;
    select.addEventListener('change', (e) => {
        e.target.className = `status-${e.target.value.toLowerCase().replace(' ', '-')}`;
        updateLocalStorage();
        const taskRow = e.target.closest('tr');
        const subtasksButton = taskRow.querySelector('.action-btn');
        updateSubtasksButtonText(taskRow, subtasksButton);
    });
    setCellSelectStyle(select);
    return { element: select };
}

function createPriorityCell(value) {
    const select = document.createElement('select');
    ['High', 'Medium', 'Low'].forEach(priority => {
        const option = document.createElement('option');
        option.value = priority;
        option.textContent = priority;
        select.appendChild(option);
    });
    select.value = value;
    select.className = `priority-${value.toLowerCase()}`;
    select.addEventListener('change', (e) => {
        e.target.className = `priority-${e.target.value.toLowerCase()}`;
        updateLocalStorage();
        const taskRow = e.target.closest('tr');
        const subtasksButton = taskRow.querySelector('.action-btn');
        updateSubtasksButtonText(taskRow, subtasksButton);
    });
    setCellSelectStyle(select);
    return { element: select };
}

function createEditableTimeCell(type, value, inputType) {
    if (type === 'created' && value) {
        try {
            const date = new Date(value);
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const displayValue = `${month}/${day} ${hours}:${minutes}`;
            
            const input = document.createElement('input');
            input.type = 'text';
            input.value = displayValue;
            input.readOnly = true;
            input.dataset.fullDate = value;
            input.className = 'task-input';
            setCellInputStyle(input);
            return { element: input };
        } catch (e) {
            return {
                text: value,
                type: inputType
            };
        }
    }
    if (type === 'alarm') {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.width = '100%';
        container.style.position = 'relative';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'task-input';
        input.placeholder = 'HH:mm';
        input.style.width = '100%';
        
        // Set initial value if exists
        if (value) {
            input.value = value;
        }

        // Handle direct input
        input.addEventListener('input', (e) => {
            let val = e.target.value;
            
            // Remove any non-digit characters except colon
            val = val.replace(/[^\d:]/g, '');
            
            // Handle colon input
            if (val.length === 2 && !val.includes(':')) {
                val += ':';
                e.target.value = val;
                // Move cursor after the colon
                e.target.setSelectionRange(3, 3);
            }
            
            // Parse hours and minutes
            let [hours, minutes] = val.split(':');
            
            // Handle hours
            if (hours && hours.length) {
                hours = parseInt(hours, 10);
                if (hours > 23) hours = 23;
                hours = String(hours).padStart(2, '0');
            }
            
            // Handle minutes
            if (minutes && minutes.length) {
                minutes = parseInt(minutes, 10);
                if (minutes > 59) minutes = 59;
                minutes = String(minutes).padStart(2, '0');
            }
            
            // Format the final value
            if (hours && minutes) {
                e.target.value = `${hours}:${minutes}`;
            } else if (hours) {
                e.target.value = hours + (val.includes(':') ? ':' : '');
            } else {
                e.target.value = val;
            }
            
            updateLocalStorage();
        });

        // Validate on blur
        input.addEventListener('blur', (e) => {
            const val = e.target.value;
            if (val && !val.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
                e.target.value = '';
            }
            updateLocalStorage();
        });

        setCellInputStyle(input);
        container.appendChild(input);
        return { element: container };
    }
    return { 
        text: value || '', 
        type: inputType
    };
}

function createActionsCell() {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '5px';

    const subtasksBtn = document.createElement('button');
    subtasksBtn.textContent = '+Subtask';
    subtasksBtn.className = 'action-btn';
    subtasksBtn.onclick = () => openSubtaskModal(subtasksBtn.closest('tr'), subtasksBtn);

    const notesBtn = document.createElement('button');
    notesBtn.innerHTML = '<i class="fas fa-sticky-note"></i>';
    notesBtn.className = 'action-btn notes-btn';
    notesBtn.title = 'Task Notes';
    notesBtn.onclick = () => openNotesModal(notesBtn.closest('tr'));

    // Check for notes content and apply highlight
    const taskRow = notesBtn.closest('tr');
    if (taskRow) {
        const notes = JSON.parse(taskRow.dataset.notes || '{ "text": "", "images": [] }');
        if ((notes.text && notes.text.trim() !== '') || (notes.images && notes.images.length > 0)) {
            notesBtn.classList.add('has-notes');
        }
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.onclick = () => {
        if (confirm('Are you sure you want to delete this task?')) {
            deleteBtn.closest('tr').remove();
            updateLocalStorage();
        }
    };

    container.appendChild(subtasksBtn);
    container.appendChild(notesBtn);
    container.appendChild(deleteBtn);
    return { element: container };
}

// Subtask Management
function openSubtaskModal(taskRow, subtasksButton) {
    const subtasks = JSON.parse(taskRow.dataset.subtasks || '[]');
    const subtaskTable = document.getElementById('subtaskTable').querySelector('tbody');
    subtaskTable.innerHTML = '';
    
    // Store reference to taskRow for updates
    document.querySelector('#subtaskModal').taskRow = taskRow;

    subtasks.forEach(subtask => {
        const row = createSubtaskRow(subtask);
        subtaskTable.appendChild(row);
    });

    // Sort subtasks initially
    sortSubtasksByCompletion();

    const addSubtaskBtn = document.getElementById('addSubtaskBtn');
    addSubtaskBtn.onclick = () => {
        const row = createSubtaskRow({ name: '', status: 'Not Started', priority: 'Low' });
        subtaskTable.appendChild(row);
        updateSubtasks(taskRow, subtasksButton);
        // Focus on the new input
        const input = row.querySelector('input');
        if (input) input.focus();
    };

    subtaskModal.style.display = 'block';
    updateSubtasksButtonText(taskRow, subtasksButton);
}

function createSubtaskRow(subtask) {
    const tr = document.createElement('tr');
    tr.draggable = true;
    tr.addEventListener('dragstart', handleDragStart);
    tr.addEventListener('dragover', handleDragOver);
    tr.addEventListener('drop', handleDrop);
    tr.addEventListener('dragend', handleDragEnd);
    
    // Reorder cell with up/down arrows
    const reorderCell = document.createElement('td');
    reorderCell.style.cursor = 'move';
    const arrowContainer = document.createElement('div');
    arrowContainer.style.display = 'flex';
    arrowContainer.style.flexDirection = 'column';
    arrowContainer.style.alignItems = 'center';
    arrowContainer.style.gap = '2px';

    const upArrow = document.createElement('button');
    upArrow.innerHTML = '↑';
    upArrow.className = 'arrow-btn';
    upArrow.onclick = (e) => {
        e.stopPropagation();
        const prevRow = tr.previousElementSibling;
        if (prevRow) {
            tr.parentNode.insertBefore(tr, prevRow);
            updateSubtasks(document.querySelector('#subtaskModal').taskRow, null);
        }
    };

    const downArrow = document.createElement('button');
    downArrow.innerHTML = '↓';
    downArrow.className = 'arrow-btn';
    downArrow.onclick = (e) => {
        e.stopPropagation();
        const nextRow = tr.nextElementSibling;
        if (nextRow) {
            tr.parentNode.insertBefore(nextRow, tr);
            updateSubtasks(document.querySelector('#subtaskModal').taskRow, null);
        }
    };

    arrowContainer.appendChild(upArrow);
    arrowContainer.appendChild(downArrow);
    reorderCell.appendChild(arrowContainer);
    
    // Name cell
    const nameCell = document.createElement('td');
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = subtask.name;
    nameInput.className = 'task-input';
    nameInput.addEventListener('input', () => {
        const taskRow = document.querySelector('#subtaskModal').taskRow;
        const subtasksButton = taskRow.querySelector('.action-btn');
        updateSubtasks(taskRow, subtasksButton);
    });
    // Add enter key support
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const addSubtaskBtn = document.getElementById('addSubtaskBtn');
            addSubtaskBtn.click();
            // Focus on the new input after a short delay to allow DOM update
            setTimeout(() => {
                const lastInput = document.getElementById('subtaskTable')
                    .querySelector('tbody')
                    .lastElementChild
                    .querySelector('input');
                lastInput?.focus();
            }, 50);
        }
    });
    nameCell.appendChild(nameInput);

    // Status cell with immediate updates
    const statusCell = document.createElement('td');
    const statusSelect = document.createElement('select');
    ['Not Started', 'In Progress', 'Completed', 'Wait'].forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        statusSelect.appendChild(option);
    });
    statusSelect.value = subtask.status;
    statusSelect.className = `status-${subtask.status.toLowerCase().replace(' ', '-')}`;
    statusSelect.addEventListener('change', (e) => {
        const newStatus = e.target.value;
        e.target.className = `status-${newStatus.toLowerCase().replace(' ', '-')}`;
        const taskRow = document.querySelector('#subtaskModal').taskRow;
        const subtasksButton = taskRow.querySelector('.action-btn');
        updateSubtasks(taskRow, subtasksButton);
        sortSubtasksByCompletion();
    });
    statusCell.appendChild(statusSelect);

    // Priority cell with immediate updates
    const priorityCell = document.createElement('td');
    const prioritySelect = document.createElement('select');
    ['High', 'Medium', 'Low'].forEach(priority => {
        const option = document.createElement('option');
        option.value = priority;
        option.textContent = priority;
        prioritySelect.appendChild(option);
    });
    prioritySelect.value = subtask.priority;
    prioritySelect.className = `priority-${subtask.priority.toLowerCase()}`;
    prioritySelect.addEventListener('change', (e) => {
        e.target.className = `priority-${e.target.value.toLowerCase()}`;
        const taskRow = document.querySelector('#subtaskModal').taskRow;
        const subtasksButton = taskRow.querySelector('.action-btn');
        updateSubtasks(taskRow, subtasksButton);
    });
    priorityCell.appendChild(prioritySelect);

    // Actions cell
    const actionsCell = document.createElement('td');
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.onclick = () => {
        tr.remove();
        const taskRow = document.querySelector('#subtaskModal').taskRow;
        const subtasksButton = taskRow.querySelector('.action-btn');
        updateSubtasks(taskRow, subtasksButton);
        
        // Check if all subtasks are deleted
        const remainingSubtasks = document.getElementById('subtaskTable').querySelectorAll('tbody tr');
        if (remainingSubtasks.length === 0) {
            subtasksButton.textContent = '+Subtask';
        }
    };
    actionsCell.appendChild(deleteBtn);

    tr.appendChild(reorderCell);
    tr.appendChild(nameCell);
    tr.appendChild(statusCell);
    tr.appendChild(priorityCell);
    tr.appendChild(actionsCell);

    return tr;
}

function updateSubtasks(taskRow, subtasksButton) {
    const subtasks = Array.from(document.getElementById('subtaskTable').querySelectorAll('tbody tr')).map(row => ({
        name: row.querySelector('input').value,
        status: row.querySelector('select').value,
        priority: row.querySelectorAll('select')[1].value
    }));

    taskRow.dataset.subtasks = JSON.stringify(subtasks);
    if (subtasksButton) {
        updateSubtasksButtonText(taskRow, subtasksButton);
    }
    updateLocalStorage();
    refreshTaskRow(taskRow);
}

function updateSubtasksButtonText(taskRow, button) {
    const subtasks = JSON.parse(taskRow.dataset.subtasks || '[]');
    const activeSubtasks = subtasks.filter(s => s.status !== 'Completed');
    
    if (subtasks.length === 0) {
        button.textContent = '+Subtask';
        return;
    }

    // Find the first non-completed subtask, or use the first subtask if all are completed
    const firstSubtask = activeSubtasks.length > 0 ? activeSubtasks[0] : subtasks[0];
    const firstSubtaskName = firstSubtask.name.substring(0, 8);
    
    // Only count non-completed subtasks in the counter
    const additionalCount = activeSubtasks.length - 1;
    button.textContent = firstSubtaskName + (additionalCount > 0 ? ` (+${additionalCount})` : '');
}

// Filtering and Sorting Functions
function showAllTasks() {
    const rows = taskTable.querySelectorAll('tbody tr');
    rows.forEach(row => row.style.display = '');
    updateActiveFilterButton('All');
}

function filterTasksByStatus(status) {
    const rows = taskTable.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const taskStatus = row.querySelectorAll('select')[1].value;
        row.style.display = taskStatus === status ? '' : 'none';
    });
    updateActiveFilterButton(status);
}

function updateActiveFilterButton(status) {
    document.querySelectorAll('.filter-buttons button').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === status);
    });
}

function sortByColumn(colIndex) {
    const tbody = taskTable.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    sortOrders[colIndex] = sortOrders[colIndex] === 'asc' ? 'desc' : 'asc';
    
    rows.sort((a, b) => {
        let aVal, bVal;
        
        if (colIndex === 7) { // Created date column
            aVal = new Date(a.children[colIndex].querySelector('input').dataset.fullDate);
            bVal = new Date(b.children[colIndex].querySelector('input').dataset.fullDate);
        } else if (colIndex === 5) { // Status column
            const statusOrder = { 'Not Started': 0, 'In Progress': 1, 'Wait': 2, 'Completed': 3 };
            aVal = statusOrder[a.children[colIndex].querySelector('select').value] || 0;
            bVal = statusOrder[b.children[colIndex].querySelector('select').value] || 0;
        } else if (colIndex === 6) { // Priority column
            const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
            aVal = priorityOrder[a.children[colIndex].querySelector('select').value] || 0;
            bVal = priorityOrder[b.children[colIndex].querySelector('select').value] || 0;
        } else {
            aVal = a.children[colIndex].querySelector('input, select')?.value || a.children[colIndex].textContent;
            bVal = b.children[colIndex].querySelector('input, select')?.value || b.children[colIndex].textContent;
        }
        
        if (aVal < bVal) return sortOrders[colIndex] === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrders[colIndex] === 'asc' ? 1 : -1;
        return 0;
    });
    
    rows.forEach(row => tbody.appendChild(row));
}

function sortTasksByPriority() {
    const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
    const tbody = taskTable.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    rows.sort((a, b) => {
        const aPriority = a.querySelector('select:nth-of-type(2)').value;
        const bPriority = b.querySelector('select:nth-of-type(2)').value;
        return priorityOrder[aPriority] - priorityOrder[bPriority];
    });
    
    rows.forEach(row => tbody.appendChild(row));
}

function sortTasksByCreated() {
    sortByColumn(7);
}

// Add new function to sort subtasks
function sortSubtasksByCompletion() {
    const subtaskTable = document.getElementById('subtaskTable').querySelector('tbody');
    const rows = Array.from(subtaskTable.querySelectorAll('tr'));
    
    // First, separate completed and non-completed tasks
    const completedTasks = rows.filter(row => row.querySelector('select').value === 'Completed');
    const activeTasks = rows.filter(row => row.querySelector('select').value !== 'Completed');
    
    // Clear the table
    subtaskTable.innerHTML = '';
    
    // Add active tasks in their original order
    activeTasks.forEach(row => subtaskTable.appendChild(row));
    
    // Add completed tasks at the bottom
    completedTasks.forEach(row => subtaskTable.appendChild(row));
}

// Storage Functions
function updateLocalStorage() {
    const tasks = Array.from(taskTable.querySelectorAll('tbody tr')).map(row => ({
        task: row.querySelector('input').value,
        info: row.querySelectorAll('input')[1].value,
        tool: row.querySelectorAll('input')[2].value,
        ch: row.querySelectorAll('input')[3].value,
        type: row.querySelector('select').value,
        status: row.querySelectorAll('select')[1].value,
        priority: row.querySelectorAll('select')[2].value,
        created: row.querySelectorAll('input')[4].value || new Date().toISOString(),
        alarm: row.querySelectorAll('input')[5].value || '',
        subtasks: JSON.parse(row.dataset.subtasks || '[]'),
        notes: JSON.parse(row.dataset.notes || '{ "text": "", "images": [] }')
    }));
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    refreshAllTasks();
}

function loadTasksFromStorage() {
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const tbody = taskTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    tasks.forEach(task => {
        // Ensure notes object has the correct structure
        const notes = task.notes || { text: '', images: [] };
        if (typeof notes === 'string') {
            try {
                notes = JSON.parse(notes);
            } catch (e) {
                notes = { text: notes, images: [] };
            }
        }
        if (!notes.images) {
            notes.images = [];
        }
        
        const row = createTaskRow(
            task.task,
            task.info,
            task.tool,
            task.ch,
            task.type,
            task.status,
            task.priority,
            task.created,
            task.alarm,
            task.subtasks,
            notes  // Pass the properly structured notes object
        );
        tbody.appendChild(row);
    });
    refreshAllTasks();
}

// Export Function
function exportTasksToCSV() {
    const rows = Array.from(taskTable.querySelectorAll('tbody tr'));
    const headers = ['Task', 'Info', 'Tool', 'CH', 'Type', 'Status', 'Priority', 'Created', 'Alarm', 'Subtasks', 'Notes'];
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => {
            const notes = JSON.parse(row.dataset.notes || '{ "text": "", "images": [] }');
            const values = [
                row.querySelector('input').value,
                row.querySelectorAll('input')[1].value,
                row.querySelectorAll('input')[2].value,
                row.querySelectorAll('input')[3].value,
                row.querySelector('select').value,
                row.querySelectorAll('select')[1].value,
                row.querySelectorAll('select')[2].value,
                row.children[7].textContent,
                row.children[8].querySelector('input').value,
                JSON.parse(row.dataset.subtasks || '[]').map(s => s.name).join(';'),
                notes.text
            ].map(val => `"${val.replace(/"/g, '""')}"`);
            return values.join(',');
        })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `task_logger_export_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
}

// Import Function
function importTasksFromCSV(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split('\n');
        
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            // Parse the CSV line, handling quoted values correctly
            const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
                .map(val => val.replace(/^"(.*)"$/, '$1').replace(/""/g, '"'));
            
            // Create subtasks array from semicolon-separated list
            const subtaskNames = values[9] ? values[9].split(';') : [];
            const subtasks = subtaskNames.map(name => ({
                name: name,
                status: 'Not Started',
                priority: 'Low'
            }));

            // Parse notes and images
            const notesText = values[10] || '';
            const images = values[11] ? values[11].split(';') : [];
            const notes = {
                text: notesText,
                images: images.filter(img => img) // Filter out empty strings
            };

            // Create new task row
            const taskRow = createTaskRow(
                values[0] || '',        // Task
                values[1] || '',        // Info
                values[2] || '',        // Tool
                values[3] || '',        // CH
                values[4] || '',        // Type
                values[5] || 'Not Started', // Status
                values[6] || 'Low',     // Priority
                values[7] ? new Date().toISOString() : new Date().toISOString(), // Created
                values[8] || '',        // Alarm
                subtasks,               // Subtasks
                notes                   // Notes and images
            );

            taskTable.querySelector('tbody').appendChild(taskRow);
        }
        
        // Update storage and clear the input
        updateLocalStorage();
        input.value = '';
    };
    
    reader.readAsText(file);
}

// Utility Functions
function setCellInputStyle(input) {
    input.style.backgroundColor = 'transparent';
    input.style.border = 'none';
    input.style.color = 'inherit';
    input.style.width = '100%';
    if (input.type === 'time') {
        input.style.webkitAppearance = 'none';
        input.style.mozAppearance = 'textfield';
    }
}

function setCellSelectStyle(select) {
    select.style.backgroundColor = '#000000';
    select.style.border = 'none';
    select.style.color = '#ffffff';
    select.style.width = '100%';
    select.style.cursor = 'pointer';
    select.style.appearance = 'auto';
    select.style.padding = '2px';

    // Style the options within the select
    const options = select.getElementsByTagName('option');
    for (let option of options) {
        option.style.backgroundColor = '#000000';
        option.style.color = '#ffffff';
    }
}

// Add type filtering function
function filterTasksByType(type) {
    const rows = taskTable.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const taskType = row.querySelector('select').value;
        row.style.display = taskType === type ? '' : 'none';
    });
    updateActiveFilterButton(type);
}

// Clear all tasks function
function clearAllTasks() {
    const visibleRows = Array.from(taskTable.querySelectorAll('tbody tr')).filter(row => row.style.display !== 'none');
    
    if (visibleRows.length === 0) {
        alert('No tasks to clear!');
        return;
    }

    if (confirm('Are you sure you want to delete all visible tasks? This action cannot be undone.')) {
        visibleRows.forEach(row => row.remove());
        updateLocalStorage();
    }
}

// Add these new drag-and-drop handler functions
let draggedRow = null;
let draggedRowIndex = null;

function handleDragStart(e) {
    draggedRow = e.target.closest('tr');
    draggedRowIndex = Array.from(draggedRow.parentNode.children).indexOf(draggedRow);
    e.target.style.opacity = '0.4';
    e.target.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    const row = e.target.closest('tr');
    if (!row || row === draggedRow) return;
    
    const rect = row.getBoundingClientRect();
    const midpoint = (rect.top + rect.bottom) / 2;
    const insertBefore = e.clientY < midpoint;
    
    if (insertBefore) {
        row.style.borderTop = '2px solid #4a9eff';
        row.style.borderBottom = '';
    } else {
        row.style.borderBottom = '2px solid #4a9eff';
        row.style.borderTop = '';
    }
}

function handleDrop(e) {
    e.preventDefault();
    const row = e.target.closest('tr');
    if (!row || row === draggedRow) return;
    
    const rect = row.getBoundingClientRect();
    const midpoint = (rect.top + rect.bottom) / 2;
    const insertBefore = e.clientY < midpoint;
    
    if (insertBefore) {
        row.parentNode.insertBefore(draggedRow, row);
    } else {
        row.parentNode.insertBefore(draggedRow, row.nextSibling);
    }
    
    // Clear any remaining drag styling
    clearDragStyles();
    
    // Update subtasks order
    const taskRow = document.querySelector('#subtaskModal').taskRow;
    updateSubtasks(taskRow, null);
}

function handleDragEnd() {
    if (draggedRow) {
        draggedRow.style.opacity = '';
        draggedRow.classList.remove('dragging');
        draggedRow = null;
        draggedRowIndex = null;
        clearDragStyles();
    }
}

function clearDragStyles() {
    const rows = document.querySelectorAll('#subtaskTable tbody tr');
    rows.forEach(row => {
        row.style.borderTop = '';
        row.style.borderBottom = '';
    });
}

// Add new functions for notes handling
function openNotesModal(taskRow) {
    // Create modal if it doesn't exist
    let notesModal = document.getElementById('notesModal');
    if (!notesModal) {
        notesModal = document.createElement('div');
        notesModal.id = 'notesModal';
        notesModal.className = 'modal';
        notesModal.innerHTML = `
            <div class="modal-content" style="width: 80%; max-width: 800px;">
                <div class="modal-header" style="background-color: #1a1a1a;">
                    <h2>Task Notes</h2>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 5px; color: #888;">Tip: You can paste images directly using Ctrl+V</div>
                    <textarea id="notesText" placeholder="Enter your notes here... (Ctrl+V to paste images)" style="width: 100%; min-height: 200px; margin-bottom: 10px; background: #1a1a1a; color: white; border: 1px solid #333;"></textarea>
                    <div id="imagePreviewContainer" style="display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0; max-height: 400px; overflow-y: auto;"></div>
                    <div style="display: flex; gap: 10px;">
                        <input type="file" id="imageInput" accept="image/*" style="display: none;">
                        <button onclick="document.getElementById('imageInput').click()" class="action-btn">Add Image</button>
                        <button id="clearNotesBtn" class="action-btn delete-btn">Clear Notes</button>
                        <button id="saveNotesBtn" class="action-btn">Save Notes</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(notesModal);

        // Add event listeners - only add these once when creating the modal
        const closeBtn = notesModal.querySelector('.close');
        closeBtn.onclick = () => {
            saveNotes(notesModal.taskRow);
            notesModal.style.display = 'none';
        };

        window.onclick = (e) => {
            if (e.target === notesModal) {
                saveNotes(notesModal.taskRow);
                notesModal.style.display = 'none';
            }
        };

        const imageInput = document.getElementById('imageInput');
        imageInput.onchange = (e) => handleImageUpload(e, notesModal.taskRow);

        const saveBtn = document.getElementById('saveNotesBtn');
        saveBtn.onclick = () => {
            saveNotes(notesModal.taskRow);
            notesModal.style.display = 'none';
        };

        // Add clear notes button functionality
        const clearBtn = document.getElementById('clearNotesBtn');
        clearBtn.onclick = () => {
            if (confirm('Are you sure you want to clear all notes and images? This cannot be undone.')) {
                const textarea = document.getElementById('notesText');
                textarea.value = '';
                const previewContainer = document.getElementById('imagePreviewContainer');
                previewContainer.innerHTML = '';
                
                // Clear the data in taskRow
                const notes = { text: '', images: [] };
                notesModal.taskRow.dataset.notes = JSON.stringify(notes);
                
                // Update the notes icon state
                const notesBtn = notesModal.taskRow.querySelector('.notes-btn');
                if (notesBtn) {
                    notesBtn.classList.remove('has-notes');
                }
                
                updateLocalStorage();
            }
        };

        // Add clipboard paste event listener to the textarea
        const textarea = document.getElementById('notesText');
        textarea.addEventListener('paste', (e) => handlePaste(e, notesModal.taskRow));
    }

    // Update taskRow reference and load notes
    notesModal.taskRow = taskRow;
    
    // Load existing notes
    const notes = JSON.parse(taskRow.dataset.notes || '{ "text": "", "images": [] }');
    const textarea = document.getElementById('notesText');
    textarea.value = notes.text || '';  // Ensure we handle null/undefined text
    
    // Display existing images
    const previewContainer = document.getElementById('imagePreviewContainer');
    previewContainer.innerHTML = '';
    if (notes.images && Array.isArray(notes.images)) {  // Add safety check for images array
        notes.images.forEach((imgData, index) => {
            const imgContainer = document.createElement('div');
            imgContainer.style.position = 'relative';
            imgContainer.style.width = '200px';
            imgContainer.style.height = '200px';
            imgContainer.style.display = 'flex';
            imgContainer.style.alignItems = 'center';
            imgContainer.style.justifyContent = 'center';
            imgContainer.style.border = '1px solid #333';
            
            const img = document.createElement('img');
            img.src = imgData;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            img.style.objectFit = 'contain';
            
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '&times;';
            removeBtn.style.position = 'absolute';
            removeBtn.style.top = '5px';
            removeBtn.style.right = '5px';
            removeBtn.style.border = 'none';
            removeBtn.style.color = 'white';
            removeBtn.style.cursor = 'pointer';
            removeBtn.style.borderRadius = '50%';
            removeBtn.style.width = '20px';
            removeBtn.style.height = '20px';
            removeBtn.style.display = 'flex';
            removeBtn.style.alignItems = 'center';
            removeBtn.style.justifyContent = 'center';
            removeBtn.style.background = 'rgba(0, 0, 0, 0.5)';
            removeBtn.onclick = () => {
                const notes = JSON.parse(taskRow.dataset.notes);
                notes.images.splice(index, 1);
                taskRow.dataset.notes = JSON.stringify(notes);
                imgContainer.remove();
                updateLocalStorage();
                
                // Update notes icon if no content left
                if (notes.images.length === 0 && (!notes.text || notes.text.trim() === '')) {
                    const notesBtn = taskRow.querySelector('.notes-btn');
                    if (notesBtn) {
                        notesBtn.classList.remove('has-notes');
                    }
                }
            };
            
            imgContainer.appendChild(img);
            imgContainer.appendChild(removeBtn);
            previewContainer.appendChild(imgContainer);
        });
    }

    notesModal.style.display = 'block';
}

function handleImageUpload(event, taskRow) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const notes = JSON.parse(taskRow.dataset.notes || '{ "text": "", "images": [] }');
        notes.images.push(e.target.result);
        taskRow.dataset.notes = JSON.stringify(notes);
        
        // Add preview
        const previewContainer = document.getElementById('imagePreviewContainer');
        const imgContainer = document.createElement('div');
        imgContainer.style.position = 'relative';
        imgContainer.innerHTML = `
            <img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border: 1px solid #333;">
            <button onclick="removeImage(${notes.images.length - 1})" style="position: absolute; top: 5px; right: 5px; border: none; color: white; cursor: pointer; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; background: transparent;">&times;</button>
        `;
        previewContainer.appendChild(imgContainer);
        
        updateLocalStorage();
    };
    reader.readAsDataURL(file);
}

function removeImage(index) {
    const notesModal = document.getElementById('notesModal');
    const taskRow = notesModal.taskRow;
    const notes = JSON.parse(taskRow.dataset.notes);
    notes.images.splice(index, 1);
    taskRow.dataset.notes = JSON.stringify(notes);
    
    // Refresh the image preview
    const previewContainer = document.getElementById('imagePreviewContainer');
    previewContainer.innerHTML = '';
    notes.images.forEach((imgData, idx) => {
        const imgContainer = document.createElement('div');
        imgContainer.style.position = 'relative';
        imgContainer.innerHTML = `
            <img src="${imgData}" style="max-width: 200px; max-height: 200px; border: 1px solid #333;">
            <button onclick="removeImage(${idx})" style="position: absolute; top: 5px; right: 5px; border: none; color: white; cursor: pointer; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; background: transparent;">&times;</button>
        `;
        previewContainer.appendChild(imgContainer);
    });
    
    updateLocalStorage();
}

function saveNotes(taskRow) {
    if (!taskRow) return;  // Add safety check
    
    const notes = JSON.parse(taskRow.dataset.notes || '{ "text": "", "images": [] }');
    const textarea = document.getElementById('notesText');
    notes.text = textarea ? textarea.value : '';  // Add safety check for textarea
    taskRow.dataset.notes = JSON.stringify(notes);
    updateLocalStorage();
    refreshTaskRow(taskRow);
}

// Add new function to handle clipboard paste events
function handlePaste(event, taskRow) {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    
    for (const item of items) {
        if (item.type.indexOf('image') === 0) {
            event.preventDefault();
            const blob = item.getAsFile();
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const notes = JSON.parse(taskRow.dataset.notes || '{ "text": "", "images": [] }');
                notes.images.push(e.target.result);
                taskRow.dataset.notes = JSON.stringify(notes);
                
                // Add preview
                const previewContainer = document.getElementById('imagePreviewContainer');
                const imgContainer = document.createElement('div');
                imgContainer.style.position = 'relative';
                imgContainer.innerHTML = `
                    <img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border: 1px solid #333;">
                    <button onclick="removeImage(${notes.images.length - 1})" style="position: absolute; top: 5px; right: 5px; border: none; color: white; cursor: pointer; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; background: transparent;">&times;</button>
                `;
                previewContainer.appendChild(imgContainer);
                
                updateLocalStorage();
            };
            reader.readAsDataURL(blob);
            break;
        }
    }
}

function refreshTaskRow(taskRow) {
    if (!taskRow) return;

    // Update subtasks button
    const subtasksBtn = taskRow.querySelector('.action-btn');
    if (subtasksBtn) {
        updateSubtasksButtonText(taskRow, subtasksBtn);
    }

    // Update notes button highlight
    const notesBtn = taskRow.querySelector('.notes-btn');
    if (notesBtn) {
        const notes = JSON.parse(taskRow.dataset.notes || '{ "text": "", "images": [] }');
        if ((notes.text && notes.text.trim() !== '') || (notes.images && notes.images.length > 0)) {
            notesBtn.classList.add('has-notes');
        } else {
            notesBtn.classList.remove('has-notes');
        }
    }

    // Update status cell styling
    const statusSelect = taskRow.querySelectorAll('select')[1];
    if (statusSelect) {
        statusSelect.className = `status-${statusSelect.value.toLowerCase().replace(' ', '-')}`;
    }

    // Update priority cell styling
    const prioritySelect = taskRow.querySelectorAll('select')[2];
    if (prioritySelect) {
        prioritySelect.className = `priority-${prioritySelect.value.toLowerCase()}`;
    }
}

function refreshAllTasks() {
    const taskRows = document.querySelectorAll('#taskTable tbody tr');
    taskRows.forEach(taskRow => refreshTaskRow(taskRow));
} 