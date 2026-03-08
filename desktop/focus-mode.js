// Student Assistant Pro - Focus Mode Module
// Pomodoro timer with ambient sounds and distraction blocking

const FocusMode = {
  // Default settings
  defaults: {
    workDuration: 25 * 60, // 25 minutes
    shortBreak: 5 * 60, // 5 minutes
    longBreak: 15 * 60, // 15 minutes
    sessionsBeforeLongBreak: 4,
    autoStartBreaks: false,
    autoStartWork: false,
    showNotifications: true,
    playSound: true
  },

  // Ambient sounds
  sounds: {
    rain: {
      name: 'Rain',
      icon: '🌧️',
      url: null // Would be actual audio file
    },
    forest: {
      name: 'Forest',
      icon: '🌲',
      url: null
    },
    ocean: {
      name: 'Ocean Waves',
      icon: '🌊',
      url: null
    },
    cafe: {
      name: 'Café',
      icon: '☕',
      url: null
    },
    whiteNoise: {
      name: 'White Noise',
      icon: '📻',
      url: null
    },
    fireplace: {
      name: 'Fireplace',
      icon: '🔥',
      url: null
    },
    library: {
      name: 'Library',
      icon: '📚',
      url: null
    },
    night: {
      name: 'Night Sounds',
      icon: '🌙',
      url: null
    }
  },

  // Create focus session
  createSession(options = {}) {
    const settings = { ...this.defaults, ...options };
    
    return {
      id: `focus-${Date.now()}`,
      status: 'idle', // idle, running, paused, completed
      mode: 'work', // work, shortBreak, longBreak
      timeRemaining: settings.workDuration,
      currentSession: 1,
      totalSessions: 0,
      completedSessions: 0,
      settings,
      startTime: null,
      endTime: null,
      pauses: [],
      history: []
    };
  },

  // Start session
  start(session) {
    if (session.status === 'running') return session;
    
    return {
      ...session,
      status: 'running',
      startTime: session.startTime || new Date().toISOString()
    };
  },

  // Pause session
  pause(session) {
    if (session.status !== 'running') return session;
    
    const pauses = [...session.pauses, {
      startTime: new Date().toISOString(),
      endTime: null
    }];
    
    return {
      ...session,
      status: 'paused',
      pauses
    };
  },

  // Resume session
  resume(session) {
    if (session.status !== 'paused') return session;
    
    const pauses = session.pauses.map((p, i) => {
      if (i === session.pauses.length - 1 && !p.endTime) {
        return { ...p, endTime: new Date().toISOString() };
      }
      return p;
    });
    
    return {
      ...session,
      status: 'running',
      pauses
    };
  },

  // Stop session
  stop(session) {
    return {
      ...session,
      status: 'idle',
      timeRemaining: session.settings.workDuration,
      mode: 'work',
      pauses: []
    };
  },

  // Complete current session
  complete(session) {
    const history = [...session.history, {
      mode: session.mode,
      duration: session.settings[session.mode === 'work' ? 'workDuration' : 
                session.mode === 'shortBreak' ? 'shortBreak' : 'longBreak'],
      completedAt: new Date().toISOString()
    }];

    let nextMode = 'work';
    let nextSession = session.currentSession + 1;
    let timeRemaining = session.settings.workDuration;

    if (session.mode === 'work') {
      // After work session, take a break
      if (session.currentSession % session.settings.sessionsBeforeLongBreak === 0) {
        nextMode = 'longBreak';
        timeRemaining = session.settings.longBreak;
      } else {
        nextMode = 'shortBreak';
        timeRemaining = session.settings.shortBreak;
      }
    } else {
      // After break, go back to work
      nextMode = 'work';
      timeRemaining = session.settings.workDuration;
    }

    return {
      ...session,
      status: session.settings.autoStartBreaks && nextMode !== 'work' ? 'running' : 'idle',
      mode: nextMode,
      timeRemaining,
      currentSession: nextSession,
      completedSessions: session.completedSessions + (session.mode === 'work' ? 1 : 0),
      history,
      startTime: session.settings.autoStartBreaks ? new Date().toISOString() : null
    };
  },

  // Update time remaining
  tick(session, seconds = 1) {
    if (session.status !== 'running') return session;
    
    const newTimeRemaining = session.timeRemaining - seconds;
    
    if (newTimeRemaining <= 0) {
      return this.complete(session);
    }
    
    return {
      ...session,
      timeRemaining: newTimeRemaining
    };
  },

  // Calculate session statistics
  calculateStats(sessions) {
    if (!sessions || sessions.length === 0) {
      return {
        totalFocusTime: 0,
        totalBreakTime: 0,
        completedSessions: 0,
        averageSessionLength: 0,
        longestStreak: 0,
        todaySessions: 0,
        todayFocusTime: 0,
        weeklyChart: []
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    let totalFocusTime = 0;
    let totalBreakTime = 0;
    let completedSessions = 0;
    let sessionLengths = [];
    let todaySessions = 0;
    let todayFocusTime = 0;

    sessions.forEach(session => {
      session.history?.forEach(entry => {
        const duration = entry.duration || 0;
        const entryDate = new Date(entry.completedAt);
        
        if (entry.mode === 'work') {
          totalFocusTime += duration;
          sessionLengths.push(duration);
          
          if (entryDate >= today) {
            todaySessions++;
            todayFocusTime += duration;
          }
        } else {
          totalBreakTime += duration;
        }
      });
    });

    // Calculate longest streak
    let longestStreak = 0;
    let currentStreak = 0;
    let lastDate = null;

    const workSessions = sessions
      .flatMap(s => s.history?.filter(h => h.mode === 'work').map(h => new Date(h.completedAt)) || [])
      .sort((a, b) => a - b);

    workSessions.forEach(date => {
      const sessionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      if (lastDate === null) {
        currentStreak = 1;
      } else {
        const diffDays = (sessionDate - lastDate) / (24 * 60 * 60 * 1000);
        if (diffDays <= 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      }
      lastDate = sessionDate;
    });
    longestStreak = Math.max(longestStreak, currentStreak);

    // Weekly chart data
    const weeklyChart = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const daySessions = sessions.filter(s => {
        const sDate = new Date(s.startTime);
        return sDate.getDate() === date.getDate() &&
               sDate.getMonth() === date.getMonth() &&
               sDate.getFullYear() === date.getFullYear();
      });
      
      const dayFocusTime = daySessions.reduce((sum, s) => {
        return sum + (s.history?.filter(h => h.mode === 'work')
          .reduce((hSum, h) => hSum + (h.duration || 0), 0) || 0);
      }, 0);
      
      weeklyChart.push({
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        value: Math.round(dayFocusTime / 60), // in minutes
        date: date.toISOString().split('T')[0]
      });
    }

    return {
      totalFocusTime: Math.round(totalFocusTime / 60), // in minutes
      totalBreakTime: Math.round(totalBreakTime / 60),
      completedSessions,
      averageSessionLength: sessionLengths.length > 0 
        ? Math.round(sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length / 60) 
        : 0,
      longestStreak,
      todaySessions,
      todayFocusTime: Math.round(todayFocusTime / 60),
      weeklyChart
    };
  },

  // Format time for display
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  // Get session progress percentage
  getProgress(session) {
    const total = session.settings[session.mode === 'work' ? 'workDuration' : 
                   session.mode === 'shortBreak' ? 'shortBreak' : 'longBreak'];
    return Math.round(((total - session.timeRemaining) / total) * 100);
  },

  // Generate focus insights
  generateInsights(stats) {
    const insights = [];

    if (stats.todayFocusTime >= 120) {
      insights.push({
        type: 'success',
        title: 'Great Focus Today',
        message: `You've focused for ${stats.todayFocusTime} minutes today! Excellent work.`
      });
    } else if (stats.todayFocusTime < 30 && stats.todaySessions === 0) {
      insights.push({
        type: 'info',
        title: 'Start Your Day',
        message: 'Try to complete at least one focus session today.'
      });
    }

    if (stats.longestStreak >= 7) {
      insights.push({
        type: 'success',
        title: 'Consistent Streak',
        message: `You have a ${stats.longestStreak}-day focus streak! Keep it up.`
      });
    }

    if (stats.totalFocusTime < 60) {
      insights.push({
        type: 'warning',
        title: 'Build Focus Habit',
        message: 'Aim for at least 1 hour of focused work daily.'
      });
    }

    return insights;
  },

  // Play notification sound
  playNotificationSound() {
    // Would implement actual audio playback
    console.log('Playing notification sound...');
  },

  // Send notification
  sendNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192.png'
      });
    }
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FocusMode };
}
