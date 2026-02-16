const STORAGE_KEY = "bosch-row-sales-data";
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const seedData = [
  { project: "Hydro Alpha", region: "MEA", product: "Inverter", month: "2024-01", revenue: 91000, target: 95000, priceImpact: 1.2 },
  { project: "Solar Reach", region: "APAC", product: "Storage", month: "2024-02", revenue: 115000, target: 110000, priceImpact: 2.1 },
  { project: "Grid Pulse", region: "LATAM", product: "Controller", month: "2024-03", revenue: 87000, target: 92000, priceImpact: -0.7 },
  { project: "Eco Volt", region: "MEA", product: "Inverter", month: "2024-04", revenue: 122000, target: 120000, priceImpact: 0.8 },
  { project: "Wind Nexus", region: "APAC", product: "Controller", month: "2024-05", revenue: 99000, target: 102000, priceImpact: -1.1 },
  { project: "Terra Sync", region: "LATAM", product: "Storage", month: "2024-06", revenue: 134000, target: 128000, priceImpact: 3.2 },
  { project: "Hydro Alpha", region: "MEA", product: "Inverter", month: "2025-01", revenue: 102000, target: 100000, priceImpact: 1.9 },
  { project: "Solar Reach", region: "APAC", product: "Storage", month: "2025-02", revenue: 126000, target: 120000, priceImpact: 2.7 },
  { project: "Grid Pulse", region: "LATAM", product: "Controller", month: "2025-03", revenue: 98000, target: 97000, priceImpact: 0.6 },
  { project: "Eco Volt", region: "MEA", product: "Inverter", month: "2025-04", revenue: 136000, target: 130000, priceImpact: 1.4 },
  { project: "Wind Nexus", region: "APAC", product: "Controller", month: "2025-05", revenue: 111000, target: 109000, priceImpact: -0.2 },
  { project: "Terra Sync", region: "LATAM", product: "Storage", month: "2025-06", revenue: 149000, target: 140000, priceImpact: 2.4 }
];

const state = {
  data: loadData(),
  charts: {}
};

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    return [...seedData];
  }
  return JSON.parse(raw);
}

function persistData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function uniqueValues(key) {
  return [...new Set(state.data.map((d) => d[key]))].sort();
}

function populateFilters() {
  fillMultiSelect("regionFilter", uniqueValues("region"));
  fillMultiSelect("productFilter", uniqueValues("product"));

  const years = [...new Set(state.data.map((d) => Number(d.month.slice(0, 4))))].sort((a, b) => a - b);
  const yearFilter = document.getElementById("yearFilter");
  yearFilter.innerHTML = "<option value='all'>All Years</option>" + years.map((y) => `<option value='${y}'>${y}</option>`).join("");
  yearFilter.value = "all";
}

function fillMultiSelect(id, values) {
  const el = document.getElementById(id);
  el.innerHTML = values.map((v) => `<option value='${v}' selected>${v}</option>`).join("");
}

function getSelectedValues(id) {
  return [...document.getElementById(id).selectedOptions].map((o) => o.value);
}

function filteredData() {
  const selectedRegions = getSelectedValues("regionFilter");
  const selectedProducts = getSelectedValues("productFilter");
  const selectedYear = document.getElementById("yearFilter").value;

  return state.data.filter((item) => {
    const regionOK = selectedRegions.length === 0 || selectedRegions.includes(item.region);
    const productOK = selectedProducts.length === 0 || selectedProducts.includes(item.product);
    const yearOK = selectedYear === "all" || String(item.month).startsWith(selectedYear);
    return regionOK && productOK && yearOK;
  });
}

function groupByMonth(data) {
  const map = new Map();
  data.forEach((item) => {
    map.set(item.month, (map.get(item.month) || 0) + item.revenue);
  });
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function computeQoQ(monthly) {
  const quarterTotals = {};
  monthly.forEach(([month, rev]) => {
    const [y, m] = month.split("-").map(Number);
    const q = Math.floor((m - 1) / 3) + 1;
    const key = `${y}-Q${q}`;
    quarterTotals[key] = (quarterTotals[key] || 0) + rev;
  });
  return Object.entries(quarterTotals).sort(([a], [b]) => a.localeCompare(b));
}

function kpis(data) {
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalTarget = data.reduce((s, d) => s + d.target, 0);
  const priceImpactAvg = data.length ? data.reduce((s, d) => s + d.priceImpact, 0) / data.length : 0;

  const byYear = data.reduce((acc, d) => {
    const y = Number(d.month.slice(0, 4));
    acc[y] = (acc[y] || 0) + d.revenue;
    return acc;
  }, {});
  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);
  let yoy = 0;
  if (years.length >= 2) {
    const prev = byYear[years[years.length - 2]];
    const curr = byYear[years[years.length - 1]];
    yoy = prev ? ((curr - prev) / prev) * 100 : 0;
  }

  const monthly = groupByMonth(data);
  let growth = 0;
  if (monthly.length >= 2) {
    const prev = monthly[monthly.length - 2][1];
    const curr = monthly[monthly.length - 1][1];
    growth = prev ? ((curr - prev) / prev) * 100 : 0;
  }

  return { totalRevenue, totalTarget, priceImpactAvg, yoy, growth };
}

function renderKPIs(data) {
  const { totalRevenue, totalTarget, priceImpactAvg, yoy, growth } = kpis(data);
  const cards = [
    ["Total Revenue", `€ ${Math.round(totalRevenue).toLocaleString()}`],
    ["Target Attainment", `${totalTarget ? ((totalRevenue / totalTarget) * 100).toFixed(1) : 0}%`],
    ["MoM Growth", `${growth.toFixed(2)}%`],
    ["YoY Growth", `${yoy.toFixed(2)}%`],
    ["Avg Price Impact", `${priceImpactAvg.toFixed(2)}%`]
  ];

  document.getElementById("kpiGrid").innerHTML = cards
    .map(([label, val]) => `<article class='kpi-card'><p>${label}</p><h4>${val}</h4></article>`)
    .join("");
}

function buildForecast(monthly) {
  if (monthly.length < 3) return [];
  const last3 = monthly.slice(-3).map((m) => m[1]);
  const avg = last3.reduce((a, b) => a + b, 0) / last3.length;
  const [y, m] = monthly[monthly.length - 1][0].split("-").map(Number);
  const forecast = [];
  for (let i = 1; i <= 3; i++) {
    const date = new Date(y, m - 1 + i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    forecast.push([key, Math.round(avg * (1 + i * 0.01))]);
  }
  return forecast;
}

function createOrUpdateChart(key, config) {
  if (state.charts[key]) state.charts[key].destroy();
  state.charts[key] = new Chart(document.getElementById(key), config);
}

function renderCharts(data) {
  const monthly = groupByMonth(data);
  const qoq = computeQoQ(monthly);
  const forecast = buildForecast(monthly);

  createOrUpdateChart("monthlyChart", {
    type: "line",
    data: {
      labels: monthly.map(([m]) => {
        const [y, mon] = m.split("-");
        return `${monthNames[Number(mon) - 1]} ${y}`;
      }),
      datasets: [{ label: "Revenue", data: monthly.map(([, v]) => v), borderColor: "#005691", tension: 0.3 }]
    }
  });

  createOrUpdateChart("qoqChart", {
    type: "bar",
    data: {
      labels: qoq.map(([q]) => q),
      datasets: [{ label: "QoQ Revenue", data: qoq.map(([, v]) => v), backgroundColor: "#ea0016" }]
    }
  });

  createOrUpdateChart("targetChart", {
    type: "bar",
    data: {
      labels: ["Actual", "Target"],
      datasets: [{ label: "EUR", data: [data.reduce((s, d) => s + d.revenue, 0), data.reduce((s, d) => s + d.target, 0)], backgroundColor: ["#005691", "#7f8c99"] }]
    }
  });

  createOrUpdateChart("forecastChart", {
    type: "line",
    data: {
      labels: forecast.map(([m]) => m),
      datasets: [{ label: "Forecast Revenue", data: forecast.map(([, v]) => v), borderColor: "#2f9e44", borderDash: [6, 6] }]
    }
  });

  const impactsByProduct = data.reduce((acc, d) => {
    acc[d.product] = acc[d.product] || [];
    acc[d.product].push(d.priceImpact);
    return acc;
  }, {});
  const impactLabels = Object.keys(impactsByProduct);
  const impactValues = impactLabels.map((p) => impactsByProduct[p].reduce((a, b) => a + b, 0) / impactsByProduct[p].length);

  createOrUpdateChart("priceImpactChart", {
    type: "bar",
    data: {
      labels: impactLabels,
      datasets: [{ label: "Avg Price Impact %", data: impactValues, backgroundColor: "#005691" }]
    }
  });
}

function renderTable(data) {
  const body = document.querySelector("#projectTable tbody");
  body.innerHTML = data
    .slice()
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((d) => `
      <tr>
        <td>${d.project}</td>
        <td>${d.region}</td>
        <td>${d.product}</td>
        <td>${d.month}</td>
        <td>${d.revenue.toLocaleString()}</td>
        <td>${d.target.toLocaleString()}</td>
        <td>${d.priceImpact.toFixed(2)}</td>
      </tr>
    `)
    .join("");
}

function refreshDashboard() {
  const data = filteredData();
  renderKPIs(data);
  renderCharts(data);
  renderTable(data);
}

function bindEvents() {
  ["regionFilter", "productFilter", "yearFilter"].forEach((id) =>
    document.getElementById(id).addEventListener("change", refreshDashboard)
  );

  document.getElementById("resetFiltersBtn").addEventListener("click", () => {
    populateFilters();
    refreshDashboard();
  });

  document.getElementById("projectForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const entry = {
      project: document.getElementById("projectName").value.trim(),
      region: document.getElementById("projectRegion").value.trim(),
      product: document.getElementById("projectProduct").value.trim(),
      month: document.getElementById("projectMonth").value,
      revenue: Number(document.getElementById("projectRevenue").value),
      target: Number(document.getElementById("projectTarget").value),
      priceImpact: Number(document.getElementById("projectPriceImpact").value)
    };

    if (!entry.project || !entry.region || !entry.product || !entry.month) return;

    state.data.push(entry);
    persistData();
    populateFilters();
    refreshDashboard();
    e.target.reset();
  });

  document.getElementById("downloadPdfBtn").addEventListener("click", downloadPdfReport);
}

function downloadPdfReport() {
  const { jsPDF } = window.jspdf;
  const data = filteredData();
  const metrics = kpis(data);
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Bosch Power Solutions ROW Sales Report", 10, 12);
  doc.setFontSize(11);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 10, 20);
  doc.text(`Total Revenue: € ${Math.round(metrics.totalRevenue).toLocaleString()}`, 10, 30);
  doc.text(`YoY Growth: ${metrics.yoy.toFixed(2)}%`, 10, 38);
  doc.text(`MoM Growth: ${metrics.growth.toFixed(2)}%`, 10, 46);
  doc.text(`Average Price Impact: ${metrics.priceImpactAvg.toFixed(2)}%`, 10, 54);

  doc.text("Project Snapshot:", 10, 65);
  data.slice(0, 18).forEach((d, i) => {
    doc.text(`${d.month} | ${d.region} | ${d.product} | €${d.revenue.toLocaleString()}`, 10, 73 + i * 7);
  });

  doc.save("bosch-row-sales-report.pdf");
}

populateFilters();
bindEvents();
refreshDashboard();
