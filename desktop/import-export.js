// Student Assistant Pro - Import/Export Module
// Comprehensive data import, export, and backup functionality

const ImportExport = {
  // Supported export formats
  formats: {
    JSON: 'json',
    CSV: 'csv',
    ICS: 'ics',
    PDF: 'pdf',
    MD: 'md'
  },

  // Export all data
  exportAll(data, format = this.formats.JSON) {
    switch (format) {
      case this.formats.JSON:
        return this.exportJSON(data);
      case this.formats.CSV:
        return this.exportCSV(data);
      case this.formats.ICS:
        return this.exportICS(data);
      default:
        return this.exportJSON(data);
    }
  },

  // Export to JSON
  exportJSON(data) {
    const exportData = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      app: 'Student Assistant Pro',
      data: {
        classes: data.classes || [],
        assignments: data.assignments || [],
        exams: data.exams || [],
        grades: data.grades || [],
        notes: data.notes || [],
        tasks: data.tasks || [],
        flashcards: data.flashcards || [],
        studySessions: data.studySessions || [],
        settings: data.settings || {}
      }
    };

    return JSON.stringify(exportData, null, 2);
  },

  // Export to CSV
  exportCSV(data) {
    let csv = '';

    // Classes
    csv += '=== CLASSES ===\n';
    csv += 'ID,Name,Teacher,Start Time,End Time,Location,Days,Color,Reminder Minutes,Description\n';
    (data.classes || []).forEach(cls => {
      csv += this.escapeCSV([
        cls.id, cls.name, cls.teacher || '', cls.startTime, cls.endTime,
        cls.location || '', cls.days?.join(';') || '', cls.color || '',
        cls.reminderMinutes || 15, cls.description || ''
      ]) + '\n';
    });

    // Assignments
    csv += '\n=== ASSIGNMENTS ===\n';
    csv += 'ID,Title,Class,Due Date,Due Time,Priority,Status,Description\n';
    (data.assignments || []).forEach(a => {
      csv += this.escapeCSV([
        a.id, a.title, a.classId || '', a.dueDate || '', a.dueTime || '',
        a.priority || 'medium', a.completed ? 'Completed' : 'Pending',
        a.description || ''
      ]) + '\n';
    });

    // Exams
    csv += '\n=== EXAMS ===\n';
    csv += 'ID,Title,Class,Date,Time,Location,Type,Topics\n';
    (data.exams || []).forEach(e => {
      csv += this.escapeCSV([
        e.id, e.title, e.classId || '', e.date || '', e.time || '',
        e.location || '', e.type || '', e.topics || ''
      ]) + '\n';
    });

    // Grades
    csv += '\n=== GRADES ===\n';
    csv += 'ID,Name,Class,Grade,Weight,Date\n';
    (data.grades || []).forEach(g => {
      csv += this.escapeCSV([
        g.id, g.name, g.classId || '', g.grade, g.weight || '', g.date || ''
      ]) + '\n';
    });

    // Tasks
    csv += '\n=== TASKS ===\n';
    csv += 'ID,Title,Status,Priority,Due Date,Notes\n';
    (data.tasks || []).forEach(t => {
      csv += this.escapeCSV([
        t.id, t.title, t.completed ? 'Completed' : 'Pending',
        t.priority || 'medium', t.dueDate || '', t.notes || ''
      ]) + '\n';
    });

    return csv;
  },

  // Export to ICS (iCalendar)
  exportICS(data) {
    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Student Assistant Pro//EN',
      'CALSCALE:GREGORIAN',
      'X-WR-CALNAME:Student Assistant Classes',
      'X-WR-TIMEZONE:UTC'
    ];

    // Add classes as recurring events
    (data.classes || []).forEach(cls => {
      cls.days?.forEach(day => {
        const dayNum = this.getDayNumber(day);
        const startDate = this.getNextOccurrence(dayNum, cls.startTime);
        
        ics.push('BEGIN:VEVENT');
        ics.push(`UID:${cls.id}-${dayNum}@studentassistant`);
        ics.push(`DTSTAMP:${this.formatICSDate(new Date())}`);
        ics.push(`DTSTART;TZID=UTC:${this.formatICSDate(startDate)}`);
        ics.push(`DTEND;TZID=UTC:${this.formatICSDate(this.addDuration(startDate, cls.endTime))}`);
        ics.push(`RRULE:FREQ=WEEKLY;BYDAY=${this.getRRULEDay(day)}`);
        ics.push(`SUMMARY:${this.escapeICS(cls.name)}`);
        ics.push(`DESCRIPTION:${this.escapeICS(cls.description || '')}`);
        ics.push(`LOCATION:${this.escapeICS(cls.location || 'Online')}`);
        ics.push('END:VEVENT');
      });
    });

    // Add exams as one-time events
    (data.exams || []).forEach(exam => {
      if (!exam.date) return;
      
      const examDate = new Date(exam.date + 'T' + (exam.time || '09:00'));
      
      ics.push('BEGIN:VEVENT');
      ics.push(`UID:${exam.id}@studentassistant`);
      ics.push(`DTSTAMP:${this.formatICSDate(new Date())}`);
      ics.push(`DTSTART;TZID=UTC:${this.formatICSDate(examDate)}`);
      ics.push(`DTEND;TZID=UTC:${this.formatICSDate(this.addDuration(examDate, '2 hours'))}`);
      ics.push(`SUMMARY:${this.escapeICS(exam.title)}`);
      ics.push(`DESCRIPTION:${this.escapeICS(exam.topics || '')}`);
      ics.push(`LOCATION:${this.escapeICS(exam.location || 'TBA')}`);
      ics.push('END:VEVENT');
    });

    // Add assignment due dates as alarms
    (data.assignments || []).forEach(a => {
      if (!a.dueDate || a.completed) return;
      
      const dueDate = new Date(a.dueDate + 'T23:59:00');
      
      ics.push('BEGIN:VEVENT');
      ics.push(`UID:assignment-${a.id}@studentassistant`);
      ics.push(`DTSTAMP:${this.formatICSDate(new Date())}`);
      ics.push(`DTSTART;TZID=UTC:${this.formatICSDate(dueDate)}`);
      ics.push(`SUMMARY:${this.escapeICS('Assignment Due: ' + a.title)}`);
      ics.push(`DESCRIPTION:${this.escapeICS(a.description || '')}`);
      ics.push('BEGIN:VALARM');
      ics.push('ACTION:DISPLAY');
      ics.push('DESCRIPTION:Assignment Due Reminder');
      ics.push('TRIGGER:-P1D');
      ics.push('END:VALARM');
      ics.push('END:VEVENT');
    });

    ics.push('END:VCALENDAR');
    return ics.join('\r\n');
  },

  // Export notes to Markdown
  exportNotesMarkdown(notes) {
    let md = '# My Notes\n\n';
    md += `*Exported from Student Assistant Pro on ${new Date().toLocaleString()}*\n\n`;
    md += `**Total Notes:** ${notes.length}\n\n`;
    md += '---\n\n';

    notes.forEach((note, index) => {
      md += `## ${note.title}\n\n`;
      
      if (note.tags && note.tags.length > 0) {
        md += `**Tags:** ${note.tags.join(', ')}\n\n`;
      }
      
      if (note.classId) {
        md += `**Class:** ${note.classId}\n\n`;
      }
      
      md += `${note.content}\n\n`;
      
      if (index < notes.length - 1) {
        md += '---\n\n';
      }
    });

    return md;
  },

  // Export grade report
  exportGradeReport(grades, className = 'Grade Report') {
    let report = `# ${className}\n\n`;
    report += `*Generated: ${new Date().toLocaleString()}*\n\n`;

    // Calculate statistics
    const total = grades.length;
    const average = grades.reduce((sum, g) => sum + g.grade, 0) / total || 0;
    const highest = Math.max(...grades.map(g => g.grade));
    const lowest = Math.min(...grades.map(g => g.grade));

    report += '## Summary\n\n';
    report += `| Metric | Value |\n`;
    report += `|--------|-------|\n`;
    report += `| Total Grades | ${total} |\n`;
    report += `| Average | ${average.toFixed(1)}% |\n`;
    report += `| Highest | ${highest}% |\n`;
    report += `| Lowest | ${lowest}% |\n\n`;

    report += '## Grade List\n\n';
    report += `| Name | Grade | Weight | Date |\n`;
    report += `|------|-------|--------|------|\n`;

    grades.forEach(g => {
      report += `| ${g.name} | ${g.grade}% | ${g.weight || 0}% | ${g.date || 'N/A'} |\n`;
    });

    return report;
  },

  // Import data from JSON
  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Check if it's our export format
      if (parsed.data) {
        return {
          success: true,
          data: parsed.data
        };
      }
      
      // Otherwise assume it's raw data
      return {
        success: true,
        data: parsed
      };
    } catch (e) {
      return {
        success: false,
        error: 'Invalid JSON format: ' + e.message
      };
    }
  },

  // Import from CSV
  importCSV(csvText) {
    const lines = csvText.split('\n').filter(l => l.trim());
    const data = {
      classes: [],
      assignments: [],
      exams: [],
      grades: [],
      tasks: []
    };

    let currentSection = null;
    let headers = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('===')) {
        currentSection = line.replace(/===/g, '').trim().toLowerCase();
        headers = [];
        continue;
      }

      if (!currentSection || line.startsWith('ID,')) {
        if (line.startsWith('ID,')) {
          headers = this.parseCSVLine(line);
        }
        continue;
      }

      const values = this.parseCSVLine(line);
      const row = {};
      headers.forEach((h, idx) => {
        row[h.toLowerCase().replace(/\s+/g, '')] = values[idx] || '';
      });

      switch (currentSection) {
        case 'classes':
          data.classes.push({
            id: row.id || `class-${Date.now()}-${i}`,
            name: row.name || 'Unknown',
            teacher: row.teacher || '',
            startTime: row.starttime || '',
            endTime: row.endtime || '',
            location: row.location || '',
            days: row.days ? row.days.split(';') : [],
            color: row.color || '#667eea',
            reminderMinutes: parseInt(row.reminderminutes) || 15,
            description: row.description || ''
          });
          break;

        case 'assignments':
          data.assignments.push({
            id: row.id || `assignment-${Date.now()}-${i}`,
            title: row.title || 'Unknown',
            classId: row.class || '',
            dueDate: row.duedate || '',
            dueTime: row.duetime || '23:59',
            priority: row.priority || 'medium',
            completed: row.status === 'Completed',
            description: row.description || ''
          });
          break;

        case 'exams':
          data.exams.push({
            id: row.id || `exam-${Date.now()}-${i}`,
            title: row.title || 'Unknown',
            classId: row.class || '',
            date: row.date || '',
            time: row.time || '',
            location: row.location || '',
            type: row.type || 'other',
            topics: row.topics || ''
          });
          break;

        case 'grades':
          data.grades.push({
            id: row.id || `grade-${Date.now()}-${i}`,
            name: row.name || 'Unknown',
            classId: row.class || '',
            grade: parseFloat(row.grade) || 0,
            weight: parseFloat(row.weight) || 0,
            date: row.date || ''
          });
          break;

        case 'tasks':
          data.tasks.push({
            id: row.id || `task-${Date.now()}-${i}`,
            title: row.title || 'Unknown',
            completed: row.status === 'Completed',
            priority: row.priority || 'medium',
            dueDate: row.duedate || '',
            notes: row.notes || ''
          });
          break;
      }
    }

    return {
      success: true,
      data
    };
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

  // Escape CSV field
  escapeCSV(fields) {
    return fields.map(f => {
      const str = String(f || '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',');
  },

  // Escape ICS text
  escapeICS(text) {
    return String(text || '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  },

  // Format date for ICS
  formatICSDate(date) {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  },

  // Get day number (0-6)
  getDayNumber(dayName) {
    const days = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    return days[dayName] || 0;
  },

  // Get RRULE day format
  getRRULEDay(dayName) {
    const days = {
      'Sunday': 'SU', 'Monday': 'MO', 'Tuesday': 'TU', 'Wednesday': 'WE',
      'Thursday': 'TH', 'Friday': 'FR', 'Saturday': 'SA'
    };
    return days[dayName] || 'MO';
  },

  // Get next occurrence of a day
  getNextOccurrence(dayNum, time) {
    const now = new Date();
    const result = new Date(now);
    
    const daysUntil = (dayNum - now.getDay() + 7) % 7 || 7;
    result.setDate(result.getDate() + daysUntil);
    
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      result.setHours(hours, minutes, 0, 0);
    }
    
    return result;
  },

  // Add duration to date
  addDuration(date, duration) {
    const result = new Date(date);
    
    if (typeof duration === 'string') {
      // Parse time string like "10:00" or "2 hours"
      if (duration.includes(':')) {
        const [hours, minutes] = duration.split(':').map(Number);
        result.setHours(hours, minutes, 0, 0);
      } else if (duration.includes('hour')) {
        const hours = parseInt(duration);
        result.setHours(result.getHours() + hours);
      }
    }
    
    return result;
  },

  // Create backup
  createBackup(data) {
    const backup = {
      version: '3.0',
      createdAt: new Date().toISOString(),
      type: 'full_backup',
      app: 'Student Assistant Pro',
      data: data
    };

    return JSON.stringify(backup, null, 2);
  },

  // Restore from backup
  restoreBackup(jsonString) {
    try {
      const backup = JSON.parse(jsonString);
      
      if (!backup.data) {
        return {
          success: false,
          error: 'Invalid backup format'
        };
      }

      return {
        success: true,
        data: backup.data
      };
    } catch (e) {
      return {
        success: false,
        error: 'Failed to parse backup: ' + e.message
      };
    }
  },

  // Download file
  downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Upload file
  uploadFile(accept = '*') {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) {
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            file,
            content: event.target.result
          });
        };
        reader.onerror = reject;
        reader.readAsText(file);
      };
      
      input.click();
    });
  },

  // Validate imported data
  validateImportedData(data) {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!data) {
      errors.push('No data provided');
      return { valid: false, errors, warnings };
    }

    // Validate classes
    (data.classes || []).forEach((cls, i) => {
      if (!cls.name) {
        errors.push(`Class ${i + 1}: Missing name`);
      }
      if (!cls.startTime || !cls.endTime) {
        warnings.push(`Class ${i + 1}: Missing time information`);
      }
    });

    // Validate grades
    (data.grades || []).forEach((g, i) => {
      if (g.grade < 0 || g.grade > 100) {
        warnings.push(`Grade ${i + 1}: Grade value out of range (0-100)`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ImportExport };
}
