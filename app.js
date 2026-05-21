const players = [
  ["LeBron James", "Lakers", 5200],
  ["Stephen Curry", "Warriors", 4100],
  ["Victor Wembanyama", "Spurs", 6900],
  ["Luka Doncic", "Mavericks", 3300],
  ["Anthony Edwards", "Timberwolves", 2850],
  ["Jayson Tatum", "Celtics", 2400],
  ["Nikola Jokic", "Nuggets", 3150],
  ["Shai Gilgeous-Alexander", "Thunder", 3400],
  ["Kevin Durant", "Suns", 2600],
  ["Giannis Antetokounmpo", "Bucks", 3000],
  ["Ja Morant", "Grizzlies", 1900],
  ["Devin Booker", "Suns", 2100],
  ["Tyrese Haliburton", "Pacers", 1450],
  ["Paolo Banchero", "Magic", 1750],
  ["Chet Holmgren", "Thunder", 2200],
];

const sets = [
  "Prizm Silver",
  "National Treasures RPA",
  "Select Courtside",
  "Optic Holo",
  "Mosaic Gold",
  "Flawless Patch",
  "Topps Chrome Refractor",
  "Donruss Rated Rookie",
];

const grades = ["PSA 10", "PSA 9", "BGS 9.5", "Raw"];
const statuses = ["Vaulted", "Listed", "Watch", "Incoming"];

function avatarSvg(player, team, index) {
  const initials = player
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  const hues = ["#f97316", "#f6c453", "#42d392", "#54a9ff", "#fda4af"];
  const bg = hues[index % hues.length];
  const ring = hues[(index + 2) % hues.length];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="48" fill="#091526"/>
      <circle cx="48" cy="48" r="42" fill="${bg}" opacity="0.92"/>
      <circle cx="48" cy="48" r="31" fill="#0d1a2b"/>
      <path d="M18 65c18-8 38-8 60 0" stroke="${ring}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <text x="48" y="54" text-anchor="middle" font-family="Arial, sans-serif" font-size="23" font-weight="800" fill="#fff">${initials}</text>
      <text x="48" y="73" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="700" fill="#dce7f4">${team}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildRows() {
  const rows = [];
  for (let i = 0; i < 60; i += 1) {
    const [player, team, base] = players[i % players.length];
    const set = sets[(i * 3) % sets.length];
    const grade = grades[(i + Math.floor(i / 5)) % grades.length];
    const gradeLift = grade === "PSA 10" ? 1.8 : grade === "BGS 9.5" ? 1.42 : grade === "PSA 9" ? 1.18 : 0.62;
    const serial = i % 7 === 0 ? " /10" : i % 5 === 0 ? " /25" : i % 3 === 0 ? " /99" : "";
    const value = Math.round((base + (i % 11) * 137) * gradeLift);
    const acquired = new Date(Date.UTC(2025, i % 12, 2 + (i * 3) % 24));

    rows.push({
      id: i + 1,
      player,
      team,
      image: avatarSvg(player, team, i),
      title: `${player} ${2024 - (i % 6)} ${set}${serial}`,
      grade,
      gradeRank: grade === "PSA 10" ? 4 : grade === "BGS 9.5" ? 3 : grade === "PSA 9" ? 2 : 1,
      value,
      status: statuses[(i * 2 + Math.floor(i / 4)) % statuses.length],
      acquiredDate: acquired.toISOString().slice(0, 10),
    });
  }
  return rows;
}

const cards = buildRows();

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function gradeClass(grade) {
  if (grade === "PSA 10") return "psa10";
  if (grade === "PSA 9") return "psa9";
  if (grade === "BGS 9.5") return "bgs";
  return "raw";
}

function statusClass(status) {
  return status.toLowerCase();
}

const table = new Tabulator("#cardsTable", {
  data: cards,
  layout: "fitColumns",
  responsiveLayout: "collapse",
  pagination: true,
  paginationSize: 20,
  paginationSizeSelector: [20, 40, 60],
  movableColumns: false,
  initialSort: [{ column: "value", dir: "desc" }],
  columns: [
    {
      title: "Image",
      field: "image",
      width: 78,
      headerSort: false,
      formatter: (cell) => `<img class="avatar" src="${cell.getValue()}" alt="">`,
    },
    {
      title: "Title",
      field: "title",
      minWidth: 320,
      formatter: (cell) => {
        const data = cell.getData();
        return `<span class="title-cell"><strong>${data.title}</strong><span>${data.player} - ${data.team}</span></span>`;
      },
    },
    {
      title: "Grade",
      field: "gradeRank",
      width: 126,
      sorter: "number",
      formatter: (cell) => {
        const grade = cell.getData().grade;
        return `<span class="badge ${gradeClass(grade)}">${grade}</span>`;
      },
    },
    {
      title: "Value",
      field: "value",
      width: 136,
      hozAlign: "right",
      sorter: "number",
      formatter: (cell) => `<span class="value">${currency(cell.getValue())}</span>`,
    },
    {
      title: "Status",
      field: "status",
      width: 124,
      formatter: (cell) => {
        const status = cell.getValue();
        return `<span class="status ${statusClass(status)}">${status}</span>`;
      },
    },
    {
      title: "Date",
      field: "acquiredDate",
      width: 128,
      sorter: "date",
    },
  ],
});

const searchInput = document.querySelector("#playerSearch");
const gradeFilter = document.querySelector("#gradeFilter");
const statusFilter = document.querySelector("#statusFilter");

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const grade = gradeFilter.value;
  const status = statusFilter.value;

  table.setFilter((row) => {
    const matchesPlayer = !query || row.player.toLowerCase().includes(query);
    const matchesGrade = !grade || row.grade === grade;
    const matchesStatus = !status || row.status === status;
    return matchesPlayer && matchesGrade && matchesStatus;
  });
}

searchInput.addEventListener("input", applyFilters);
gradeFilter.addEventListener("change", applyFilters);
statusFilter.addEventListener("change", applyFilters);

document.querySelector("#totalCards").textContent = cards.length.toLocaleString("en-US");
document.querySelector("#portfolioValue").textContent = currency(
  cards.reduce((sum, card) => sum + card.value, 0),
);
document.querySelector("#psaCount").textContent = cards.filter((card) => card.grade === "PSA 10").length;
