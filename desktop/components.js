// Student Assistant Pro - UI Components
// Reusable component builders

const Components = {
  // Create a button
  button(text, options = {}) {
    const {
      variant = 'primary',
      size = 'md',
      icon = null,
      onClick = null,
      disabled = false,
      className = ''
    } = options;

    const variants = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      danger: 'btn-danger',
      success: 'btn-success',
      ghost: 'btn-ghost'
    };

    const sizes = {
      sm: 'btn-sm',
      md: 'btn-md',
      lg: 'btn-lg'
    };

    const iconHtml = icon ? `<span class="btn-icon">${icon}</span>` : '';
    const clickHandler = onClick ? `onclick="${onClick}"` : '';

    return `
      <button 
        class="btn ${variants[variant]} ${sizes[size]} ${className}" 
        ${clickHandler}
        ${disabled ? 'disabled' : ''}
      >
        ${iconHtml}
        <span class="btn-text">${text}</span>
      </button>
    `;
  },

  // Create a card
  card(content, options = {}) {
    const {
      title = null,
      subtitle = null,
      headerActions = null,
      footer = null,
      className = '',
      hoverable = false
    } = options;

    const hoverClass = hoverable ? 'card-hoverable' : '';

    let html = `<div class="card ${hoverClass} ${className}">`;

    if (title || headerActions) {
      html += `<div class="card-header">`;
      if (title) {
        html += `<h3 class="card-title">${title}</h3>`;
        if (subtitle) {
          html += `<p class="card-subtitle">${subtitle}</p>`;
        }
      }
      if (headerActions) {
        html += `<div class="card-actions">${headerActions}</div>`;
      }
      html += `</div>`;
    }

    html += `<div class="card-body">${content}</div>`;

    if (footer) {
      html += `<div class="card-footer">${footer}</div>`;
    }

    html += `</div>`;
    return html;
  },

  // Create an input field
  input(options = {}) {
    const {
      type = 'text',
      label = null,
      placeholder = '',
      value = '',
      id = null,
      name = null,
      required = false,
      disabled = false,
      error = null,
      hint = null,
      icon = null
    } = options;

    const inputId = id || name || `input-${Date.now()}`;
    const errorClass = error ? 'input-error' : '';

    let html = `<div class="input-group ${errorClass}">`;

    if (label) {
      html += `<label for="${inputId}" class="input-label">${label}`;
      if (required) {
        html += `<span class="required">*</span>`;
      }
      html += `</label>`;
    }

    html += `<div class="input-wrapper">`;

    if (icon) {
      html += `<span class="input-icon">${icon}</span>`;
    }

    html += `
      <input 
        type="${type}" 
        id="${inputId}" 
        name="${name}"
        class="input-field ${icon ? 'input-with-icon' : ''}"
        placeholder="${placeholder}"
        value="${value}"
        ${required ? 'required' : ''}
        ${disabled ? 'disabled' : ''}
      />
    `;

    html += `</div>`;

    if (error) {
      html += `<span class="input-error-message">${error}</span>`;
    }

    if (hint) {
      html += `<span class="input-hint">${hint}</span>`;
    }

    html += `</div>`;
    return html;
  },

  // Create a select dropdown
  select(options = {}) {
    const {
      label = null,
      options: selectOptions = [],
      value = '',
      id = null,
      name = null,
      required = false,
      disabled = false,
      placeholder = 'Select an option'
    } = options;

    const selectId = id || name || `select-${Date.now()}`;

    let html = `<div class="input-group">`;

    if (label) {
      html += `<label for="${selectId}" class="input-label">${label}`;
      if (required) {
        html += `<span class="required">*</span>`;
      }
      html += `</label>`;
    }

    html += `<select id="${selectId}" name="${name}" class="input-field" ${required ? 'required' : ''} ${disabled ? 'disabled' : ''}>`;
    html += `<option value="">${placeholder}</option>`;

    selectOptions.forEach(opt => {
      const selected = opt.value === value ? 'selected' : '';
      html += `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
    });

    html += `</select></div>`;
    return html;
  },

  // Create a textarea
  textarea(options = {}) {
    const {
      label = null,
      placeholder = '',
      value = '',
      id = null,
      name = null,
      rows = 4,
      required = false,
      disabled = false,
      maxLength = null
    } = options;

    const inputId = id || name || `textarea-${Date.now()}`;

    let html = `<div class="input-group">`;

    if (label) {
      html += `<label for="${inputId}" class="input-label">${label}`;
      if (required) {
        html += `<span class="required">*</span>`;
      }
      html += `</label>`;
    }

    html += `
      <textarea 
        id="${inputId}" 
        name="${name}"
        class="input-field textarea"
        placeholder="${placeholder}"
        rows="${rows}"
        ${required ? 'required' : ''}
        ${disabled ? 'disabled' : ''}
        ${maxLength ? `maxlength="${maxLength}"` : ''}
      >${value}</textarea>
    `;

    if (maxLength) {
      html += `<div class="textarea-counter"><span class="current-length">0</span> / ${maxLength}</div>`;
    }

    html += `</div>`;
    return html;
  },

  // Create a badge
  badge(text, options = {}) {
    const {
      variant = 'default',
      size = 'md',
      icon = null
    } = options;

    const variants = {
      default: 'badge-default',
      primary: 'badge-primary',
      success: 'badge-success',
      warning: 'badge-warning',
      danger: 'badge-danger',
      info: 'badge-info'
    };

    const sizes = {
      sm: 'badge-sm',
      md: 'badge-md',
      lg: 'badge-lg'
    };

    const iconHtml = icon ? `<span class="badge-icon">${icon}</span>` : '';

    return `
      <span class="badge ${variants[variant]} ${sizes[size]}">
        ${iconHtml}
        <span class="badge-text">${text}</span>
      </span>
    `;
  },

  // Create an avatar
  avatar(name, options = {}) {
    const {
      size = 'md',
      src = null,
      showStatus = false,
      status = 'online'
    } = options;

    const sizes = {
      sm: 'avatar-sm',
      md: 'avatar-md',
      lg: 'avatar-lg',
      xl: 'avatar-xl'
    };

    const initials = this.getInitials(name);

    let html = `<div class="avatar ${sizes[size]}">`;

    if (src) {
      html += `<img src="${src}" alt="${name}" class="avatar-image"/>`;
    } else {
      html += `<div class="avatar-placeholder">${initials}</div>`;
    }

    if (showStatus) {
      const statusColors = {
        online: 'status-online',
        offline: 'status-offline',
        busy: 'status-busy',
        away: 'status-away'
      };
      html += `<span class="avatar-status ${statusColors[status]}"></span>`;
    }

    html += `</div>`;
    return html;
  },

  // Create a tooltip
  tooltip(content, options = {}) {
    const {
      text = 'Hover me',
      position = 'top'
    } = options;

    const positions = {
      top: 'tooltip-top',
      bottom: 'tooltip-bottom',
      left: 'tooltip-left',
      right: 'tooltip-right'
    };

    return `
      <div class="tooltip-container ${positions[position]}">
        ${text}
        <span class="tooltip-content">${content}</span>
      </div>
    `;
  },

  // Create a progress bar
  progress(value, options = {}) {
    const {
      max = 100,
      showValue = false,
      variant = 'primary',
      size = 'md',
      animated = false
    } = options;

    const percentage = (value / max) * 100;

    const variants = {
      primary: 'progress-primary',
      success: 'progress-success',
      warning: 'progress-warning',
      danger: 'progress-danger'
    };

    const sizes = {
      sm: 'progress-sm',
      md: 'progress-md',
      lg: 'progress-lg'
    };

    const animatedClass = animated ? 'progress-animated' : '';

    let html = `<div class="progress-bar ${sizes[size]}">`;
    html += `<div class="progress-track">`;
    html += `<div 
      class="progress-fill ${variants[variant]} ${animatedClass}" 
      style="width: ${percentage}%"
      role="progressbar"
      aria-valuenow="${value}"
      aria-valuemin="0"
      aria-valuemax="${max}"
    >`;

    if (showValue && percentage > 15) {
      html += `<span class="progress-value">${Math.round(percentage)}%</span>`;
    }

    html += `</div></div>`;

    if (showValue && percentage <= 15) {
      html += `<span class="progress-value-outside">${Math.round(percentage)}%</span>`;
    }

    html += `</div>`;
    return html;
  },

  // Create a table
  table(columns, rows, options = {}) {
    const {
      hoverable = true,
      striped = false,
      compact = false,
      sortable = false
    } = options;

    let html = `<div class="table-container">`;
    html += `<table class="data-table ${hoverable ? 'table-hoverable' : ''} ${striped ? 'table-striped' : ''} ${compact ? 'table-compact' : ''}">`;

    // Header
    html += `<thead><tr>`;
    columns.forEach(col => {
      const sortClass = sortable && col.sortable ? 'sortable' : '';
      html += `<th class="${sortClass}" data-sort="${col.key || ''}">${col.header}</th>`;
    });
    html += `</tr></thead>`;

    // Body
    html += `<tbody>`;
    rows.forEach((row, index) => {
      html += `<tr>`;
      columns.forEach(col => {
        const cellValue = col.render ? col.render(row[col.key], row) : row[col.key];
        html += `<td>${cellValue}</td>`;
      });
      html += `</tr>`;
    });
    html += `</tbody>`;

    html += `</table></div>`;
    return html;
  },

  // Create a list
  list(items, options = {}) {
    const {
      type = 'default',
      interactive = false,
      showIndex = false
    } = options;

    const types = {
      default: 'list-default',
      bordered: 'list-bordered',
      divided: 'list-divided'
    };

    let html = `<ul class="list ${types[type]} ${interactive ? 'list-interactive' : ''}">`;

    items.forEach((item, index) => {
      html += `<li class="list-item" ${interactive ? 'tabindex="0"' : ''}>`;

      if (showIndex) {
        html += `<span class="list-index">${index + 1}</span>`;
      }

      if (typeof item === 'string') {
        html += `<span class="list-content">${item}</span>`;
      } else {
        html += `<span class="list-content">${item.content}</span>`;
        if (item.meta) {
          html += `<span class="list-meta">${item.meta}</span>`;
        }
        if (item.action) {
          html += `<span class="list-action">${item.action}</span>`;
        }
      }

      html += `</li>`;
    });

    html += `</ul>`;
    return html;
  },

  // Create a modal
  modal(content, options = {}) {
    const {
      title = '',
      size = 'md',
      showClose = true,
      footer = null,
      id = null
    } = options;

    const modalId = id || `modal-${Date.now()}`;

    const sizes = {
      sm: 'modal-sm',
      md: 'modal-md',
      lg: 'modal-lg',
      xl: 'modal-xl',
      full: 'modal-full'
    };

    let html = `
      <div class="modal" id="${modalId}">
        <div class="modal-overlay" data-modal="${modalId}"></div>
        <div class="modal-content ${sizes[size]}">
          <div class="modal-header">
            <h3 class="modal-title">${title}</h3>
            ${showClose ? `<button class="modal-close" data-modal="${modalId}">&times;</button>` : ''}
          </div>
          <div class="modal-body">
            ${content}
          </div>
          ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
        </div>
      </div>
    `;

    return html;
  },

  // Create a tabs component
  tabs(tabs, options = {}) {
    const {
      defaultTab = 0,
      onChange = null
    } = options;

    let html = `<div class="tabs-container">`;
    html += `<div class="tabs-header" role="tablist">`;

    tabs.forEach((tab, index) => {
      const active = index === defaultTab ? 'active' : '';
      html += `
        <button 
          class="tab-button ${active}" 
          role="tab"
          data-tab-index="${index}"
          ${onChange ? `onclick="${onChange}(${index})"` : ''}
        >
          ${tab.icon || ''}
          <span>${tab.label}</span>
        </button>
      `;
    });

    html += `</div>`;
    html += `<div class="tabs-body">`;

    tabs.forEach((tab, index) => {
      const active = index === defaultTab ? 'active' : '';
      html += `<div class="tab-panel ${active}" role="tabpanel" data-tab-index="${index}">${tab.content}</div>`;
    });

    html += `</div></div>`;
    return html;
  },

  // Create an accordion
  accordion(items, options = {}) {
    const {
      defaultOpen = null,
      allowMultiple = false
    } = options;

    let html = `<div class="accordion" data-allow-multiple="${allowMultiple}">`;

    items.forEach((item, index) => {
      const isOpen = defaultOpen === index ? 'open' : '';
      html += `
        <div class="accordion-item ${isOpen}" data-accordion-index="${index}">
          <button class="accordion-header" onclick="Components.toggleAccordion(this)">
            <span class="accordion-title">${item.title}</span>
            <span class="accordion-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </span>
          </button>
          <div class="accordion-content">
            ${item.content}
          </div>
        </div>
      `;
    });

    html += `</div>`;
    return html;
  },

  // Toggle accordion item
  toggleAccordion(button) {
    const item = button.closest('.accordion-item');
    const accordion = item.closest('.accordion');
    const allowMultiple = accordion.dataset.allowMultiple === 'true';

    const isOpen = item.classList.contains('open');

    if (!allowMultiple) {
      accordion.querySelectorAll('.accordion-item').forEach(i => {
        i.classList.remove('open');
      });
    }

    if (!isOpen) {
      item.classList.add('open');
    }
  },

  // Helper: Get initials from name
  getInitials(name) {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return name.substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  },

  // Helper: Escape HTML
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Components };
}
