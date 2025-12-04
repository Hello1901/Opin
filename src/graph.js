// Graph Module - Visualization and Export
import * as XLSX from 'xlsx';

let currentGraphData = null;

/**
 * Draw a bar chart on the canvas
 */
export function drawGraph(canvas, data) {
    currentGraphData = data;
    const ctx = canvas.getContext('2d');
    const { options, opin } = data;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const width = 600;
    const height = 350;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, width, height);

    // Chart dimensions
    const padding = { top: 40, right: 30, bottom: 60, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find max value for scaling
    const maxVotes = Math.max(...options.map(o => o.count), 1);

    // Calculate bar dimensions
    const barCount = options.length;
    const barGap = 20;
    const barWidth = (chartWidth - (barCount - 1) * barGap) / barCount;

    // Colors for bars - Opin brand palette
    const colors = [
        '#1DCD9F', '#169976', '#14866a', '#0f735b',
        '#1ab98f', '#17a77f', '#149570', '#118360',
        '#25d9aa', '#30e5b5', '#3cf1c0', '#48fdcb'
    ];

    // Draw title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(opin.question, width / 2, 25);

    // Draw Y axis line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.stroke();

    // Draw Y axis labels
    ctx.fillStyle = '#a0a0b0';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'right';

    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
        const value = Math.round((maxVotes / ySteps) * i);
        const y = height - padding.bottom - (chartHeight / ySteps) * i;
        ctx.fillText(value.toString(), padding.left - 10, y + 4);

        // Draw horizontal grid line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
    }

    // Draw bars
    options.forEach((option, index) => {
        const x = padding.left + index * (barWidth + barGap);
        const barHeight = (option.count / maxVotes) * chartHeight;
        const y = height - padding.bottom - barHeight;

        // Gradient for bar
        const gradient = ctx.createLinearGradient(x, y, x, height - padding.bottom);
        const color = colors[index % colors.length];
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color + '80');

        ctx.fillStyle = gradient;

        // Draw rounded bar
        const radius = 4;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, height - padding.bottom);
        ctx.lineTo(x, height - padding.bottom);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.fill();

        // Draw vote count on top of bar
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(option.count.toString(), x + barWidth / 2, y - 8);

        // Draw option label
        ctx.fillStyle = '#a0a0b0';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';

        // Truncate long labels
        let label = option.text;
        if (label.length > 12) {
            label = label.substring(0, 10) + '...';
        }
        ctx.fillText(label, x + barWidth / 2, height - padding.bottom + 20);
    });
}

/**
 * Render voter dropdowns under the graph
 */
export function renderVoterDropdowns(container, data) {
    container.innerHTML = '';

    if (data.opin.anonymous) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; width: 100%;">This Opin has anonymous voting enabled</p>';
        return;
    }

    data.options.forEach((option, index) => {
        const dropdown = document.createElement('details');
        dropdown.className = 'voter-dropdown';

        const summary = document.createElement('summary');
        summary.textContent = `${option.text} (${option.voters.length})`;
        dropdown.appendChild(summary);

        const voterList = document.createElement('div');
        voterList.className = 'voter-list';

        if (option.voters.length === 0) {
            voterList.innerHTML = '<p>No votes yet</p>';
        } else {
            option.voters.forEach(email => {
                const p = document.createElement('p');
                p.textContent = email;
                voterList.appendChild(p);
            });
        }

        dropdown.appendChild(voterList);
        container.appendChild(dropdown);
    });
}

/**
 * Export graph as PNG
 */
export function exportPNG(canvas, filename = 'opin-results') {
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

/**
 * Export graph as JPG
 */
export function exportJPG(canvas, filename = 'opin-results') {
    // Create a new canvas with white background for JPG
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext('2d');

    // Fill with dark background
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.drawImage(canvas, 0, 0);

    const link = document.createElement('a');
    link.download = `${filename}.jpg`;
    link.href = tempCanvas.toDataURL('image/jpeg', 0.9);
    link.click();
}

/**
 * Export data as Excel file
 */
export function exportExcel(data, filename = 'opin-results') {
    const { opin, options, totalVotes } = data;

    // Prepare worksheet data
    const wsData = [
        ['Opin Results'],
        [''],
        ['Question:', opin.question],
        ['Total Votes:', totalVotes],
        ['Status:', opin.status],
        [''],
        ['Option', 'Votes', 'Percentage', 'Voters']
    ];

    options.forEach(option => {
        const percentage = totalVotes > 0 ? ((option.count / totalVotes) * 100).toFixed(1) + '%' : '0%';
        const voters = opin.anonymous ? 'Anonymous' : option.voters.join(', ');
        wsData.push([option.text, option.count, percentage, voters]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');

    XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Open Google Sheets with data pre-filled
 */
export function exportGoogleSheets(data) {
    const { opin, options, totalVotes } = data;

    // Create CSV data
    let csvContent = 'Option,Votes,Percentage\n';
    options.forEach(option => {
        const percentage = totalVotes > 0 ? ((option.count / totalVotes) * 100).toFixed(1) : 0;
        csvContent += `"${option.text}",${option.count},${percentage}%\n`;
    });

    // Encode for URL
    const encodedCsv = encodeURIComponent(csvContent);

    // Open Google Sheets import
    const sheetsUrl = `https://docs.google.com/spreadsheets/d/e/create?title=${encodeURIComponent(opin.name + ' Results')}`;

    // Alternative: Create a data URL and copy to clipboard
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    // Download CSV that can be imported to Google Sheets
    const link = document.createElement('a');
    link.download = `${opin.name}-results.csv`;
    link.href = url;
    link.click();

    // Show instructions
    setTimeout(() => {
        window.open('https://sheets.google.com', '_blank');
    }, 500);
}
