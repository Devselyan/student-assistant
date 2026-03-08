// Student Assistant Pro - Advanced Notes Module
// Rich notes with folders, tags, and full-text search

const NotesAdvanced = {
  // Create a new note
  createNote(title, content, options = {}) {
    return {
      id: options.id || `note-${Date.now()}`,
      title,
      content,
      folderId: options.folderId || null,
      tags: options.tags || [],
      color: options.color || null,
      isPinned: options.isPinned || false,
      isFavorite: options.isFavorite || false,
      isArchived: options.isArchived || false,
      isDeleted: options.isDeleted || false,
      classId: options.classId || null,
      attachments: options.attachments || [],
      links: options.links || [],
      wordCount: this.countWords(content),
      charCount: content.length,
      createdAt: options.createdAt || new Date().toISOString(),
      updatedAt: options.updatedAt || new Date().toISOString(),
      lastEditedBy: options.lastEditedBy || null,
      version: options.version || 1,
      parentNoteId: options.parentNoteId || null,
      relatedNotes: options.relatedNotes || [],
      customFields: options.customFields || {}
    };
  },

  // Create a folder
  createFolder(name, options = {}) {
    return {
      id: options.id || `folder-${Date.now()}`,
      name,
      parentId: options.parentId || null,
      color: options.color || null,
      icon: options.icon || '📁',
      order: options.order || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  // Create a tag
  createTag(name, color = null) {
    return {
      id: `tag-${Date.now()}`,
      name: name.toLowerCase().trim(),
      color: color || null,
      count: 0
    };
  },

  // Update note
  updateNote(notes, noteId, updates) {
    return notes.map(note => {
      if (note.id === noteId) {
        const updatedNote = {
          ...note,
          ...updates,
          updatedAt: new Date().toISOString(),
          version: (note.version || 1) + 1,
          wordCount: updates.content ? this.countWords(updates.content) : note.wordCount
        };
        return updatedNote;
      }
      return note;
    });
  },

  // Delete note (soft delete)
  deleteNote(notes, noteId) {
    return this.updateNote(notes, noteId, { 
      isDeleted: true, 
      deletedAt: new Date().toISOString() 
    });
  },

  // Permanently delete note
  permanentlyDeleteNote(notes, noteId) {
    return notes.filter(note => note.id !== noteId);
  },

  // Toggle pin
  togglePin(notes, noteId) {
    return notes.map(note => {
      if (note.id === noteId) {
        return {
          ...note,
          isPinned: !note.isPinned,
          updatedAt: new Date().toISOString()
        };
      }
      return note;
    });
  },

  // Toggle favorite
  toggleFavorite(notes, noteId) {
    return notes.map(note => {
      if (note.id === noteId) {
        return {
          ...note,
          isFavorite: !note.isFavorite,
          updatedAt: new Date().toISOString()
        };
      }
      return note;
    });
  },

  // Move note to folder
  moveToFolder(notes, noteId, folderId) {
    return this.updateNote(notes, noteId, { folderId });
  },

  // Add tag to note
  addTag(notes, noteId, tag) {
    return notes.map(note => {
      if (note.id === noteId) {
        const tags = note.tags || [];
        if (!tags.includes(tag)) {
          return {
            ...note,
            tags: [...tags, tag],
            updatedAt: new Date().toISOString()
          };
        }
      }
      return note;
    });
  },

  // Remove tag from note
  removeTag(notes, noteId, tag) {
    return notes.map(note => {
      if (note.id === noteId) {
        return {
          ...note,
          tags: (note.tags || []).filter(t => t !== tag),
          updatedAt: new Date().toISOString()
        };
      }
      return note;
    });
  },

  // Search notes
  searchNotes(notes, query, options = {}) {
    if (!query || !query.trim()) {
      return notes.filter(n => !n.isDeleted);
    }

    const normalizedQuery = query.toLowerCase().trim();
    const {
      searchTitle = true,
      searchContent = true,
      searchTags = true,
      excludeDeleted = true
    } = options;

    return notes.filter(note => {
      if (excludeDeleted && note.isDeleted) return false;

      let match = false;

      if (searchTitle && note.title?.toLowerCase().includes(normalizedQuery)) {
        match = true;
      }

      if (searchContent && note.content?.toLowerCase().includes(normalizedQuery)) {
        match = true;
      }

      if (searchTags && note.tags?.some(t => t.toLowerCase().includes(normalizedQuery))) {
        match = true;
      }

      return match;
    }).sort((a, b) => {
      // Pinned notes first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then by updated date
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  },

  // Advanced search with filters
  advancedSearch(notes, filters = {}) {
    return notes.filter(note => {
      if (note.isDeleted && filters.excludeDeleted !== false) return false;

      // Folder filter
      if (filters.folderId && note.folderId !== filters.folderId) {
        if (filters.includeSubfolders) {
          // Would need folder hierarchy check
          return false;
        }
        return false;
      }

      // Tag filter
      if (filters.tags && filters.tags.length > 0) {
        const hasTag = filters.tags.some(tag => 
          note.tags?.includes(tag)
        );
        if (!hasTag) return false;
      }

      // Class filter
      if (filters.classId && note.classId !== filters.classId) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        const noteDate = new Date(note.createdAt);
        if (noteDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        const noteDate = new Date(note.createdAt);
        if (noteDate > toDate) return false;
      }

      // Pinned filter
      if (filters.pinnedOnly && !note.isPinned) {
        return false;
      }

      // Favorite filter
      if (filters.favoritesOnly && !note.isFavorite) {
        return false;
      }

      // Search query
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const inTitle = note.title?.toLowerCase().includes(query);
        const inContent = note.content?.toLowerCase().includes(query);
        const inTags = note.tags?.some(t => t.toLowerCase().includes(query));
        if (!inTitle && !inContent && !inTags) return false;
      }

      return true;
    });
  },

  // Get notes by folder
  getByFolder(notes, folderId, includeSubfolders = false) {
    let folderNotes = notes.filter(n => n.folderId === folderId && !n.isDeleted);
    
    if (includeSubfolders) {
      // Would need folder hierarchy implementation
    }
    
    return folderNotes.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  },

  // Get notes by tag
  getByTag(notes, tag) {
    return notes.filter(n => 
      !n.isDeleted && n.tags?.includes(tag)
    ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  // Get all tags with counts
  getAllTags(notes) {
    const tagCounts = {};
    
    notes.filter(n => !n.isDeleted).forEach(note => {
      (note.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  },

  // Calculate statistics
  calculateStats(notes) {
    const activeNotes = notes.filter(n => !n.isDeleted && !n.isArchived);
    const archivedNotes = notes.filter(n => n.isArchived && !n.isDeleted);
    const deletedNotes = notes.filter(n => n.isDeleted);

    const totalWords = activeNotes.reduce((sum, n) => sum + (n.wordCount || 0), 0);
    const totalChars = activeNotes.reduce((sum, n) => sum + (n.charCount || 0), 0);

    const pinnedNotes = activeNotes.filter(n => n.isPinned).length;
    const favoriteNotes = activeNotes.filter(n => n.isFavorite).length;

    // Notes created this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const createdThisWeek = activeNotes.filter(n => 
      new Date(n.createdAt) >= weekAgo
    ).length;

    // Notes updated this week
    const updatedThisWeek = activeNotes.filter(n => 
      new Date(n.updatedAt) >= weekAgo
    ).length;

    // Average note length
    const avgLength = activeNotes.length > 0 
      ? Math.round(totalWords / activeNotes.length) 
      : 0;

    // Most used tags
    const tags = this.getAllTags(notes);

    // Notes by folder
    const folders = {};
    activeNotes.forEach(note => {
      const folderId = note.folderId || 'uncategorized';
      folders[folderId] = (folders[folderId] || 0) + 1;
    });

    return {
      total: activeNotes.length,
      archived: archivedNotes.length,
      deleted: deletedNotes.length,
      totalWords,
      totalChars,
      pinned: pinnedNotes,
      favorites: favoriteNotes,
      createdThisWeek,
      updatedThisWeek,
      avgLength,
      tags: tags.slice(0, 10),
      byFolder: folders
    };
  },

  // Count words in text
  countWords(text) {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  },

  // Get reading time (in minutes)
  getReadingTime(text, wordsPerMinute = 200) {
    const words = this.countWords(text);
    return Math.ceil(words / wordsPerMinute);
  },

  // Extract links from content
  extractLinks(content) {
    if (!content) return [];
    
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g;
    const matches = content.match(urlRegex) || [];
    
    return [...new Set(matches)];
  },

  // Generate note preview/excerpt
  generatePreview(content, maxLength = 150) {
    if (!content) return '';
    
    const stripped = content.replace(/[#*_~`]/g, '').trim();
    
    if (stripped.length <= maxLength) return stripped;
    
    return stripped.substring(0, maxLength).trim() + '...';
  },

  // Export notes to Markdown
  exportToMarkdown(note) {
    let md = `# ${note.title}\n\n`;
    
    if (note.tags && note.tags.length > 0) {
      md += `**Tags:** ${note.tags.join(', ')}\n\n`;
    }
    
    if (note.classId) {
      md += `**Class:** ${note.classId}\n\n`;
    }
    
    md += `---\n\n`;
    md += `${note.content}\n`;
    
    if (note.attachments && note.attachments.length > 0) {
      md += `\n---\n\n**Attachments:**\n`;
      note.attachments.forEach(att => {
        md += `- ${att.name} (${att.url})\n`;
      });
    }
    
    md += `\n---\n\n*Created: ${new Date(note.createdAt).toLocaleString()}*  \n`;
    md += `*Last Updated: ${new Date(note.updatedAt).toLocaleString()}*`;
    
    return md;
  },

  // Export all notes to ZIP (would need JSZip library)
  exportAllToZip(notes) {
    // Placeholder for ZIP export functionality
    return {
      notes: notes.map(n => ({
        filename: `${this.sanitizeFilename(n.title)}.md`,
        content: this.exportToMarkdown(n)
      })),
      manifest: JSON.stringify(this.calculateStats(notes), null, 2)
    };
  },

  // Sanitize filename
  sanitizeFilename(filename) {
    return filename
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  },

  // Import notes from Markdown
  importFromMarkdown(markdown, options = {}) {
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled Note';
    
    const content = markdown.replace(/^#\s+(.+$/m, '').trim();
    
    return this.createNote(title, content, options);
  },

  // Find similar notes
  findSimilarNotes(notes, currentNote, limit = 5) {
    if (!currentNote || !currentNote.content) return [];

    const currentWords = new Set(
      currentNote.content.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    );

    return notes
      .filter(n => n.id !== currentNote.id && !n.isDeleted && n.content)
      .map(note => {
        const noteWords = new Set(
          note.content.toLowerCase().split(/\s+/).filter(w => w.length > 3)
        );
        
        const intersection = [...currentWords].filter(w => noteWords.has(w));
        const union = new Set([...currentWords, ...noteWords]);
        
        const similarity = intersection.length / union.size;
        
        return { ...note, similarity };
      })
      .filter(n => n.similarity > 0.1)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  },

  // Create note history/version snapshot
  createVersion(note) {
    return {
      noteId: note.id,
      version: note.version || 1,
      content: note.content,
      title: note.title,
      timestamp: new Date().toISOString(),
      wordCount: note.wordCount
    };
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NotesAdvanced };
}
