function currency(value) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
}

export function createOwnerDashboardHtml({ token }) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Owner Revenue Dashboard</title>
    <style>
      :root {
        --bg: #ffffff;
        --surface: #fffaf5;
        --surface-2: #f7f1e8;
        --text: #1f1d19;
        --muted: #6b6257;
        --line: #eadfce;
        --accent: #c97b2b;
        --accent-soft: #f3e1cc;
        --success: #1d7a52;
        --shadow: 0 10px 30px rgba(48, 37, 24, 0.08);
        --radius: 20px;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: linear-gradient(180deg, #fff 0%, #fff8ef 100%);
        color: var(--text);
      }
      .app {
        max-width: 1200px;
        margin: 0 auto;
        padding: 16px;
      }
      .hero, .card, .panel {
        background: rgba(255,255,255,0.94);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
      }
      .hero {
        padding: 18px;
        display: grid;
        gap: 12px;
      }
      .eyebrow {
        color: var(--accent);
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .08em;
      }
      h1 {
        margin: 0;
        font-size: 28px;
        line-height: 1.05;
      }
      .sub {
        color: var(--muted);
        font-size: 14px;
        line-height: 1.5;
      }
      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        justify-content: space-between;
      }
      .toolbar-group {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: var(--surface);
        border-radius: 999px;
        border: 1px solid var(--line);
        font-size: 13px;
        color: var(--muted);
      }
      .layout {
        margin-top: 16px;
        display: grid;
        gap: 16px;
      }
      .cards {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .card {
        padding: 16px;
      }
      .card.primary {
        background: linear-gradient(180deg, #fff6eb 0%, #fff 100%);
        border-color: #e7c9a7;
      }
      .card-label {
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: .06em;
      }
      .card-value {
        margin-top: 10px;
        font-size: 28px;
        font-weight: 700;
      }
      .grid-2 {
        display: grid;
        gap: 16px;
      }
      .panel {
        padding: 16px;
      }
      .panel h2 {
        margin: 0 0 6px;
        font-size: 18px;
      }
      .panel p {
        margin: 0 0 14px;
        color: var(--muted);
        font-size: 13px;
      }
      .chart-wrap {
        background: linear-gradient(180deg, #fffefc 0%, #fff8ef 100%);
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 12px;
      }
      svg { width: 100%; height: auto; display: block; }
      .list {
        display: grid;
        gap: 10px;
      }
      .payment {
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 14px;
        background: #fff;
        display: grid;
        gap: 8px;
        cursor: pointer;
        transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
      }
      .payment:hover {
        transform: translateY(-1px);
        border-color: #ddc5aa;
        box-shadow: 0 12px 24px rgba(48, 37, 24, 0.08);
      }
      .payment-top {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: start;
      }
      .payment-main {
        display: flex;
        gap: 12px;
        align-items: center;
        min-width: 0;
      }
      .payment-thumb {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        object-fit: cover;
        background: var(--surface);
        border: 1px solid var(--line);
        flex: 0 0 52px;
      }
      .payment-copy {
        min-width: 0;
      }
      .payment-amount {
        font-size: 22px;
        font-weight: 700;
      }
      .payment-arrow {
        color: var(--accent);
        font-size: 18px;
        font-weight: 700;
        align-self: center;
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .tag {
        background: var(--surface);
        color: var(--muted);
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 12px;
        border: 1px solid var(--line);
      }
      button {
        appearance: none;
        border: 0;
        background: var(--accent);
        color: white;
        padding: 12px 14px;
        border-radius: 14px;
        font-weight: 600;
      }
      button.secondary {
        background: var(--surface-2);
        color: var(--text);
      }
      .empty-state {
        padding: 18px;
        border-radius: 16px;
        border: 1px dashed var(--line);
        color: var(--muted);
        background: #fffdfa;
        font-size: 13px;
        line-height: 1.5;
      }
      dialog {
        width: min(92vw, 760px);
        border: 1px solid var(--line);
        border-radius: 22px;
        padding: 0;
        box-shadow: var(--shadow);
      }
      dialog::backdrop { background: rgba(24, 20, 16, 0.38); }
      .drawer {
        padding: 18px;
        display: grid;
        gap: 14px;
      }
      .kv {
        display: grid;
        grid-template-columns: 110px 1fr;
        gap: 8px;
        font-size: 14px;
      }
      .kv strong { color: var(--muted); }
      img {
        width: 100%;
        border-radius: 16px;
        border: 1px solid var(--line);
      }
      pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 12px;
        font-size: 12px;
        color: var(--muted);
      }
      @media (min-width: 840px) {
        .app { padding: 24px; }
        .grid-2 { grid-template-columns: 1.3fr .7fr; }
        .cards { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      }
    </style>
  </head>
  <body>
    <main class="app">
      <section class="hero">
        <div class="eyebrow">Private owner view</div>
        <h1>Owner Revenue Dashboard</h1>
        <div class="sub">Track detected LINE slip revenue at a glance.</div>
        <div class="toolbar">
          <div class="toolbar-group">
            <div class="pill" id="generatedAt">Refreshing…</div>
            <div class="pill">Auto refresh 30s</div>
          </div>
          <button id="refreshButton" class="secondary">Refresh now</button>
        </div>
      </section>

      <div class="layout">
        <section class="cards" id="metricCards"></section>

        <section class="grid-2">
          <div class="panel">
            <h2>Revenue today</h2>
            <p>Live detected revenue since midnight.</p>
            <div class="chart-wrap"><svg id="revenueChart" viewBox="0 0 640 260" aria-label="Revenue chart"></svg></div>
          </div>

          <div class="panel">
            <h2>Bank breakdown</h2>
            <p>Where detected slip revenue is landing right now.</p>
            <div class="list" id="bankBreakdown"></div>
          </div>
        </section>

        <section class="panel">
          <h2>Recent payments</h2>
          <p>Top 10 on first load. Tap the row for full detail with image and OCR output.</p>
          <div class="list" id="recentPayments"></div>
          <div style="margin-top:12px"><button id="loadMoreButton" class="secondary">Load more</button></div>
        </section>
      </div>
    </main>

    <dialog id="paymentDialog">
      <div class="drawer">
        <div class="toolbar">
          <div>
            <div class="eyebrow">Payment detail</div>
            <h2 id="detailTitle" style="margin:4px 0 0">Slip</h2>
          </div>
          <button class="secondary" id="closeDialogButton">Close</button>
        </div>
        <div id="detailMeta"></div>
        <img id="detailImage" alt="Slip image" hidden />
        <pre id="detailOcr"></pre>
      </div>
    </dialog>

    <script>
      const token = ${JSON.stringify(token)};
      const state = { ledger: [], visibleCount: 10 };

      const metricCards = document.getElementById('metricCards');
      const bankBreakdown = document.getElementById('bankBreakdown');
      const recentPayments = document.getElementById('recentPayments');
      const generatedAt = document.getElementById('generatedAt');
      const revenueChart = document.getElementById('revenueChart');
      const loadMoreButton = document.getElementById('loadMoreButton');
      const refreshButton = document.getElementById('refreshButton');
      const paymentDialog = document.getElementById('paymentDialog');
      const closeDialogButton = document.getElementById('closeDialogButton');

      function formatMoney(value) {
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
      }

      function metricCard(label, value) {
        return '<article class="card">' +
          '<div class="card-label">' + label + '</div>' +
          '<div class="card-value">' + value + '</div>' +
        '</article>';
      }

      function renderMetrics(metrics) {
        metricCards.innerHTML = [
          '<article class="card primary"><div class="card-label">Revenue today</div><div class="card-value">' + formatMoney(metrics.revenueToday) + ' THB</div></article>',
          metricCard('Revenue this week', formatMoney(metrics.revenueWeek) + ' THB'),
          metricCard('Revenue this month', formatMoney(metrics.revenueMonth) + ' THB'),
          metricCard('Revenue all-time', formatMoney(metrics.revenueAllTime) + ' THB')
        ].join('');
      }

      function renderChart(series) {
        if (!series.length) {
          revenueChart.innerHTML = '<text x="20" y="36" fill="#6b6257" font-size="14">No payments detected since midnight.</text><text x="20" y="58" fill="#8a7d6d" font-size="12">Week and month cards still include detected revenue outside today.</text>';
          return;
        }
        const values = series.map(function (point) { return point.value; });
        const max = Math.max.apply(Math, values.concat([1]));
        const width = 640;
        const height = 260;
        const left = 24;
        const right = 20;
        const top = 16;
        const bottom = 38;
        const chartW = width - left - right;
        const chartH = height - top - bottom;
        const step = series.length === 1 ? 0 : chartW / (series.length - 1);
        const points = series.map(function (point, index) {
          const x = left + step * index;
          const y = top + chartH - (point.value / max) * chartH;
          return Object.assign({}, point, { x: x, y: y });
        });
        const linePath = points.map(function (point, index) {
          return (index === 0 ? 'M ' : 'L ') + point.x + ' ' + point.y;
        }).join(' ');
        const areaPath = linePath + ' L ' + points[points.length - 1].x + ' ' + (top + chartH) + ' L ' + points[0].x + ' ' + (top + chartH) + ' Z';
        const labels = points.map(function (point) {
          return '<text x="' + point.x + '" y="' + (height - 10) + '" font-size="11" text-anchor="middle" fill="#8a7d6d">' + point.label + '</text>';
        }).join('');
        const dots = points.map(function (point) {
          return '<circle cx="' + point.x + '" cy="' + point.y + '" r="4" fill="#c97b2b"></circle>';
        }).join('');
        revenueChart.innerHTML = '<rect x="0" y="0" width="640" height="260" rx="18" fill="#fffefc"></rect>' +
          '<path d="' + areaPath + '" fill="#f3e1cc"></path>' +
          '<path d="' + linePath + '" fill="none" stroke="#c97b2b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>' +
          dots +
          labels;
      }

      function renderBankBreakdown(items) {
        bankBreakdown.innerHTML = items.map(function (item) {
          return '<div class="payment">' +
            '<div class="payment-top">' +
              '<strong>' + item.bank + '</strong>' +
              '<strong>' + formatMoney(item.value) + ' THB</strong>' +
            '</div>' +
          '</div>';
        }).join('') || '<div class="payment">No bank data yet.</div>';
      }

      function renderRecentPayments() {
        const visible = state.ledger.slice(0, state.visibleCount);
        recentPayments.innerHTML = visible.map(function (entry) {
          const refTag = entry.referenceId ? '<span class="tag">Ref ' + entry.referenceId.slice(0, 8) + '…</span>' : '';
          const thumb = entry.imageUrl ? '<img class="payment-thumb" src="' + entry.imageUrl + '" alt="Slip thumbnail" />' : '<div class="payment-thumb"></div>';
          return '<article class="payment" data-message-id="' + entry.messageId + '">' +
            '<div class="payment-top">' +
              '<div class="payment-main">' +
                thumb +
                '<div class="payment-copy">' +
                  '<div class="payment-amount">' + formatMoney(entry.amount) + ' THB</div>' +
                  '<div class="sub">' + entry.dateTime + '</div>' +
                '</div>' +
              '</div>' +
              '<div class="payment-arrow">→</div>' +
            '</div>' +
            '<div class="meta">' +
              '<span class="tag">' + entry.bank + '</span>' +
              '<span class="tag">' + entry.status + '</span>' +
              refTag +
            '</div>' +
          '</article>';
        }).join('') || '<div class="empty-state">No detected payments yet. Once slips are detected, revenue and recent payment cards will appear here automatically.</div>';
        loadMoreButton.hidden = state.visibleCount >= state.ledger.length;
      }

      function openDetail(entry) {
        document.getElementById('detailTitle').textContent = formatMoney(entry.amount) + ' THB';
        document.getElementById('detailMeta').innerHTML = [
          ['Bank', entry.bank],
          ['Status', entry.status],
          ['Date', entry.dateTime],
          ['Reference', entry.referenceId || '—'],
          ['QR', entry.hasQr ? 'Found' : 'Not found']
        ].map(function (pair) {
          return '<div class="kv"><strong>' + pair[0] + '</strong><span>' + pair[1] + '</span></div>';
        }).join('');
        const image = document.getElementById('detailImage');
        if (entry.imageUrl) {
          image.src = entry.imageUrl;
          image.hidden = false;
        } else {
          image.hidden = true;
        }
        document.getElementById('detailOcr').textContent = entry.extractedText || 'No OCR text stored.';
        paymentDialog.showModal();
      }

      async function refresh() {
        const response = await fetch('/owner/' + token + '/data');
        const snapshot = await response.json();
        state.ledger = snapshot.ledger;
        renderMetrics(snapshot.metrics);
        renderChart(snapshot.charts.hourlyToday);
        renderBankBreakdown(snapshot.bankBreakdown);
        renderRecentPayments();
        generatedAt.textContent = 'Updated ' + new Date(snapshot.generatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      }

      recentPayments.addEventListener('click', function (event) {
        const card = event.target.closest('[data-message-id]');
        const messageId = card && card.getAttribute('data-message-id');
        if (!messageId) return;
        const entry = state.ledger.find(function (item) { return item.messageId === messageId; });
        if (entry) openDetail(entry);
      });

      loadMoreButton.addEventListener('click', function () {
        state.visibleCount += 10;
        renderRecentPayments();
      });

      refreshButton.addEventListener('click', refresh);
      closeDialogButton.addEventListener('click', function () { paymentDialog.close(); });
      setInterval(refresh, 30000);
      refresh();
    </script>
  </body>
</html>`;
}