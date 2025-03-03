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
});

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

    const taskRow = createTaskRow(
        taskInput.value,
        infoInput.value,
        toolInput.value,
        chInput.value,
        typeDropdown.value || '',
        statusDropdown.value || 'Not Started',
        priorityDropdown.value || 'Low',
        new Date().toISOString(),
        alarmTime.value,
        []
    );

    taskTable.querySelector('tbody').appendChild(taskRow);
    updateLocalStorage();

    // Clear inputs
    [taskInput, infoInput, toolInput, chInput, typeDropdown, statusDropdown, priorityDropdown, alarmTime]
        .forEach(input => input.value = '');
}

function createTaskRow(task, info, tool, ch, type, status, priority, created, alarm, subtasks) {
    const tr = document.createElement('tr');
    tr.dataset.originalIndex = document.querySelectorAll('tbody tr').length;
    tr.dataset.subtasks = JSON.stringify(subtasks || []);

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
            
            return {
                text: value,
                type: 'text',
                displayValue: displayValue
            };
        } catch (e) {
            return {
                text: value,
                type: inputType
            };
        }
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
        const taskStatus = row.querySelector('select').value;
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
        subtasks: JSON.parse(row.dataset.subtasks || '[]')
    }));
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasksFromStorage() {
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const tbody = taskTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    tasks.forEach(task => {
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
            task.subtasks
        );
        tbody.appendChild(row);
    });
}

// Export Function
function exportTasksToCSV() {
    const rows = Array.from(taskTable.querySelectorAll('tbody tr'));
    const headers = ['Task', 'Info', 'Tool', 'CH', 'Type', 'Status', 'Priority', 'Created', 'Alarm', 'Subtasks'];
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => {
            const values = [
                row.querySelector('input').value,
                row.querySelectorAll('input')[1].value,
                row.querySelectorAll('input')[2].value,
                row.querySelectorAll('input')[3].value,
                row.querySelector('select').value,
                row.querySelectorAll('select')[1].value,
                row.querySelectorAll('select')[2].value,
                row.children[7].textContent,
                row.children[8].textContent,
                JSON.parse(row.dataset.subtasks || '[]').map(s => s.name).join(';')
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
                subtasks               // Subtasks
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
