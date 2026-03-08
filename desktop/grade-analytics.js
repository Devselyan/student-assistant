// Student Assistant Pro - Grade Analytics Module
// Advanced grade tracking with trends, predictions, and goal setting

const GradeAnalytics = {
  // Calculate weighted average
  calculateWeightedAverage(grades) {
    if (!grades || grades.length === 0) return 0;

    let totalWeight = 0;
    let weightedSum = 0;

    grades.forEach(grade => {
      const weight = grade.weight || 0;
      totalWeight += weight;
      weightedSum += grade.grade * weight;
    });

    if (totalWeight === 0) {
      // If no weights, use simple average
      return grades.reduce((sum, g) => sum + g.grade, 0) / grades.length;
    }

    return weightedSum / totalWeight;
  },

  // Calculate grade needed on final exam
  calculateNeededGrade(grades, targetFinal, finalWeight) {
    const currentGrades = grades.filter(g => !g.isFinal);
    const currentAverage = this.calculateWeightedAverage(currentGrades);
    const currentWeight = currentGrades.reduce((sum, g) => sum + (g.weight || 0), 0);
    
    const remainingWeight = 100 - currentWeight;
    const neededOnFinal = (targetFinal * 100 - currentAverage * currentWeight) / finalWeight;
    
    return {
      needed: Math.round(neededOnFinal * 10) / 10,
      possible: neededOnFinal <= 100,
      currentAverage: Math.round(currentAverage * 10) / 10,
      currentWeight
    };
  },

  // Predict final grade based on current performance
  predictFinalGrade(grades, remainingAssignments = []) {
    const completed = grades.filter(g => !g.isPending);
    const pending = grades.filter(g => g.isPending);
    
    const completedAverage = this.calculateWeightedAverage(completed);
    const completedWeight = completed.reduce((sum, g) => sum + (g.weight || 0), 0);
    
    // If we have pending assignments with weights
    if (pending.length > 0) {
      const pendingAverage = this.calculateWeightedAverage(pending);
      const pendingWeight = pending.reduce((sum, g) => sum + (g.weight || 0), 0);
      
      const predictedSum = (completedAverage * completedWeight) + (pendingAverage * pendingWeight);
      const totalWeight = completedWeight + pendingWeight;
      
      return {
        predicted: Math.round((predictedSum / totalWeight) * 10) / 10,
        minPossible: this.calculateMinGrade(completed, pending),
        maxPossible: this.calculateMaxGrade(completed, pending),
        confidence: 'medium'
      };
    }
    
    // If no pending assignments, current average is final
    return {
      predicted: Math.round(completedAverage * 10) / 10,
      minPossible: Math.round(completedAverage * 10) / 10,
      maxPossible: Math.round(completedAverage * 10) / 10,
      confidence: 'high'
    };
  },

  // Calculate minimum possible grade
  calculateMinGrade(completed, pending) {
    const completedSum = completed.reduce((sum, g) => sum + (g.grade * (g.weight || 0)), 0);
    const completedWeight = completed.reduce((sum, g) => sum + (g.weight || 0), 0);
    const pendingWeight = pending.reduce((sum, g) => sum + (g.weight || 0), 0);
    
    // Assume 0 on all pending
    return Math.round((completedSum / (completedWeight + pendingWeight)) * 10) / 10;
  },

  // Calculate maximum possible grade
  calculateMaxGrade(completed, pending) {
    const completedSum = completed.reduce((sum, g) => sum + (g.grade * (g.weight || 0)), 0);
    const completedWeight = completed.reduce((sum, g) => sum + (g.weight || 0), 0);
    const pendingWeight = pending.reduce((sum, g) => sum + (g.weight || 0), 0);
    
    // Assume 100 on all pending
    const maxSum = completedSum + (100 * pendingWeight);
    return Math.round((maxSum / (completedWeight + pendingWeight)) * 10) / 10;
  },

  // Analyze grade trends
  analyzeTrend(grades) {
    if (grades.length < 2) {
      return {
        direction: 'stable',
        slope: 0,
        confidence: 'low',
        message: 'Not enough data to analyze trends'
      };
    }

    // Sort by date
    const sorted = [...grades].sort((a, b) => 
      new Date(a.date || 0) - new Date(b.date || 0)
    );

    // Calculate trend using last 5 grades
    const recent = sorted.slice(-5);
    const grades_only = recent.map(g => g.grade);
    
    // Simple linear regression
    const n = grades_only.length;
    const xSum = n * (n + 1) / 2;
    const ySum = grades_only.reduce((a, b) => a + b, 0);
    const xySum = grades_only.reduce((sum, g, i) => sum + (i + 1) * g, 0);
    const xxSum = n * (n + 1) * (2 * n + 1) / 6;

    const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);

    let direction = 'stable';
    if (slope > 1) direction = 'improving';
    else if (slope < -1) direction = 'declining';

    let confidence = 'low';
    if (recent.length >= 5) confidence = 'high';
    else if (recent.length >= 3) confidence = 'medium';

    return {
      direction,
      slope: Math.round(slope * 100) / 100,
      confidence,
      message: this.getTrendMessage(direction, slope),
      recent: recent.map(g => ({
        name: g.name,
        grade: g.grade,
        date: g.date
      }))
    };
  },

  // Get trend message
  getTrendMessage(direction, slope) {
    switch (direction) {
      case 'improving':
        return `Your grades are improving! You're gaining about ${Math.abs(slope)} points per assignment.`;
      case 'declining':
        return `Your grades are declining. You're losing about ${Math.abs(slope)} points per assignment.`;
      default:
        return 'Your grades are stable. Keep up the consistent work!';
    }
  },

  // Compare performance across classes
  compareClasses(classGrades) {
    const comparisons = [];

    Object.entries(classGrades).forEach(([classId, grades]) => {
      const average = this.calculateWeightedAverage(grades);
      const trend = this.analyzeTrend(grades);
      const count = grades.length;

      comparisons.push({
        classId,
        className: grades[0]?.className || 'Unknown',
        average: Math.round(average * 10) / 10,
        gradeCount: count,
        trend: trend.direction,
        trendSlope: trend.slope
      });
    });

    return comparisons.sort((a, b) => b.average - a.average);
  },

  // Set and track grade goals
  trackGoals(grades, goals) {
    const results = [];

    goals.forEach(goal => {
      const classGrades = grades.filter(g => g.classId === goal.classId);
      const currentAverage = this.calculateWeightedAverage(classGrades);
      
      const difference = goal.target - currentAverage;
      const isOnTrack = difference <= 0;
      
      let actionNeeded = null;
      if (!isOnTrack) {
        const remainingAssignments = goal.remainingAssignments || 3;
        const neededPerAssignment = difference / remainingAssignments;
        actionNeeded = `Need to score ${Math.round(currentAverage + neededPerAssignment)}% on next ${remainingAssignments} assignments`;
      }

      results.push({
        classId: goal.classId,
        className: goal.className,
        target: goal.target,
        current: Math.round(currentAverage * 10) / 10,
        difference: Math.round(difference * 10) / 10,
        isOnTrack,
        actionNeeded,
        progress: Math.min(100, Math.round((currentAverage / goal.target) * 100))
      });
    });

    return results;
  },

  // Generate grade distribution
  generateDistribution(grades, bins = 10) {
    const distribution = Array(bins).fill(0);
    
    grades.forEach(grade => {
      const binIndex = Math.min(Math.floor(grade.grade / (100 / bins)), bins - 1);
      distribution[binIndex]++;
    });

    return distribution.map((count, index) => ({
      range: `${index * (100 / bins)}-${(index + 1) * (100 / bins)}`,
      count,
      percentage: grades.length > 0 ? Math.round((count / grades.length) * 100) : 0
    }));
  },

  // Calculate standard deviation
  calculateStandardDeviation(grades) {
    if (grades.length === 0) return 0;

    const average = grades.reduce((sum, g) => sum + g.grade, 0) / grades.length;
    const squareDiffs = grades.map(g => Math.pow(g.grade - average, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, sq) => sum + sq, 0) / grades.length;
    
    return Math.round(Math.sqrt(avgSquareDiff) * 10) / 10;
  },

  // Identify at-risk students (for teachers) or self-assessment
  identifyAtRisk(grades, threshold = 70) {
    const classGrades = {};

    grades.forEach(grade => {
      if (!classGrades[grade.classId]) {
        classGrades[grade.classId] = {
          classId: grade.classId,
          className: grade.className,
          grades: [],
          average: 0,
          atRisk: false
        };
      }
      classGrades[grade.classId].grades.push(grade);
    });

    Object.values(classGrades).forEach(cls => {
      cls.average = this.calculateWeightedAverage(cls.grades);
      cls.atRisk = cls.average < threshold;
    });

    return Object.values(classGrades).filter(c => c.atRisk);
  },

  // Generate insights and recommendations
  generateInsights(grades, goals = []) {
    const insights = [];
    const stats = this.calculateStats(grades);

    // Overall performance insights
    if (stats.average >= 90) {
      insights.push({
        type: 'success',
        category: 'performance',
        title: 'Excellent Performance',
        message: `You're maintaining an A average (${stats.average}%). Outstanding work!`,
        priority: 'low'
      });
    } else if (stats.average >= 80) {
      insights.push({
        type: 'info',
        category: 'performance',
        title: 'Good Performance',
        message: `You have a B average (${stats.average}%). Keep pushing for an A!`,
        priority: 'medium'
      });
    } else if (stats.average >= 70) {
      insights.push({
        type: 'warning',
        category: 'performance',
        title: 'Room for Improvement',
        message: `Your average is ${stats.average}%. Focus on improving your grades.`,
        priority: 'high'
      });
    } else {
      insights.push({
        type: 'danger',
        category: 'performance',
        title: 'Needs Attention',
        message: `Your average is ${stats.average}%. Consider seeking extra help.`,
        priority: 'urgent'
      });
    }

    // Trend insights
    const trend = this.analyzeTrend(grades);
    if (trend.direction === 'improving') {
      insights.push({
        type: 'success',
        category: 'trend',
        title: 'Positive Trend',
        message: trend.message,
        priority: 'low'
      });
    } else if (trend.direction === 'declining') {
      insights.push({
        type: 'warning',
        category: 'trend',
        title: 'Concerning Trend',
        message: trend.message,
        priority: 'high'
      });
    }

    // Goal tracking insights
    if (goals.length > 0) {
      const goalResults = this.trackGoals(grades, goals);
      const offTrackGoals = goalResults.filter(g => !g.isOnTrack);
      
      if (offTrackGoals.length > 0) {
        insights.push({
          type: 'warning',
          category: 'goals',
          title: 'Goals At Risk',
          message: `${offTrackGoals.length} goal(s) need attention. ${offTrackGoals[0].actionNeeded}`,
          priority: 'high'
        });
      }
    }

    // Consistency insights
    if (stats.stdDev > 15) {
      insights.push({
        type: 'info',
        category: 'consistency',
        title: 'Inconsistent Performance',
        message: `Your grades vary significantly (±${stats.stdDev}%). Try to be more consistent.`,
        priority: 'medium'
      });
    }

    return insights;
  },

  // Calculate comprehensive statistics
  calculateStats(grades) {
    if (!grades || grades.length === 0) {
      return {
        average: 0,
        highest: 0,
        lowest: 0,
        median: 0,
        stdDev: 0,
        count: 0,
        weightedAverage: 0
      };
    }

    const values = grades.map(g => g.grade);
    const sorted = [...values].sort((a, b) => a - b);

    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const highest = Math.max(...values);
    const lowest = Math.min(...values);
    
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

    const stdDev = this.calculateStandardDeviation(grades);
    const weightedAverage = this.calculateWeightedAverage(grades);

    return {
      average: Math.round(average * 10) / 10,
      highest,
      lowest,
      median: Math.round(median * 10) / 10,
      stdDev,
      count: grades.length,
      weightedAverage: Math.round(weightedAverage * 10) / 10
    };
  },

  // Export grade report
  exportReport(grades, className = 'Grades') {
    let report = `# Grade Report: ${className}\n\n`;
    report += `*Generated: ${new Date().toLocaleString()}*\n\n`;
    
    const stats = this.calculateStats(grades);
    const trend = this.analyzeTrend(grades);
    
    report += `## Summary\n\n`;
    report += `- **Average:** ${stats.average}%\n`;
    report += `- **Weighted Average:** ${stats.weightedAverage}%\n`;
    report += `- **Highest:** ${stats.highest}%\n`;
    report += `- **Lowest:** ${stats.lowest}%\n`;
    report += `- **Median:** ${stats.median}%\n`;
    report += `- **Standard Deviation:** ±${stats.stdDev}%\n`;
    report += `- **Total Grades:** ${stats.count}\n\n`;
    
    report += `## Trend Analysis\n\n`;
    report += `- **Direction:** ${trend.direction}\n`;
    report += `- **Slope:** ${trend.slope}\n`;
    report += `- **Confidence:** ${trend.confidence}\n`;
    report += `- **Analysis:** ${trend.message}\n\n`;
    
    report += `## Grade List\n\n`;
    report += `| Name | Grade | Weight | Date |\n`;
    report += `|------|-------|--------|------|\n`;
    
    grades.forEach(g => {
      report += `| ${g.name} | ${g.grade}% | ${g.weight || 0}% | ${g.date || 'N/A'} |\n`;
    });
    
    return report;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GradeAnalytics };
}
