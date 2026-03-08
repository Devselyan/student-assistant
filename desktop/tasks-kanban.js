// Student Assistant Pro - Tasks Kanban Module
// Advanced task management with Kanban board

const TasksKanban = {
  // Default columns
  defaultColumns: [
    { id: 'todo', name: 'To Do', color: '#667eea', icon: '📋' },
    { id: 'inprogress', name: 'In Progress', color: '#ed8936', icon: '🔄' },
    { id: 'review', name: 'Review', color: '#4299e1', icon: '👀' },
    { id: 'done', name: 'Done', color: '#48bb78', icon: '✅' }
  ],

  // Create a new task
  createTask(title, options = {}) {
    return {
      id: options.id || `task-${Date.now()}`,
      title,
      description: options.description || '',
      status: options.status || 'todo',
      priority: options.priority || 'medium',
      dueDate: options.dueDate || null,
      dueTime: options.dueTime || null,
      classId: options.classId || null,
      tags: options.tags || [],
      subtasks: options.subtasks || [],
      attachments: options.attachments || [],
      notes: options.notes || '',
      estimatedHours: options.estimatedHours || null,
      actualHours: options.actualHours || null,
      parentId: options.parentId || null,
      order: options.order || 0,
      createdAt: options.createdAt || new Date().toISOString(),
      updatedAt: options.updatedAt || new Date().toISOString(),
      completedAt: options.completedAt || null,
      startedAt: options.startedAt || null,
      reminder: options.reminder || null,
      recurring: options.recurring || null,
      customFields: options.customFields || {}
    };
  },

  // Create a subtask
  createSubtask(title, options = {}) {
    return {
      id: options.id || `subtask-${Date.now()}`,
      title,
      completed: options.completed || false,
      completedAt: options.completedAt || null,
      order: options.order || 0
    };
  },

  // Create a new column
  createColumn(name, options = {}) {
    return {
      id: options.id || `column-${Date.now()}`,
      name,
      color: options.color || '#667eea',
      icon: options.icon || '📋',
      order: options.order || 0,
      hidden: options.hidden || false,
      wipLimit: options.wipLimit || null,
      createdAt: new Date().toISOString()
    };
  },

  // Create a new board
  createBoard(name, options = {}) {
    return {
      id: options.id || `board-${Date.now()}`,
      name,
      description: options.description || '',
      columns: options.columns || [...this.defaultColumns],
      tasks: [],
      settings: {
        showSubtasks: true,
        showDueDates: true,
        showPriority: true,
        showEstimatedTime: true,
        groupByClass: false,
        filterByPriority: null
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  // Move task to different column
  moveTask(tasks, taskId, newStatus, newPosition = 0) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return tasks;

    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: newStatus,
          order: newPosition,
          updatedAt: new Date().toISOString(),
          startedAt: newStatus === 'inprogress' && !t.startedAt 
            ? new Date().toISOString() 
            : t.startedAt,
          completedAt: newStatus === 'done' && !t.completedAt 
            ? new Date().toISOString() 
            : t.completedAt
        };
      }
      return t;
    });

    // Reorder other tasks in the column
    updatedTasks
      .filter(t => t.status === newStatus && t.id !== taskId)
      .forEach((t, index) => {
        if (t.order >= newPosition) {
          t.order = t.order + 1;
        }
      });

    return updatedTasks;
  },

  // Update task
  updateTask(tasks, taskId, updates) {
    return tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });
  },

  // Delete task
  deleteTask(tasks, taskId) {
    // Also delete subtasks
    const deleteIds = [taskId];
    tasks.forEach(t => {
      if (t.parentId === taskId) {
        deleteIds.push(t.id);
      }
    });
    return tasks.filter(t => !deleteIds.includes(t.id));
  },

  // Toggle subtask completion
  toggleSubtask(tasks, taskId, subtaskId) {
    return tasks.map(t => {
      if (t.id === taskId) {
        const updatedSubtasks = t.subtasks.map(st => {
          if (st.id === subtaskId) {
            return {
              ...st,
              completed: !st.completed,
              completedAt: !st.completed ? new Date().toISOString() : null
            };
          }
          return st;
        });
        return {
          ...t,
          subtasks: updatedSubtasks,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });
  },

  // Add subtask to task
  addSubtask(tasks, taskId, subtask) {
    return tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: [...t.subtasks, subtask],
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });
  },

  // Calculate task statistics
  calculateStats(tasks) {
    if (!tasks || tasks.length === 0) {
      return {
        total: 0,
        byStatus: {},
        byPriority: {},
        overdue: 0,
        dueToday: 0,
        dueThisWeek: 0,
        completedToday: 0,
        completionRate: 0,
        averageCompletionTime: 0
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // By status
    const byStatus = {};
    this.defaultColumns.forEach(col => {
      byStatus[col.id] = tasks.filter(t => t.status === col.id).length;
    });

    // By priority
    const byPriority = {
      urgent: tasks.filter(t => t.priority === 'urgent').length,
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length
    };

    // Overdue
    const overdue = tasks.filter(t => {
      if (t.status === 'done' || !t.dueDate) return false;
      return new Date(t.dueDate) < today;
    }).length;

    // Due today
    const dueToday = tasks.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate.getDate() === today.getDate() &&
             dueDate.getMonth() === today.getMonth() &&
             dueDate.getFullYear() === today.getFullYear();
    }).length;

    // Due this week
    const dueThisWeek = tasks.filter(t => {
      if (!t.dueDate || t.status === 'done') return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= today && dueDate <= weekFromNow;
    }).length;

    // Completed today
    const completedToday = tasks.filter(t => {
      if (!t.completedAt) return false;
      const completedDate = new Date(t.completedAt);
      return completedDate.getDate() === today.getDate() &&
             completedDate.getMonth() === today.getMonth() &&
             completedDate.getFullYear() === today.getFullYear();
    }).length;

    // Completion rate
    const completed = tasks.filter(t => t.status === 'done').length;
    const completionRate = tasks.length > 0 
      ? Math.round((completed / tasks.length) * 100) 
      : 0;

    // Average completion time (for tasks with start and end dates)
    const completedTasksWithTime = tasks.filter(t => t.startedAt && t.completedAt);
    let totalCompletionTime = 0;
    completedTasksWithTime.forEach(t => {
      const start = new Date(t.startedAt);
      const end = new Date(t.completedAt);
      totalCompletionTime += (end - start) / (1000 * 60 * 60); // hours
    });
    const averageCompletionTime = completedTasksWithTime.length > 0
      ? Math.round(totalCompletionTime / completedTasksWithTime.length * 10) / 10
      : 0;

    return {
      total: tasks.length,
      byStatus,
      byPriority,
      overdue,
      dueToday,
      dueThisWeek,
      completedToday,
      completionRate,
      averageCompletionTime
    };
  },

  // Get tasks by column
  getByColumn(tasks, columnId) {
    return tasks
      .filter(t => t.status === columnId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  // Get tasks with filters
  filterTasks(tasks, filters = {}) {
    return tasks.filter(task => {
      // Status filter
      if (filters.status && task.status !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }

      // Class filter
      if (filters.classId && task.classId !== filters.classId) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(search);
        const matchesDescription = task.description?.toLowerCase().includes(search);
        const matchesTags = task.tags?.some(t => t.toLowerCase().includes(search));
        if (!matchesTitle && !matchesDescription && !matchesTags) {
          return false;
        }
      }

      // Due date filter
      if (filters.dueDate) {
        if (!task.dueDate) return false;
        if (filters.dueDate === 'overdue') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (new Date(task.dueDate) >= today) return false;
        } else if (filters.dueDate === 'today') {
          const today = new Date();
          const dueDate = new Date(task.dueDate);
          if (dueDate.getDate() !== today.getDate() ||
              dueDate.getMonth() !== today.getMonth() ||
              dueDate.getFullYear() !== today.getFullYear()) {
            return false;
          }
        } else if (filters.dueDate === 'week') {
          const today = new Date();
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          const dueDate = new Date(task.dueDate);
          if (dueDate < today || dueDate > weekFromNow) return false;
        }
      }

      return true;
    });
  },

  // Export board to CSV
  exportToCSV(tasks) {
    let csv = 'ID,Title,Description,Status,Priority,Due Date,Class,Tags,Subtasks,Created At,Completed At\n';
    
    tasks.forEach(task => {
      const escapeCsv = (str) => {
        if (!str) return '';
        const escaped = str.toString().replace(/"/g, '""');
        return `"${escaped}"`;
      };

      const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
      const totalSubtasks = task.subtasks?.length || 0;

      csv += `${task.id},${escapeCsv(task.title)},${escapeCsv(task.description)},${task.status},${task.priority},${task.dueDate || ''},${task.classId || ''},${escapeCsv(task.tags?.join(', ') || '')},${completedSubtasks}/${totalSubtasks},${task.createdAt},${task.completedAt || ''}\n`;
    });

    return csv;
  },

  // Import tasks from CSV
  importFromCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    const tasks = [];

    // Skip header
    const startIndex = lines[0].toLowerCase().includes('id') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = this.parseCSVLine(line);
      
      if (parts.length >= 5) {
        tasks.push(this.createTask(parts[1], {
          id: parts[0],
          description: parts[2],
          status: parts[3],
          priority: parts[4],
          dueDate: parts[5] || null,
          classId: parts[6] || null,
          tags: parts[7] ? parts[7].split(',').map(t => t.trim()) : [],
          createdAt: parts[9] || new Date().toISOString()
        }));
      }
    }

    return tasks;
  },

  // Parse CSV line
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  },

  // Generate task insights
  generateInsights(stats) {
    const insights = [];

    if (stats.overdue > 0) {
      insights.push({
        type: 'danger',
        title: 'Overdue Tasks',
        message: `You have ${stats.overdue} overdue task(s). Prioritize completing these.`
      });
    }

    if (stats.dueToday > 0) {
      insights.push({
        type: 'warning',
        title: 'Due Today',
        message: `${stats.dueToday} task(s) due today. Don't forget to complete them!`
      });
    }

    if (stats.completionRate >= 80) {
      insights.push({
        type: 'success',
        title: 'Great Progress',
        message: `You've completed ${stats.completionRate}% of your tasks!`
      });
    } else if (stats.completionRate < 30) {
      insights.push({
        type: 'info',
        title: 'Getting Started',
        message: 'Focus on completing tasks to build momentum.'
      });
    }

    if (stats.byStatus.inprogress > 5) {
      insights.push({
        type: 'info',
        title: 'Too Many In Progress',
        message: 'Consider finishing some tasks before starting new ones.'
      });
    }

    return insights;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TasksKanban };
}
