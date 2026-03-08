// Student Assistant Pro - Charts Module
// Data visualization components for analytics

const Charts = {
  // Create a bar chart
  createBarChart(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
      width = 400,
      height = 300,
      barColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#667eea',
      barHoverColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-dark').trim() || '#5a67d8',
      showValues = true,
      showLabels = true,
      animated = true
    } = options;

    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = (width - 60) / data.length - 10;
    const chartHeight = height - 40;

    let html = `<div class="chart-container" style="width: ${width}px; height: ${height}px;">`;
    html += `<svg class="bar-chart" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
    
    // Y-axis grid lines
    for (let i = 0; i <= 4; i++) {
      const y = chartHeight - (i * chartHeight / 4);
      const value = Math.round(maxValue * i / 4);
      html += `<line x1="40" y1="${y}" x2="${width - 20}" y2="${y}" stroke="var(--border-color)" stroke-dasharray="4"/>`;
      html += `<text x="35" y="${y + 4}" text-anchor="end" class="chart-label" font-size="10" fill="var(--text-muted)">${value}</text>`;
    }

    // Bars
    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * chartHeight;
      const x = 50 + index * (barWidth + 10);
      const y = chartHeight - barHeight;

      html += `<g class="bar-group" data-index="${index}">`;
      html += `<rect 
        class="bar" 
        x="${x}" 
        y="${animated ? chartHeight : y}" 
        width="${barWidth}" 
        height="${animated ? 0 : barHeight}"
        fill="${barColor}"
        rx="4"
        style="transition: all 0.3s ease;"
      />`;
      
      if (showValues) {
        html += `<text x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" class="chart-value" font-size="11" font-weight="600" fill="var(--text-secondary)">${item.value}</text>`;
      }
      
      if (showLabels) {
        html += `<text x="${x + barWidth / 2}" y="${height - 10}" text-anchor="middle" class="chart-label" font-size="11" fill="var(--text-muted)">${this.truncateLabel(item.label, 10)}</text>`;
      }
      
      html += `<title>${item.label}: ${item.value}</title>`;
      html += `</g>`;
    });

    html += `</svg></div>`;
    container.innerHTML = html;

    // Animate bars
    if (animated) {
      setTimeout(() => {
        const bars = container.querySelectorAll('.bar');
        data.forEach((item, index) => {
          const barHeight = (item.value / maxValue) * chartHeight;
          const y = chartHeight - barHeight;
          bars[index].setAttribute('y', y);
          bars[index].setAttribute('height', barHeight);
        });
      }, 100);
    }

    // Add hover effects
    container.querySelectorAll('.bar-group').forEach((group, index) => {
      group.addEventListener('mouseenter', () => {
        const bar = group.querySelector('.bar');
        bar.style.fill = barHoverColor;
        bar.style.transform = 'scaleY(1.05)';
        bar.style.transformOrigin = 'bottom';
      });
      group.addEventListener('mouseleave', () => {
        const bar = group.querySelector('.bar');
        bar.style.fill = barColor;
        bar.style.transform = 'scaleY(1)';
      });
    });

    return { container, data, options };
  },

  // Create a line chart
  createLineChart(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
      width = 400,
      height = 300,
      lineColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#667eea',
      fillColor = 'rgba(102, 126, 234, 0.1)',
      showPoints = true,
      showGrid = true,
      animated = true
    } = options;

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const chartHeight = height - 60;
    const chartWidth = width - 60;

    const getX = (index) => 50 + (index / (data.length - 1)) * chartWidth;
    const getY = (value) => chartHeight - ((value - minValue) / (maxValue - minValue || 1)) * chartHeight;

    let html = `<div class="chart-container" style="width: ${width}px; height: ${height}px;">`;
    html += `<svg class="line-chart" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

    // Grid lines
    if (showGrid) {
      for (let i = 0; i <= 4; i++) {
        const y = chartHeight - (i * chartHeight / 4);
        const value = Math.round(minValue + (maxValue - minValue) * i / 4);
        html += `<line x1="40" y1="${y}" x2="${width - 20}" y2="${y}" stroke="var(--border-color)" stroke-dasharray="4"/>`;
        html += `<text x="35" y="${y + 4}" text-anchor="end" class="chart-label" font-size="10" fill="var(--text-muted)">${value}</text>`;
      }
    }

    // Create path
    let pathD = `M ${getX(0)} ${getY(data[0].value)}`;
    data.forEach((item, index) => {
      if (index > 0) {
        pathD += ` L ${getX(index)} ${getY(item.value)}`;
      }
    });

    // Fill area
    const fillPath = `${pathD} L ${getX(data.length - 1)} ${chartHeight} L ${getX(0)} ${chartHeight} Z`;
    html += `<path class="line-fill" d="${fillPath}" fill="${fillColor}" style="opacity: 0; transition: opacity 0.5s ease;"/>`;

    // Line
    html += `<path class="line-path" d="${pathD}" fill="none" stroke="${lineColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray: ${chartWidth * 2}; stroke-dashoffset: ${animated ? chartWidth * 2 : 0}; transition: stroke-dashoffset 1s ease;"/>`;

    // Points
    if (showPoints) {
      data.forEach((item, index) => {
        const x = getX(index);
        const y = getY(item.value);
        html += `<circle class="line-point" cx="${x}" cy="${y}" r="5" fill="white" stroke="${lineColor}" stroke-width="2" style="transition: all 0.2s ease;"/>`;
        html += `<circle class="line-point-hover" cx="${x}" cy="${y}" r="15" fill="transparent" opacity="0"/>`;
        html += `<text x="${x}" y="${y - 12}" text-anchor="middle" class="chart-value" font-size="10" font-weight="600" fill="var(--text-secondary)">${item.value}</text>`;
        html += `<text x="${x}" y="${height - 15}" text-anchor="middle" class="chart-label" font-size="10" fill="var(--text-muted)">${this.truncateLabel(item.label, 8)}</text>`;
      });
    }

    html += `</svg></div>`;
    container.innerHTML = html;

    // Animate line
    if (animated) {
      setTimeout(() => {
        const path = container.querySelector('.line-path');
        path.style.strokeDashoffset = '0';
        const fill = container.querySelector('.line-fill');
        fill.style.opacity = '1';
      }, 100);
    }

    // Add hover effects
    container.querySelectorAll('.line-point-hover').forEach((point, index) => {
      point.addEventListener('mouseenter', () => {
        const mainPoint = container.querySelectorAll('.line-point')[index];
        mainPoint.style.r = '7';
        mainPoint.style.fill = lineColor;
      });
      point.addEventListener('mouseleave', () => {
        const mainPoint = container.querySelectorAll('.line-point')[index];
        mainPoint.style.r = '5';
        mainPoint.style.fill = 'white';
      });
    });

    return { container, data, options };
  },

  // Create a donut/pie chart
  createDonutChart(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
      size = 200,
      innerRadius = 60,
      showLabels = true,
      showLegend = true,
      animated = true
    } = options;

    const total = data.reduce((sum, item) => sum + item.value, 0);
    const center = size / 2;
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;

    let currentAngle = 0;
    const segments = [];

    data.forEach((item, index) => {
      const angle = (item.value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      const startRad = (startAngle - 90) * Math.PI / 180;
      const endRad = (endAngle - 90) * Math.PI / 180;

      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;

      const pathD = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${center} ${center} Z`;
      
      segments.push({
        path: pathD,
        color: item.color || this.getColor(index),
        label: item.label,
        value: item.value,
        percentage: ((item.value / total) * 100).toFixed(1)
      });

      currentAngle = endAngle;
    });

    let html = `<div class="donut-chart-container" style="display: flex; align-items: center; gap: 20px;">`;
    
    // Chart
    html += `<div class="donut-chart" style="position: relative; width: ${size}px; height: ${size}px;">`;
    html += `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
    
    // Outer circle (background)
    html += `<circle cx="${center}" cy="${center}" r="${radius}" fill="var(--bg-tertiary)"/>`;
    
    // Segments
    segments.forEach((segment, index) => {
      html += `<path class="donut-segment" d="${segment.path}" fill="${segment.color}" style="opacity: ${animated ? 0 : 1}; transition: opacity 0.5s ease, transform 0.2s ease; transform-origin: ${center}px ${center}px;" data-index="${index}"/>`;
    });
    
    // Inner circle (creates donut)
    html += `<circle cx="${center}" cy="${center}" r="${innerRadius}" fill="var(--bg-secondary)"/>`;
    
    // Center text (total)
    html += `<text x="${center}" y="${center - 5}" text-anchor="middle" class="chart-value" font-size="20" font-weight="700" fill="var(--text-primary)">${total}</text>`;
    html += `<text x="${center}" y="${center + 15}" text-anchor="middle" class="chart-label" font-size="11" fill="var(--text-muted)">Total</text>`;
    
    html += `</svg></div>`;

    // Legend
    if (showLegend) {
      html += `<div class="donut-legend" style="flex: 1;">`;
      segments.forEach((segment, index) => {
        html += `<div class="legend-item" style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 6px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='transparent'">`;
        html += `<div style="width: 12px; height: 12px; border-radius: 3px; background: ${segment.color};"/>`;
        html += `<span style="flex: 1; font-size: 13px; color: var(--text-secondary);">${segment.label}</span>`;
        html += `<span style="font-weight: 600; font-size: 13px; color: var(--text-primary);">${segment.percentage}%</span>`;
        html += `</div>`;
      });
      html += `</div>`;
    }

    html += `</div>`;
    container.innerHTML = html;

    // Animate segments
    if (animated) {
      setTimeout(() => {
        const segmentElements = container.querySelectorAll('.donut-segment');
        segments.forEach((segment, index) => {
          segmentElements[index].style.opacity = '1';
        });
      }, 100);
    }

    // Add hover effects
    container.querySelectorAll('.donut-segment').forEach((segment, index) => {
      segment.addEventListener('mouseenter', () => {
        segment.style.transform = 'scale(1.05)';
      });
      segment.addEventListener('mouseleave', () => {
        segment.style.transform = 'scale(1)';
      });
    });

    return { container, data: segments, options };
  },

  // Create a progress circle
  createProgressCircle(containerId, progress, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
      size = 120,
      strokeWidth = 10,
      showPercentage = true,
      showLabel = true,
      label = 'Progress',
      color = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#667eea',
      trackColor = 'var(--bg-tertiary)',
      animated = true
    } = options;

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;
    const center = size / 2;

    let html = `<div class="progress-circle-container" style="position: relative; width: ${size}px; height: ${size}px;">`;
    html += `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);">`;
    
    // Track circle
    html += `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${trackColor}" stroke-width="${strokeWidth}"/>`;
    
    // Progress circle
    html += `<circle class="progress-ring" cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${animated ? circumference : offset}" style="transition: stroke-dashoffset 1s ease;"/>`;
    
    html += `</svg>`;

    if (showPercentage) {
      html += `<div class="progress-percentage" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">`;
      html += `<span class="progress-value" style="font-size: 24px; font-weight: 700; color: var(--text-primary);">${progress}%</span>`;
      if (showLabel) {
        html += `<br/><span class="progress-label" style="font-size: 11px; color: var(--text-muted);">${label}</span>`;
      }
      html += `</div>`;
    }

    html += `</div>`;
    container.innerHTML = html;

    // Animate
    if (animated) {
      setTimeout(() => {
        const ring = container.querySelector('.progress-ring');
        ring.style.strokeDashoffset = offset;
      }, 100);
    }

    return { container, progress, options };
  },

  // Helper: Get color from palette
  getColor(index) {
    const colors = [
      '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe',
      '#43e97b', '#fa709a', '#fee140', '#30cfd0', '#a8edea'
    ];
    return colors[index % colors.length];
  },

  // Helper: Truncate label
  truncateLabel(label, maxLength) {
    if (!label) return '';
    if (label.length <= maxLength) return label;
    return label.substring(0, maxLength) + '...';
  },

  // Helper: Format large numbers
  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Charts };
}
