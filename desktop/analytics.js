// Student Assistant Pro - Analytics Module
// Comprehensive analytics and statistics

const Analytics = {
  // Calculate grade statistics
  calculateGradeStats(grades) {
    if (!grades || grades.length === 0) {
      return {
        average: 0,
        highest: 0,
        lowest: 0,
        median: 0,
        trend: 'stable',
        distribution: {},
        byClass: {}
      };
    }

    const values = grades.map(g => g.grade);
    const sorted = [...values].sort((a, b) => a - b);

    // Average
    const average = values.reduce((a, b) => a + b, 0) / values.length;

    // Highest and Lowest
    const highest = Math.max(...values);
    const lowest = Math.min(...values);

    // Median
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

    // Trend (compare last 5 to previous 5)
    let trend = 'stable';
    if (grades.length >= 10) {
      const recent = values.slice(-5).reduce((a, b) => a + b, 0) / 5;
      const previous = values.slice(-10, -5).reduce((a, b) => a + b, 0) / 5;
      const diff = recent - previous;
      if (diff > 3) trend = 'improving';
      else if (diff < -3) trend = 'declining';
    }

    // Distribution
    const distribution = {
      '90-100': grades.filter(g => g.grade >= 90).length,
      '80-89': grades.filter(g => g.grade >= 80 && g.grade < 90).length,
      '70-79': grades.filter(g => g.grade >= 70 && g.grade < 80).length,
      '60-69': grades.filter(g => g.grade >= 60 && g.grade < 70).length,
      '0-59': grades.filter(g => g.grade < 60).length
    };

    // By class
    const byClass = {};
    grades.forEach(g => {
      if (!byClass[g.classId]) {
        byClass[g.classId] = {
          grades: [],
          average: 0,
          className: g.className || 'Unknown'
        };
      }
      byClass[g.classId].grades.push(g.grade);
    });

    Object.keys(byClass).forEach(classId => {
      const classGrades = byClass[classId].grades;
      byClass[classId].average = classGrades.reduce((a, b) => a + b, 0) / classGrades.length;
      byClass[classId].count = classGrades.length;
    });

    return {
      average: Math.round(average * 10) / 10,
      highest,
      lowest,
      median: Math.round(median * 10) / 10,
      trend,
      distribution,
      byClass,
      total: grades.length
    };
  },

  // Calculate study time statistics
  calculateStudyStats(sessions) {
    if (!sessions || sessions.length === 0) {
      return {
        totalMinutes: 0,
        totalHours: 0,
        averageSession: 0,
        longestSession: 0,
        sessionsToday: 0,
        sessionsThisWeek: 0,
        sessionsThisMonth: 0,
        dailyAverage: 0,
        weeklyChart: [],
        streak: 0
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total time
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalHours = Math.round(totalMinutes / 60);

    // Average session
    const averageSession = Math.round(totalMinutes / sessions.length);

    // Longest session
    const longestSession = Math.max(...sessions.map(s => s.duration || 0));

    // Sessions by period
    const sessionsToday = sessions.filter(s => new Date(s.date) >= today).length;
    const sessionsThisWeek = sessions.filter(s => new Date(s.date) >= weekAgo).length;
    const sessionsThisMonth = sessions.filter(s => new Date(s.date) >= monthAgo).length;

    // Daily average (last 30 days)
    const recentSessions = sessions.filter(s => new Date(s.date) >= monthAgo);
    const recentMinutes = recentSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const dailyAverage = Math.round(recentMinutes / 30);

    // Weekly chart data
    const weeklyChart = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const daySessions = sessions.filter(s => {
        const sDate = new Date(s.date);
        return sDate.getDate() === date.getDate() &&
               sDate.getMonth() === date.getMonth() &&
               sDate.getFullYear() === date.getFullYear();
      });
      const minutes = daySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      weeklyChart.push({
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        value: Math.round(minutes / 60 * 10) / 10,
        date: date.toISOString().split('T')[0]
      });
    }

    // Streak calculation
    let streak = 0;
    let currentDate = today;
    
    // Sort sessions by date descending
    const sortedSessions = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Check if there's a session today or yesterday to start streak
    const hasRecentSession = sortedSessions.some(s => {
      const sDate = new Date(s.date);
      const diffDays = Math.floor((today - sDate) / (24 * 60 * 60 * 1000));
      return diffDays <= 1;
    });

    if (hasRecentSession) {
      for (let i = 0; i < 365; i++) {
        const hasSession = sortedSessions.some(s => {
          const sDate = new Date(s.date);
          return sDate.getDate() === currentDate.getDate() &&
                 sDate.getMonth() === currentDate.getMonth() &&
                 sDate.getFullYear() === currentDate.getFullYear();
        });

        if (hasSession) {
          streak++;
          currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
        } else {
          break;
        }
      }
    }

    return {
      totalMinutes,
      totalHours,
      averageSession,
      longestSession,
      sessionsToday,
      sessionsThisWeek,
      sessionsThisMonth,
      dailyAverage,
      weeklyChart,
      streak,
      totalSessions: sessions.length
    };
  },

  // Calculate assignment statistics
  calculateAssignmentStats(assignments) {
    if (!assignments || assignments.length === 0) {
      return {
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        completionRate: 0,
        byPriority: {},
        upcomingDeadlines: []
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const completed = assignments.filter(a => a.completed).length;
    const pending = assignments.filter(a => !a.completed).length;
    
    const overdue = assignments.filter(a => {
      if (a.completed) return false;
      if (!a.dueDate) return false;
      return new Date(a.dueDate) < today;
    }).length;

    const completionRate = assignments.length > 0 
      ? Math.round((completed / assignments.length) * 100) 
      : 0;

    // By priority
    const byPriority = {
      urgent: assignments.filter(a => a.priority === 'urgent').length,
      high: assignments.filter(a => a.priority === 'high').length,
      medium: assignments.filter(a => a.priority === 'medium').length,
      low: assignments.filter(a => a.priority === 'low').length
    };

    // Upcoming deadlines (next 7 days)
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = assignments
      .filter(a => {
        if (a.completed) return false;
        if (!a.dueDate) return false;
        const dueDate = new Date(a.dueDate);
        return dueDate >= today && dueDate <= weekFromNow;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .map(a => ({
        id: a.id,
        title: a.title,
        dueDate: a.dueDate,
        classId: a.classId,
        className: a.className || 'Unknown',
        daysUntil: Math.ceil((new Date(a.dueDate) - today) / (24 * 60 * 60 * 1000))
      }));

    return {
      total: assignments.length,
      completed,
      pending,
      overdue,
      completionRate,
      byPriority,
      upcomingDeadlines
    };
  },

  // Calculate class attendance statistics
  calculateAttendanceStats(classes, attendance) {
    if (!classes || classes.length === 0) {
      return {
        overall: 0,
        byClass: {}
      };
    }

    const byClass = {};

    classes.forEach(cls => {
      const classAttendance = attendance.filter(a => a.classId === cls.id);
      const total = classAttendance.length;
      const present = classAttendance.filter(a => a.status === 'present').length;
      const absent = classAttendance.filter(a => a.status === 'absent').length;
      const late = classAttendance.filter(a => a.status === 'late').length;

      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      byClass[cls.id] = {
        className: cls.name,
        total,
        present,
        absent,
        late,
        percentage
      };
    });

    // Overall attendance
    const totalPresent = Object.values(byClass).reduce((sum, c) => sum + c.present, 0);
    const totalClasses = Object.values(byClass).reduce((sum, c) => sum + c.total, 0);
    const overall = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

    return {
      overall,
      byClass
    };
  },

  // Generate performance insights
  generateInsights(gradeStats, studyStats, assignmentStats) {
    const insights = [];

    // Grade insights
    if (gradeStats.average >= 90) {
      insights.push({
        type: 'success',
        title: 'Excellent Grades',
        message: `You're maintaining an average of ${gradeStats.average}%! Keep up the great work.`
      });
    } else if (gradeStats.average >= 80) {
      insights.push({
        type: 'info',
        title: 'Good Progress',
        message: `Your average is ${gradeStats.average}%. You're doing well, but there's room for improvement.`
      });
    } else if (gradeStats.average < 70) {
      insights.push({
        type: 'warning',
        title: 'Needs Attention',
        message: `Your average is ${gradeStats.average}%. Consider dedicating more study time.`
      });
    }

    // Trend insights
    if (gradeStats.trend === 'improving') {
      insights.push({
        type: 'success',
        title: 'Improving Trend',
        message: 'Your grades are trending upward! Your recent efforts are paying off.'
      });
    } else if (gradeStats.trend === 'declining') {
      insights.push({
        type: 'warning',
        title: 'Declining Trend',
        message: 'Your grades have been declining recently. Consider reviewing your study habits.'
      });
    }

    // Study time insights
    if (studyStats.streak >= 7) {
      insights.push({
        type: 'success',
        title: 'Study Streak',
        message: `You've studied ${studyStats.streak} days in a row! That's impressive dedication.`
      });
    }

    if (studyStats.totalHours < 10 && studyStats.streak < 3) {
      insights.push({
        type: 'info',
        title: 'Study More',
        message: 'Try to study at least 30 minutes daily for better retention.'
      });
    }

    // Assignment insights
    if (assignmentStats.overdue > 0) {
      insights.push({
        type: 'danger',
        title: 'Overdue Assignments',
        message: `You have ${assignmentStats.overdue} overdue assignment(s). Prioritize completing these.`
      });
    }

    if (assignmentStats.completionRate >= 80) {
      insights.push({
        type: 'success',
        title: 'Great Completion Rate',
        message: `You've completed ${assignmentStats.completionRate}% of your assignments!`
      });
    } else if (assignmentStats.completionRate < 50) {
      insights.push({
        type: 'warning',
        title: 'Assignment Backlog',
        message: `Only ${assignmentStats.completionRate}% of assignments completed. Focus on catching up.`
      });
    }

    return insights;
  },

  // Export analytics data
  exportAnalytics(allData) {
    const gradeStats = this.calculateGradeStats(allData.grades || []);
    const studyStats = this.calculateStudyStats(allData.studySessions || []);
    const assignmentStats = this.calculateAssignmentStats(allData.assignments || []);
    const insights = this.generateInsights(gradeStats, studyStats, assignmentStats);

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        totalClasses: allData.classes?.length || 0,
        totalAssignments: allData.assignments?.length || 0,
        totalExams: allData.exams?.length || 0,
        totalNotes: allData.notes?.length || 0,
        totalGrades: allData.grades?.length || 0
      },
      grades: gradeStats,
      study: studyStats,
      assignments: assignmentStats,
      insights
    };
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Analytics };
}
