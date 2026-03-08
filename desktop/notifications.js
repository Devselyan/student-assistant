// Student Assistant Pro - Notifications Module
// Comprehensive notification and reminder system

const Notifications = {
  // Notification types
  types: {
    CLASS_REMINDER: 'class_reminder',
    ASSIGNMENT_DUE: 'assignment_due',
    ASSIGNMENT_OVERDUE: 'assignment_overdue',
    EXAM_UPCOMING: 'exam_upcoming',
    EXAM_TODAY: 'exam_today',
    TASK_DUE: 'task_due',
    STUDY_GOAL: 'study_goal',
    GRADE_POSTED: 'grade_posted',
    CUSTOM: 'custom'
  },

  // Priority levels
  priorities: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
  },

  // Default settings
  defaults: {
    enabled: true,
    sound: true,
    desktop: true,
    classReminderMinutes: 15,
    assignmentDueHours: 24,
    assignmentOverdueCheck: true,
    examDaysBefore: 3,
    studyGoalReminders: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  },

  // Initialize notifications
  async init(settings = {}) {
    this.settings = { ...this.defaults, ...settings };
    
    if (this.settings.enabled && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      this.permission = permission;
    }
    
    this.queue = [];
    this.history = [];
    
    return this;
  },

  // Create a notification
  create(options) {
    const notification = {
      id: options.id || `notif-${Date.now()}`,
      type: options.type || this.types.CUSTOM,
      priority: options.priority || this.priorities.MEDIUM,
      title: options.title,
      body: options.body,
      icon: options.icon || '/icon-192.png',
      data: options.data || {},
      createdAt: new Date().toISOString(),
      scheduledFor: options.scheduledFor || null,
      expiresAt: options.expiresAt || null,
      delivered: false,
      read: false,
      actioned: false,
      actions: options.actions || []
    };

    return notification;
  },

  // Schedule a notification
  schedule(notification) {
    if (!notification.scheduledFor) {
      // Deliver immediately
      this.deliver(notification);
    } else {
      // Add to queue
      this.queue.push(notification);
      this.queue.sort((a, b) => 
        new Date(a.scheduledFor) - new Date(b.scheduledFor)
      );
    }
    return notification;
  },

  // Deliver a notification
  async deliver(notification) {
    // Check quiet hours
    if (this.settings.quietHours.enabled && this.isQuietHours()) {
      // Queue for delivery after quiet hours
      notification.scheduledFor = this.getQuietHoursEnd();
      this.queue.push(notification);
      return;
    }

    notification.delivered = true;
    notification.deliveredAt = new Date().toISOString();

    // Desktop notification
    if (this.settings.desktop && this.permission === 'granted') {
      this.showDesktopNotification(notification);
    }

    // Add to history
    this.history.unshift(notification);
    
    // Keep history limited
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }

    // Dispatch event for UI update
    this.dispatchNotificationEvent(notification);

    return notification;
  },

  // Show desktop notification
  showDesktopNotification(notification) {
    try {
      const notif = new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon,
        tag: notification.id,
        requireInteraction: notification.priority === this.priorities.URGENT,
        silent: !this.settings.sound
      });

      // Handle notification click
      notif.onclick = () => {
        window.focus();
        this.markAsActioned(notification.id);
        notif.close();
      };
    } catch (e) {
      console.error('Failed to show notification:', e);
    }
  },

  // Check if currently in quiet hours
  isQuietHours() {
    if (!this.settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = this.settings.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.settings.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime < endTime;
    }
  },

  // Get end of quiet hours
  getQuietHoursEnd() {
    const now = new Date();
    const [endHour, endMin] = this.settings.quietHours.end.split(':').map(Number);
    
    const quietEnd = new Date(now);
    quietEnd.setHours(endHour, endMin, 0, 0);
    
    // If quiet hours already passed today, schedule for tomorrow
    if (now > quietEnd) {
      quietEnd.setDate(quietEnd.getDate() + 1);
    }
    
    return quietEnd.toISOString();
  },

  // Mark notification as read
  markAsRead(notificationId) {
    const notification = this.history.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      notification.readAt = new Date().toISOString();
    }
    return notification;
  },

  // Mark notification as actioned
  markAsActioned(notificationId) {
    const notification = this.history.find(n => n.id === notificationId);
    if (notification) {
      notification.actioned = true;
      notification.actionedAt = new Date().toISOString();
    }
    return notification;
  },

  // Get unread notifications
  getUnread() {
    return this.history.filter(n => n.delivered && !n.read);
  },

  // Get unread count
  getUnreadCount() {
    return this.getUnread().length;
  },

  // Clear all notifications
  clear() {
    this.history = [];
    this.queue = [];
  },

  // Check for class reminders
  checkClassReminders(classes) {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5);

    classes.forEach(cls => {
      if (!cls.days.includes(currentDay)) return;
      if (cls.startTime <= currentTime) return;

      const [classHour, classMin] = cls.startTime.split(':').map(Number);
      const reminderTime = new Date();
      reminderTime.setHours(classHour, classMin - (cls.reminderMinutes || this.settings.classReminderMinutes), 0, 0);

      // Check if we should send reminder now (within 1 minute window)
      const timeDiff = Math.abs(now - reminderTime);
      if (timeDiff < 60000) { // Within 1 minute
        this.schedule(this.create({
          type: this.types.CLASS_REMINDER,
          priority: this.priorities.HIGH,
          title: `📚 Class Reminder: ${cls.name}`,
          body: `${cls.name} starts at ${cls.startTime} in ${cls.location || 'online'}`,
          data: { classId: cls.id, startTime: cls.startTime },
          actions: [
            { label: 'Open App', action: 'open_app' },
            { label: 'Dismiss', action: 'dismiss' }
          ]
        }));
      }
    });
  },

  // Check for assignment due notifications
  checkAssignmentDue(assignments) {
    const now = new Date();
    const hoursUntilDue = this.settings.assignmentDueHours;

    assignments.forEach(assignment => {
      if (assignment.completed || !assignment.dueDate) return;

      const dueDate = new Date(assignment.dueDate);
      const timeDiff = dueDate - now;
      const hoursLeft = timeDiff / (1000 * 60 * 60);

      if (hoursLeft > 0 && hoursLeft <= hoursUntilDue) {
        this.schedule(this.create({
          type: this.types.ASSIGNMENT_DUE,
          priority: hoursLeft < 6 ? this.priorities.URGENT : this.priorities.HIGH,
          title: `📝 Assignment Due: ${assignment.title}`,
          body: `${assignment.title} is due in ${this.formatTimeUntil(dueDate)}`,
          data: { assignmentId: assignment.id, dueDate: assignment.dueDate },
          actions: [
            { label: 'Mark Complete', action: 'mark_complete' },
            { label: 'Open App', action: 'open_app' }
          ]
        }));
      }
    });
  },

  // Check for overdue assignments
  checkOverdueAssignments(assignments) {
    if (!this.settings.assignmentOverdueCheck) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    assignments.forEach(assignment => {
      if (assignment.completed || !assignment.dueDate) return;

      const dueDate = new Date(assignment.dueDate);
      if (dueDate < today) {
        this.schedule(this.create({
          type: this.types.ASSIGNMENT_OVERDUE,
          priority: this.priorities.URGENT,
          title: `⚠️ Overdue: ${assignment.title}`,
          body: `${assignment.title} was due on ${dueDate.toLocaleDateString()}`,
          data: { assignmentId: assignment.id, dueDate: assignment.dueDate },
          actions: [
            { label: 'Mark Complete', action: 'mark_complete' },
            { label: 'Reschedule', action: 'reschedule' }
          ]
        }));
      }
    });
  },

  // Check for upcoming exams
  checkUpcomingExams(exams) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysBefore = this.settings.examDaysBefore;

    exams.forEach(exam => {
      if (!exam.date) return;

      const examDate = new Date(exam.date);
      const daysUntil = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));

      if (daysUntil === 0) {
        // Exam today
        this.schedule(this.create({
          type: this.types.EXAM_TODAY,
          priority: this.priorities.URGENT,
          title: `📋 Exam Today: ${exam.title}`,
          body: `${exam.title} is today at ${exam.time || 'TBA'}`,
          data: { examId: exam.id, examDate: exam.date },
          actions: [
            { label: 'View Details', action: 'view_exam' },
            { label: 'Good Luck! 🍀', action: 'dismiss' }
          ]
        }));
      } else if (daysUntil > 0 && daysUntil <= daysBefore) {
        this.schedule(this.create({
          type: this.types.EXAM_UPCOMING,
          priority: this.priorities.HIGH,
          title: `📋 Upcoming Exam: ${exam.title}`,
          body: `${exam.title} is in ${daysUntil} day${daysUntil > 1 ? 's' : ''} on ${examDate.toLocaleDateString()}`,
          data: { examId: exam.id, examDate: exam.date, daysUntil },
          actions: [
            { label: 'Start Studying', action: 'study_mode' },
            { label: 'View Details', action: 'view_exam' }
          ]
        }));
      }
    });
  },

  // Format time until date
  formatTimeUntil(date) {
    const now = new Date();
    const diff = date - now;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return 'any minute now';
    }
  },

  // Dispatch notification event
  dispatchNotificationEvent(notification) {
    const event = new CustomEvent('notification', {
      detail: { notification }
    });
    document.dispatchEvent(event);
  },

  // Process notification queue
  processQueue() {
    const now = new Date();
    
    const toDeliver = this.queue.filter(n => {
      if (!n.scheduledFor) return true;
      return new Date(n.scheduledFor) <= now;
    });

    toDeliver.forEach(notification => {
      this.deliver(notification);
    });

    // Remove delivered from queue
    this.queue = this.queue.filter(n => !toDeliver.includes(n));
  },

  // Start notification checker
  startChecker(intervalMinutes = 1) {
    this.checkerInterval = setInterval(() => {
      this.processQueue();
    }, intervalMinutes * 60 * 1000);

    return this;
  },

  // Stop notification checker
  stopChecker() {
    if (this.checkerInterval) {
      clearInterval(this.checkerInterval);
    }
    return this;
  },

  // Get notification statistics
  getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayNotifications = this.history.filter(n => {
      const deliveredDate = new Date(n.deliveredAt);
      return deliveredDate >= today;
    });

    return {
      total: this.history.length,
      today: todayNotifications.length,
      unread: this.getUnreadCount(),
      byType: this.getStatsByType(),
      byPriority: this.getStatsByPriority()
    };
  },

  // Get stats by type
  getStatsByType() {
    const stats = {};
    this.history.forEach(n => {
      stats[n.type] = (stats[n.type] || 0) + 1;
    });
    return stats;
  },

  // Get stats by priority
  getStatsByPriority() {
    const stats = {};
    this.history.forEach(n => {
      stats[n.priority] = (stats[n.priority] || 0) + 1;
    });
    return stats;
  },

  // Export notification history
  exportHistory() {
    return JSON.stringify(this.history, null, 2);
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Notifications };
}
