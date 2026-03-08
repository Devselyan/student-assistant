// Student Assistant Pro - Utility Functions
// Comprehensive helper functions for the application

// ==================== DATE UTILITIES ====================
const DateUtils = {
  // Format date to readable string
  formatDate(date, options = {}) {
    const defaultOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
  },

  // Format time to 12-hour format
  formatTime(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  },

  // Get days between two dates
  daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1 - date2) / oneDay));
  },

  // Check if date is today
  isToday(date) {
    const today = new Date();
    const d = new Date(date);
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  },

  // Check if date is in the past
  isPast(date) {
    return new Date(date) < new Date();
  },

  // Get time until date (in human readable format)
  timeUntil(date) {
    const now = new Date();
    const target = new Date(date);
    const diff = target - now;

    if (diff <= 0) return 'Due now';

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return 'Any minute';
  },

  // Get week number
  getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  },

  // Get start of week
  getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  },

  // Get end of week
  getEndOfWeek(date) {
    const start = this.getStartOfWeek(date);
    return new Date(start.setDate(start.getDate() + 6));
  },

  // Get start of month
  getStartOfMonth(date) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  },

  // Get end of month
  getEndOfMonth(date) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  },

  // Add days to date
  addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  },

  // Add months to date
  addMonths(date, months) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  },

  // Check if date is in current week
  isCurrentWeek(date) {
    const now = new Date();
    const startOfWeek = this.getStartOfWeek(now);
    const endOfWeek = this.getEndOfWeek(now);
    const d = new Date(date);
    return d >= startOfWeek && d <= endOfWeek;
  },

  // Check if date is in current month
  isCurrentMonth(date) {
    const now = new Date();
    const d = new Date(date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  },

  // Get relative time description
  getRelativeTime(date) {
    const now = new Date();
    const d = new Date(date);
    const diffMs = d - now;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < -60) return `${Math.abs(diffHours)} hours ago`;
    if (diffMins < 0) return `${Math.abs(diffMins)} minutes ago`;
    if (diffMins === 0) return 'Just now';
    if (diffMins < 60) return `In ${diffMins} minutes`;
    if (diffHours < 24) return `In ${diffHours} hours`;
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    return this.formatDate(date);
  }
};

// ==================== STRING UTILITIES ====================
const StringUtils = {
  // Capitalize first letter
  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  // Truncate string with ellipsis
  truncate(str, length = 50) {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
  },

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Slugify string
  slugify(str) {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  // Escape HTML
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // Count words in string
  countWords(str) {
    return str.trim().split(/\s+/).length;
  },

  // Count characters in string
  countChars(str) {
    return str.length;
  },

  // Remove HTML tags
  stripHtml(str) {
    if (!str) return '';
    return str.replace(/<[^>]*>/g, '');
  },

  // Format number with commas
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  // Parse percentage string to number
  parsePercentage(str) {
    if (!str) return 0;
    const num = parseFloat(str.replace('%', ''));
    return isNaN(num) ? 0 : num;
  },

  // Format percentage
  formatPercentage(num, decimals = 1) {
    return `${num.toFixed(decimals)}%`;
  },

  // Extract initials from name
  getInitials(name) {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length === 1) return name.substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  },

  // Check if string contains search term
  matchesSearch(str, searchTerm) {
    if (!str || !searchTerm) return false;
    return str.toLowerCase().includes(searchTerm.toLowerCase());
  },

  // Highlight search term in string
  highlightSearch(str, searchTerm) {
    if (!str || !searchTerm) return str;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return str.replace(regex, '<mark>$1</mark>');
  }
};

// ==================== ARRAY UTILITIES ====================
const ArrayUtils = {
  // Remove duplicates from array
  unique(arr) {
    return [...new Set(arr)];
  },

  // Group array by key
  groupBy(arr, key) {
    return arr.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) result[group] = [];
      result[group].push(item);
      return result;
    }, {});
  },

  // Sort array by key
  sortBy(arr, key, ascending = true) {
    return [...arr].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (ascending) {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
  },

  // Filter array by search term
  filterBySearch(arr, searchTerm, keys) {
    if (!searchTerm) return arr;
    const term = searchTerm.toLowerCase();
    return arr.filter(item => {
      return keys.some(key => {
        const value = item[key];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(term);
        }
        return false;
      });
    });
  },

  // Get unique values for key
  getUniqueValues(arr, key) {
    return this.unique(arr.map(item => item[key]));
  },

  // Sum array by key
  sumBy(arr, key) {
    return arr.reduce((sum, item) => sum + (item[key] || 0), 0);
  },

  // Average array by key
  averageBy(arr, key) {
    if (arr.length === 0) return 0;
    return this.sumBy(arr, key) / arr.length;
  },

  // Max value by key
  maxBy(arr, key) {
    if (arr.length === 0) return null;
    return Math.max(...arr.map(item => item[key]));
  },

  // Min value by key
  minBy(arr, key) {
    if (arr.length === 0) return null;
    return Math.min(...arr.map(item => item[key]));
  },

  // Chunk array into smaller arrays
  chunk(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  },

  // Shuffle array
  shuffle(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  // Intersect two arrays
  intersect(arr1, arr2) {
    return arr1.filter(item => arr2.includes(item));
  },

  // Difference between two arrays
  difference(arr1, arr2) {
    return arr1.filter(item => !arr2.includes(item));
  }
};

// ==================== OBJECT UTILITIES ====================
const ObjectUtils = {
  // Deep clone object
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  // Get nested value by path
  getByPath(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  },

  // Set nested value by path
  setByPath(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => current[key] = current[key] || {}, obj);
    target[lastKey] = value;
    return obj;
  },

  // Delete nested value by path
  deleteByPath(obj, path) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => current?.[key], obj);
    if (target) delete target[lastKey];
    return obj;
  },

  // Merge objects deeply
  deepMerge(...objects) {
    return objects.reduce((result, obj) => {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          result[key] = this.deepMerge(result[key] || {}, obj[key]);
        } else {
          result[key] = obj[key];
        }
      });
      return result;
    }, {});
  },

  // Pick keys from object
  pick(obj, keys) {
    return keys.reduce((result, key) => {
      if (key in obj) result[key] = obj[key];
      return result;
    }, {});
  },

  // Omit keys from object
  omit(obj, keys) {
    return Object.keys(obj)
      .filter(key => !keys.includes(key))
      .reduce((result, key) => {
        result[key] = obj[key];
        return result;
      }, {});
  },

  // Get object size
  size(obj) {
    return Object.keys(obj).length;
  },

  // Check if object is empty
  isEmpty(obj) {
    return Object.keys(obj).length === 0;
  },

  // Invert object keys and values
  invert(obj) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [value, key])
    );
  },

  // Map object values
  mapValues(obj, fn) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, fn(value, key)])
    );
  },

  // Filter object entries
  filterEntries(obj, fn) {
    return Object.fromEntries(
      Object.entries(obj).filter(([key, value]) => fn(value, key))
    );
  },

  // Sort object by keys
  sortByKeys(obj) {
    return Object.fromEntries(
      Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))
    );
  }
};

// ==================== VALIDATION UTILITIES ====================
const ValidationUtils = {
  // Check if email is valid
  isEmail(str) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(str);
  },

  // Check if URL is valid
  isUrl(str) {
    const regex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return regex.test(str);
  },

  // Check if date string is valid
  isDate(str) {
    const date = new Date(str);
    return !isNaN(date.getTime());
  },

  // Check if number is valid
  isNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  },

  // Check if value is empty
  isEmpty(value) {
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return value === null || value === undefined;
  },

  // Check minimum length
  minLength(str, min) {
    return str && str.length >= min;
  },

  // Check maximum length
  maxLength(str, max) {
    return str && str.length <= max;
  },

  // Check if value is in range
  inRange(value, min, max) {
    return value >= min && value <= max;
  },

  // Validate required field
  isRequired(value) {
    return !this.isEmpty(value);
  },

  // Validate phone number (international)
  isPhone(str) {
    const regex = /^[\d\s\-\+\(\)]{10,}$/;
    return regex.test(str);
  },

  // Validate credit card number (basic Luhn check)
  isCreditCard(str) {
    const regex = /^[\d\s-]+$/;
    if (!regex.test(str)) return false;
    
    const digits = str.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  },

  // Validate form data
  validateForm(data, rules) {
    const errors = {};
    
    Object.keys(rules).forEach(field => {
      const value = data[field];
      const fieldRules = rules[field];
      
      fieldRules.forEach(rule => {
        const [ruleName, ruleValue] = rule.split(':');
        
        switch (ruleName) {
          case 'required':
            if (!this.isRequired(value)) {
              errors[field] = errors[field] || [];
              errors[field].push(`${field} is required`);
            }
            break;
          case 'email':
            if (value && !this.isEmail(value)) {
              errors[field] = errors[field] || [];
              errors[field].push('Invalid email address');
            }
            break;
          case 'minLength':
            if (value && !this.minLength(value, parseInt(ruleValue))) {
              errors[field] = errors[field] || [];
              errors[field].push(`Minimum length is ${ruleValue}`);
            }
            break;
          case 'maxLength':
            if (value && !this.maxLength(value, parseInt(ruleValue))) {
              errors[field] = errors[field] || [];
              errors[field].push(`Maximum length is ${ruleValue}`);
            }
            break;
          case 'min':
            if (value && !this.inRange(value, ruleValue, Infinity)) {
              errors[field] = errors[field] || [];
              errors[field].push(`Minimum value is ${ruleValue}`);
            }
            break;
          case 'max':
            if (value && !this.inRange(value, -Infinity, ruleValue)) {
              errors[field] = errors[field] || [];
              errors[field].push(`Maximum value is ${ruleValue}`);
            }
            break;
        }
      });
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

// ==================== STORAGE UTILITIES ====================
const StorageUtils = {
  // Save to localStorage
  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage save error:', e);
      return false;
    }
  },

  // Load from localStorage
  load(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Storage load error:', e);
      return defaultValue;
    }
  },

  // Remove from localStorage
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Storage remove error:', e);
      return false;
    }
  },

  // Clear all localStorage
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error('Storage clear error:', e);
      return false;
    }
  },

  // Get all keys
  getKeys() {
    return Object.keys(localStorage);
  },

  // Get storage size in KB
  getSize() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return Math.round(total / 1024);
  },

  // Save to sessionStorage
  saveSession(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Session storage save error:', e);
      return false;
    }
  },

  // Load from sessionStorage
  loadSession(key, defaultValue = null) {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Session storage load error:', e);
      return defaultValue;
    }
  }
};

// Export utilities
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DateUtils,
    StringUtils,
    ArrayUtils,
    ObjectUtils,
    ValidationUtils,
    StorageUtils
  };
}
