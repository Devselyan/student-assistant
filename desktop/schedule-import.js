// Student Assistant Pro - Schedule Import Module
// Import schedules from PDF, Images, CSV, and ICS files

const ScheduleImport = {
  // Supported formats
  formats: {
    PDF: 'application/pdf',
    PNG: 'image/png',
    JPEG: 'image/jpeg',
    JPG: 'image/jpg',
    CSV: 'text/csv',
    ICS: 'text/calendar'
  },

  // Import from file
  async importFile(file) {
    if (!file) return { success: false, error: 'No file provided' };

    try {
      switch (file.type) {
        case this.formats.PDF:
          return await this.importPDF(file);
        case this.formats.PNG:
        case this.formats.JPEG:
        case this.formats.JPG:
          return await this.importImage(file);
        case this.formats.CSV:
          return await this.importCSV(file);
        case this.formats.ICS:
          return await this.importICS(file);
        default:
          // Try by extension
          const ext = file.name.split('.').pop().toLowerCase();
          if (ext === 'pdf') return await this.importPDF(file);
          if (['png', 'jpg', 'jpeg'].includes(ext)) return await this.importImage(file);
          if (ext === 'csv') return await this.importCSV(file);
          if (ext === 'ics') return await this.importICS(file);
          return { success: false, error: 'Unsupported file format' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Import from PDF
  async importPDF(file) {
    try {
      // Read PDF as text
      const text = await this.extractTextFromPDF(file);
      
      // Try to parse schedule from extracted text
      const classes = this.parseScheduleFromText(text);
      
      if (classes.length === 0) {
        return { 
          success: false, 
          error: 'Could not extract schedule from PDF. Try using an ICS file instead.',
          extractedText: text.substring(0, 500) // Return preview for debugging
        };
      }

      return { success: true, classes, format: 'PDF' };
    } catch (error) {
      return { 
        success: false, 
        error: 'Failed to read PDF: ' + error.message 
      };
    }
  },

  // Extract text from PDF (simplified - would need PDF.js in production)
  async extractTextFromPDF(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          // In production, this would use PDF.js library
          // For now, we'll try to extract any text patterns
          const arrayBuffer = event.target.result;
          const text = await this.parsePDFText(arrayBuffer);
          resolve(text);
        } catch (e) {
          reject(e);
        }
      };
      
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },

  // Parse PDF text (basic implementation)
  async parsePDFText(arrayBuffer) {
    // Convert to string and look for text patterns
    const textDecoder = new TextDecoder('utf-8');
    const string = textDecoder.decode(arrayBuffer);
    
    // Remove non-printable characters
    const cleaned = string.replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, ' ');
    
    return cleaned;
  },

  // Import from Image
  async importImage(file) {
    try {
      // In production, this would use OCR (Tesseract.js)
      // For now, we'll provide guidance
      return {
        success: false,
        error: 'Image import requires OCR. Please export your schedule as ICS or CSV from your school portal instead.',
        hint: 'Most school portals (HISinOne, Canvas, Blackboard) allow exporting schedules as ICS or CSV files.'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Import from CSV
  async importCSV(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const classes = this.parseCSV(event.target.result);
          resolve({ success: true, classes, format: 'CSV' });
        } catch (e) {
          reject(e);
        }
      };
      
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },

  // Import from ICS
  async importICS(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const classes = this.parseICS(event.target.result);
          resolve({ success: true, classes, format: 'ICS' });
        } catch (e) {
          reject(e);
        }
      };
      
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },

  // Parse schedule from extracted text
  parseScheduleFromText(text) {
    const classes = [];
    
    // Common patterns in schedule PDFs
    const patterns = [
      // Pattern: Course Name, Day, Time, Location
      /([A-Z][a-zA-Z\s]+)\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/gi,
      // Pattern: Day Time-Time Course
      /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})\s+([A-Z][a-zA-Z\s]+)/gi
    ];

    // Try to extract class information
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const className = match[1] || match[4];
        const day = this.normalizeDay(match[2] || match[1]);
        const startTime = match[3] || match[2];
        const endTime = match[4] || match[3];

        if (className && day && startTime && endTime) {
          classes.push({
            id: `imported-${Date.now()}-${classes.length}`,
            name: className.trim(),
            teacher: '',
            startTime: this.normalizeTime(startTime),
            endTime: this.normalizeTime(endTime),
            location: 'TBA',
            description: 'Imported from PDF',
            days: [day],
            color: '#667eea',
            reminderMinutes: 15
          });
        }
      }
    }

    return classes;
  },

  // Normalize day name
  normalizeDay(day) {
    const dayMap = {
      'mon': 'Monday', 'monday': 'Monday',
      'tue': 'Tuesday', 'tuesday': 'Tuesday',
      'wed': 'Wednesday', 'wednesday': 'Wednesday',
      'thu': 'Thursday', 'thursday': 'Thursday',
      'fri': 'Friday', 'friday': 'Friday',
      'sat': 'Saturday', 'saturday': 'Saturday',
      'sun': 'Sunday', 'sunday': 'Sunday'
    };
    return dayMap[day.toLowerCase()] || day;
  },

  // Normalize time format
  normalizeTime(timeStr) {
    if (!timeStr) return '';
    
    // Handle various time formats
    timeStr = timeStr.trim();
    
    // Already in HH:MM format
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
      const [h, m] = timeStr.split(':');
      return `${h.padStart(2, '0')}:${m}`;
    }
    
    // With AM/PM
    const ampmMatch = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1]);
      const ampm = ampmMatch[3].toUpperCase();
      
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      
      return `${hours.toString().padStart(2, '0')}:${ampmMatch[2] || '00'}`;
    }
    
    return timeStr;
  },

  // Parse CSV
  parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = this.parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    const requiredFields = ['class name', 'start time', 'end time', 'days'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));

    if (missingFields.length > 0) {
      throw new Error(`Missing required columns: ${missingFields.join(', ')}`);
    }

    const classes = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length < headers.length) continue;

      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ? values[index].replace(/^"|"$/g, '').trim() : '';
      });

      const classObj = {
        id: `csv-${Date.now()}-${i}`,
        name: row['class name'] || row['class'] || 'Unknown',
        teacher: row['teacher'] || '',
        startTime: this.normalizeTime(row['start time']),
        endTime: this.normalizeTime(row['end time']),
        location: row['location'] || row['place'] || 'Online',
        description: row['description'] || row['notes'] || '',
        days: this.parseDays(row['days']),
        color: '#667eea',
        reminderMinutes: parseInt(row['reminder minutes'] || row['reminder'] || '15')
      };

      if (classObj.name && classObj.startTime && classObj.endTime && classObj.days.length > 0) {
        classes.push(classObj);
      }
    }

    return classes;
  },

  // Parse ICS
  parseICS(icsText) {
    const classes = [];
    const events = icsText.split('BEGIN:VEVENT').slice(1);

    events.forEach(event => {
      const summary = this.extractICSField(event, 'SUMMARY');
      const dtstart = this.extractICSField(event, 'DTSTART');
      const dtend = this.extractICSField(event, 'DTEND');
      const location = this.extractICSField(event, 'LOCATION') || 'Online';
      const description = this.extractICSField(event, 'DESCRIPTION') || '';
      const rrule = this.extractICSField(event, 'RRULE');

      if (!summary || !dtstart || !dtend) return;

      // Parse days from RRULE
      let days = [];
      if (rrule && rrule.includes('BYDAY=')) {
        const byDay = rrule.match(/BYDAY=([^\n;]+)/)?.[1] || '';
        const dayMap = { 'MO': 'Monday', 'TU': 'Tuesday', 'WE': 'Wednesday', 'TH': 'Thursday', 'FR': 'Friday', 'SA': 'Saturday', 'SU': 'Sunday' };
        byDay.split(',').forEach(d => {
          const day = dayMap[d.trim()];
          if (day) days.push(day);
        });
      }

      // If no days specified, infer from date
      if (days.length === 0) {
        const dateObj = this.parseICSDate(dtstart);
        if (dateObj) {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          days = [dayNames[dateObj.getDay()]];
        }
      }

      // Extract times properly
      const startTime = this.extractTimeFromICSDateTime(dtstart);
      const endTime = this.extractTimeFromICSDateTime(dtend);

      if (summary && startTime && endTime && days.length > 0) {
        classes.push({
          id: `ics-${Date.now()}-${classes.length}`,
          name: summary,
          teacher: '',
          startTime,
          endTime,
          location: location || 'Online',
          description: description || '',
          days: days,
          color: '#667eea',
          reminderMinutes: 15
        });
      }
    });

    return classes;
  },

  // Helper functions
  extractICSField(event, fieldName) {
    const regex = new RegExp(`${fieldName}(?:;[^:\\n]+)?:([^\\n]+)`, 'i');
    const match = event.match(regex);
    return match ? match[1].trim() : '';
  },

  parseICSDate(dateStr) {
    if (!dateStr) return null;
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new Date(year, month, day);
  },

  extractTimeFromICSDateTime(dateTimeStr) {
    if (!dateTimeStr) return '';
    const tIndex = dateTimeStr.indexOf('T');
    if (tIndex > 0 && dateTimeStr.length >= tIndex + 6) {
      const timePart = dateTimeStr.substring(tIndex + 1, tIndex + 7);
      const hours = timePart.substring(0, 2);
      const minutes = timePart.substring(2, 4);
      return `${hours}:${minutes}`;
    }
    return '';
  },

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

  parseDays(daysStr) {
    if (!daysStr) return [];
    const dayMap = {
      'monday': 'Monday', 'mon': 'Monday', 'm': 'Monday',
      'tuesday': 'Tuesday', 'tue': 'Tuesday', 't': 'Tuesday',
      'wednesday': 'Wednesday', 'wed': 'Wednesday', 'w': 'Wednesday',
      'thursday': 'Thursday', 'thu': 'Thursday', 'th': 'Thursday', 'r': 'Thursday',
      'friday': 'Friday', 'fri': 'Friday', 'f': 'Friday',
      'saturday': 'Saturday', 'sat': 'Saturday', 's': 'Saturday',
      'sunday': 'Sunday', 'sun': 'Sunday', 'u': 'Sunday'
    };
    const days = [];
    const separators = /[;,/\s]+/;
    const parts = daysStr.toLowerCase().split(separators).filter(p => p.trim());
    parts.forEach(part => {
      const day = dayMap[part.trim()];
      if (day && !days.includes(day)) days.push(day);
    });
    return days;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ScheduleImport };
}
