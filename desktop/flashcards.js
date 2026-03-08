// Student Assistant Pro - Flashcards Module
// Spaced repetition learning system

const Flashcards = {
  // Spaced repetition intervals (in days)
  intervals: [1, 3, 7, 14, 30, 60, 90, 180, 365],

  // Calculate ease factor (SM-2 algorithm variant)
  calculateEaseFactor(easeFactor, quality) {
    // Quality: 0-5 (5 = perfect, 0 = complete blackout)
    return Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  },

  // Calculate next interval
  calculateInterval(repetitions, easeFactor) {
    if (repetitions === 0) return 1;
    if (repetitions === 1) return 6;
    return Math.round(this.intervals[Math.min(repetitions, this.intervals.length - 1)] * easeFactor);
  },

  // Process card review
  reviewCard(card, quality) {
    const now = new Date();
    const updatedCard = { ...card };

    if (quality >= 3) {
      // Correct answer
      updatedCard.repetitions = (card.repetitions || 0) + 1;
      updatedCard.easeFactor = this.calculateEaseFactor(card.easeFactor || 2.5, quality);
      updatedCard.interval = this.calculateInterval(updatedCard.repetitions, updatedCard.easeFactor);
      updatedCard.nextReview = new Date(now.getTime() + updatedCard.interval * 24 * 60 * 60 * 1000);
      updatedCard.lastReview = now.toISOString();
    } else {
      // Incorrect answer - reset
      updatedCard.repetitions = 0;
      updatedCard.interval = 1;
      updatedCard.nextReview = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      updatedCard.lastReview = now.toISOString();
    }

    updatedCard.history = updatedCard.history || [];
    updatedCard.history.push({
      date: now.toISOString(),
      quality,
      interval: updatedCard.interval
    });

    return updatedCard;
  },

  // Get cards due for review
  getDueCards(deck) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    return deck.cards.filter(card => {
      if (card.repetitions === 0) return true; // New cards
      if (!card.nextReview) return true; // Cards without schedule
      const nextReview = new Date(card.nextReview);
      return nextReview < tomorrow;
    }).sort((a, b) => {
      // Sort by: new cards first, then by next review date
      const aIsNew = a.repetitions === 0;
      const bIsNew = b.repetitions === 0;
      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;
      
      const aDate = a.nextReview ? new Date(a.nextReview) : new Date(0);
      const bDate = b.nextReview ? new Date(b.nextReview) : new Date(0);
      return aDate - bDate;
    });
  },

  // Calculate deck statistics
  calculateDeckStats(deck) {
    if (!deck || !deck.cards || deck.cards.length === 0) {
      return {
        total: 0,
        new: 0,
        learning: 0,
        mastered: 0,
        dueToday: 0,
        dueThisWeek: 0,
        averageEase: 0,
        totalReviews: 0,
        masteryRate: 0
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    let newCards = 0;
    let learningCards = 0;
    let masteredCards = 0;
    let dueToday = 0;
    let dueThisWeek = 0;
    let totalEase = 0;
    let totalReviews = 0;

    deck.cards.forEach(card => {
      const reps = card.repetitions || 0;
      const nextReview = card.nextReview ? new Date(card.nextReview) : null;

      if (reps === 0) {
        newCards++;
      } else if (reps < 5) {
        learningCards++;
      } else {
        masteredCards++;
      }

      if (nextReview) {
        if (nextReview < today) {
          dueToday++;
          dueThisWeek++;
        } else if (nextReview < weekFromNow) {
          dueThisWeek++;
        }
      }

      totalEase += card.easeFactor || 2.5;
      totalReviews += card.history?.length || 0;
    });

    const total = deck.cards.length;

    return {
      total,
      new: newCards,
      learning: learningCards,
      mastered: masteredCards,
      dueToday,
      dueThisWeek,
      averageEase: Math.round((totalEase / total) * 100) / 100,
      totalReviews,
      masteryRate: total > 0 ? Math.round((masteredCards / total) * 100) : 0,
      deckName: deck.name
    };
  },

  // Create a new deck
  createDeck(name, options = {}) {
    return {
      id: options.id || `deck-${Date.now()}`,
      name,
      description: options.description || '',
      classId: options.classId || null,
      cards: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        dailyGoal: options.dailyGoal || 20,
        newCardsPerDay: options.newCardsPerDay || 10,
        reviewOrder: options.reviewOrder || 'due_first'
      },
      stats: {
        totalReviews: 0,
        totalTime: 0,
        lastStudyDate: null
      }
    };
  },

  // Create a new card
  createCard(question, answer, options = {}) {
    return {
      id: options.id || `card-${Date.now()}`,
      question,
      answer,
      hints: options.hints || [],
      tags: options.tags || [],
      difficulty: options.difficulty || 'normal',
      // Spaced repetition data
      repetitions: 0,
      easeFactor: 2.5,
      interval: 0,
      nextReview: null,
      lastReview: null,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  // Import cards from CSV
  importFromCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    const cards = [];

    // Skip header if present
    const startIndex = lines[0].toLowerCase().includes('question') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle CSV with commas in content (quoted fields)
      const parts = this.parseCSVLine(line);
      
      if (parts.length >= 2) {
        cards.push(this.createCard(
          parts[0].trim(),
          parts[1].trim(),
          {
            tags: parts[2] ? parts[2].split(',').map(t => t.trim()) : [],
            hints: parts[3] ? [parts[3].trim()] : []
          }
        ));
      }
    }

    return cards;
  },

  // Parse a single CSV line
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

  // Export deck to CSV
  exportToCSV(deck) {
    let csv = 'Question,Answer,Tags,Hints\n';
    
    deck.cards.forEach(card => {
      const escapeCsv = (str) => {
        if (!str) return '';
        const escaped = str.replace(/"/g, '""');
        return `"${escaped}"`;
      };

      csv += `${escapeCsv(card.question)},${escapeCsv(card.answer)},${escapeCsv(card.tags?.join(', '))},${escapeCsv(card.hints?.[0] || '')}\n`;
    });

    return csv;
  },

  // Export deck to Anki format
  exportToAnki(deck) {
    let txt = '';
    
    deck.cards.forEach(card => {
      txt += `${card.question}\t${card.answer}\n`;
    });

    return txt;
  },

  // Generate study session
  generateStudySession(deck, limit = 20) {
    const dueCards = this.getDueCards(deck);
    const newCards = deck.cards.filter(c => c.repetitions === 0);
    
    const sessionCards = [];
    
    // Add due cards first
    dueCards.slice(0, limit).forEach(card => {
      sessionCards.push({
        ...card,
        isNew: false
      });
    });

    // Fill remaining slots with new cards
    const remainingSlots = limit - sessionCards.length;
    if (remainingSlots > 0) {
      newCards.slice(0, remainingSlots).forEach(card => {
        sessionCards.push({
          ...card,
          isNew: true
        });
      });
    }

    return {
      id: `session-${Date.now()}`,
      deckId: deck.id,
      deckName: deck.name,
      cards: sessionCards,
      totalCards: sessionCards.length,
      currentIndex: 0,
      startedAt: new Date().toISOString(),
      completedAt: null,
      results: []
    };
  },

  // Complete study session
  completeSession(session, results) {
    const completedSession = {
      ...session,
      completedAt: new Date().toISOString(),
      results,
      stats: {
        correct: results.filter(r => r.quality >= 3).length,
        incorrect: results.filter(r => r.quality < 3).length,
        averageQuality: Math.round((results.reduce((sum, r) => sum + r.quality, 0) / results.length) * 10) / 10,
        duration: new Date(session.completedAt || new Date()) - new Date(session.startedAt)
      }
    };

    return completedSession;
  },

  // Calculate mastery level
  getMasteryLevel(card) {
    const reps = card.repetitions || 0;
    const ease = card.easeFactor || 2.5;

    if (reps === 0) return { level: 'new', color: '#667eea' };
    if (reps < 3) return { level: 'learning', color: '#ed8936' };
    if (reps < 7) return { level: 'developing', color: '#4299e1' };
    if (ease < 2.0) return { level: 'struggling', color: '#f56565' };
    return { level: 'mastered', color: '#48bb78' };
  },

  // Get cards by mastery level
  getCardsByMastery(deck) {
    const byLevel = {
      new: [],
      learning: [],
      developing: [],
      struggling: [],
      mastered: []
    };

    deck.cards.forEach(card => {
      const mastery = this.getMasteryLevel(card);
      byLevel[mastery.level].push(card);
    });

    return byLevel;
  },

  // Find similar cards (for duplicate detection)
  findSimilarCards(cards, question, threshold = 0.8) {
    const normalizedQuestion = question.toLowerCase().trim();
    
    return cards.filter(card => {
      const normalizedCardQuestion = card.question.toLowerCase().trim();
      
      // Simple similarity check
      if (normalizedQuestion === normalizedCardQuestion) return true;
      
      // Check if one contains the other
      if (normalizedQuestion.includes(normalizedCardQuestion) || 
          normalizedCardQuestion.includes(normalizedQuestion)) {
        return true;
      }

      // Word overlap
      const questionWords = new Set(normalizedQuestion.split(/\s+/));
      const cardWords = new Set(normalizedCardQuestion.split(/\s+/));
      const overlap = [...questionWords].filter(w => cardWords.has(w)).length;
      const maxWords = Math.max(questionWords.size, cardWords.size);
      
      return overlap / maxWords >= threshold;
    });
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Flashcards };
}
