const SHEET_ID = "1oKyIf8lidgxrwjOkG4MpN4sVH9HB7VZJpNmmDOIpGw8";
const SHEET_NAME = "DASHBOARD";
const REFRESH_MS = 10000;

async function getSheet(range) {
  const url =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${encodeURIComponent(SHEET_NAME)}&range=${encodeURIComponent(range)}&t=${Date.now()}`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`No se pudo leer el rango ${range}: ${res.status}`);
  }

  const txt = await res.text();
  const match = txt.match(/setResponse\(([\s\S]+)\);/);

  if (!match) {
    throw new Error(`Respuesta inesperada leyendo el rango ${range}`);
  }

  const json = JSON.parse(match[1]);

  const rows = (json.table?.rows || []).map(row =>
    (row.c || []).map(cell => cell ? (cell.f || cell.v || "") : "")
  );

  return rows;
}

function summaryRowsToObject(rows) {
  const map = {};

  rows.forEach(row => {
    const key = String(row[0] || "").trim();
    const value = row[1];

    if (key) {
      map[key] = value;
    }
  });

  return {
    tournamentName: map["Nombre del torneo"] || "",
    status: map["Estado del torneo"] || "",
    currentPhase: map["Fase actual"] || "",
    startDate: map["Fecha de inicio"] || "",
    endDate: map["Fecha de final"] || "",
    lastUpdate: map["Última actualización"] || "",
    dataSource: map["Fuente de datos"] || "",
    updateFrequency: map["Frecuencia de actualización"] || "",
    activeTeams: map["Equipos activos"] || 0,
    eliminatedTeams: map["Equipos eliminados"] || 0,
    totalSales: map["Ventas totales"] || 0,
    totalPoints: map["Puntos totales"] || 0,
    liveMatches: map["Partidos en vivo"] || 0,
    upcomingMatches: map["Próximos partidos"] || 0,
    finishedMatches: map["Partidos finalizados"] || 0,
    currentLeader: map["Líder actual"] || ""
  };
}

function standingsRowsToObjects(rows) {
  return rows
    .filter(row => row[0] && row[1] && row[1] !== "#N/A")
    .map(row => ({
      rank: row[0],
      teamId: row[1],
      name: row[2],
      unit: row[3],
      sales: row[4],
      points: row[5],
      status: row[6]
    }));
}

function upcomingRowsToObjects(rows) {
  return rows
    .filter(row => row[0])
    .map(row => ({
      matchId: row[0],
      phase: row[1],
      teamA: row[2],
      teamB: row[3],
      startDate: row[4],
      endDate: row[5],
      status: "PRÓXIMO"
    }));
}

function liveRowsToObjects(rows) {
  return rows
    .filter(row => row[0])
    .map(row => ({
      matchId: row[0],
      phase: row[1],
      teamA: row[2],
      teamB: row[3],
      endDate: row[4],
      pointsA: row[5],
      pointsB: row[6],
      status: "EN VIVO"
    }));
}

async function loadDashboardData() {
  try {
    const [summaryRows, standingsRows, upcomingRows, liveRows] = await Promise.all([
      getSheet("A2:B25"),
      getSheet("A28:G40"),
      getSheet("A44:G49"),
      getSheet("A53:G58")
    ]);

    const summary = summaryRowsToObject(summaryRows);
    const standings = standingsRowsToObjects(standingsRows);
    const upcomingMatches = upcomingRowsToObjects(upcomingRows);
    const liveMatches = liveRowsToObjects(liveRows);

    updateDashboardCards(summary);
    renderStandings(standings);
    renderUpcomingMatches(upcomingMatches);
    renderLiveMatches(liveMatches);

    console.log("Datos cargados desde DASHBOARD:", {
      summary,
      standings,
      upcomingMatches,
      liveMatches
    });

  } catch (error) {
    console.error("Error cargando DASHBOARD:", error);
  }
}

function updateDashboardCards(summary) {
  document.getElementById("faseActual").textContent = summary.currentPhase || "Pendiente";
  document.getElementById("equiposActivos").textContent = summary.activeTeams || 0;
  document.getElementById("ventasRegistradas").textContent = summary.totalSales || 0;

  const leader = String(summary.currentLeader || "Pendiente");
  const parts = leader.split(" - ");

  document.getElementById("liderActual").textContent = parts[0] || "Pendiente";
  document.getElementById("puntosLider").textContent = parts[1] || "";

  document.getElementById("lastUpdate").textContent = summary.lastUpdate || "Pendiente";
}

function renderStandings(standings) {
  const standingsBody = document.getElementById("standingsBody");
  if (!standingsBody) return;

  if (!standings || standings.length === 0) {
    standingsBody.innerHTML = `
      <tr>
        <td colspan="5">Información pendiente</td>
      </tr>
    `;
    return;
  }

  standingsBody.innerHTML = standings
    .map(team => {
      const statusClass = team.status === "ACTIVO" ? "active" : "eliminated";

      return `
        <tr>
          <td>${team.rank}</td>
          <td>${team.name}</td>
          <td>${team.unit}</td>
          <td>${team.points}</td>
          <td><span class="status ${statusClass}">${team.status}</span></td>
        </tr>
      `;
    })
    .join("");
}

function renderUpcomingMatches(matches) {
  const container = document.getElementById("upcomingMatches");
  if (!container) return;

  if (!matches || matches.length === 0) {
    container.className = "empty-state";
    container.innerHTML = `
      <strong>Calendario pendiente</strong>
      <p>Los próximos partidos se mostrarán cuando se publiquen oficialmente.</p>
    `;
    return;
  }

  container.className = "matches-list";
  container.innerHTML = matches
    .map(match => `
      <div class="match-card">
        <span>${match.phase}</span>
        <strong>${match.teamA} vs ${match.teamB}</strong>
        <p>${match.startDate} — ${match.endDate}</p>
      </div>
    `)
    .join("");
}

function renderLiveMatches(matches) {
  const container = document.getElementById("liveMatches");
  if (!container) return;

  if (!matches || matches.length === 0) {
    container.className = "empty-state";
    container.innerHTML = `
      <strong>Información pendiente</strong>
      <p>Los partidos aparecerán aquí cuando estén en vivo.</p>
    `;
    return;
  }

  container.className = "matches-list";
  container.innerHTML = matches
    .map(match => `
      <div class="match-card live">
        <span>${match.phase}</span>
        <strong>${match.teamA} ${match.pointsA} - ${match.pointsB} ${match.teamB}</strong>
        <p>En vivo</p>
      </div>
    `)
    .join("");
}

loadDashboardData();
setInterval(loadDashboardData, REFRESH_MS);