const SHEET_ID = "1oKylf8lidgxrwjOkG4MpN4sVH9HB7VzJpNmmDOlpGw8";
const SHEET_NAME = "DASHBOARD";
const REFRESH_MS = 10000;

let dashboardState = {
  summary: null,
  standings: [],
  upcomingMatches: [],
  liveMatches: [],
  teams: [],
  players: []
}

async function getSheet(range, sheetName = SHEET_NAME) {
  const url =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${encodeURIComponent(sheetName)}&range=${encodeURIComponent(range)}&t=${Date.now()}`

  const res = await fetch(url, { cache: "no-store" })

  if (!res.ok) {
    throw new Error(`No se pudo leer el rango ${sheetName}!${range}: ${res.status}`)
  }

  const txt = await res.text()
  const match = txt.match(/setResponse\(([\s\S]+)\);/)

  if (!match) {
    throw new Error(`Respuesta inesperada leyendo el rango ${sheetName}!${range}`)
  }

  const json = JSON.parse(match[1])

  const rows = (json.table?.rows || []).map(row =>
    (row.c || []).map(cell => cell ? (cell.f || cell.v || "") : "")
  )

  return rows
}

function teamRowsToObjects(rows) {
  return rows
    .filter(row => row[0] && row[1])
    .map(row => ({
      teamName: row[0],
      teamId: String(row[1] || "").trim().toUpperCase(),
      captainName: row[2],
      unit: String(row[3] || "").trim().toUpperCase(),
      flagUrl: row[4],
      status: row[5],
      points: Number(row[6]) || 0,
      sales: Number(row[7]) || 0
    }))
}

function playerRowsToObjects(rows) {
  return rows
    .filter(row => row[0] && row[1] && row[4])
    .map(row => ({
      playerId: row[0],
      fullName: row[1],
      displayName: row[2] || row[1],
      unit: String(row[3] || "").trim().toUpperCase(),
      teamId: String(row[4] || "").trim().toUpperCase(),
      isCaptain: String(row[5] || "").trim().toUpperCase() === "SI",
      photoUrl: row[6],
      flagUrl: row[7],
      points: Number(row[8]) || 0,
      sales: Number(row[9]) || 0,
      volume: Number(row[10]) || 0,
      average: Number(row[11]) || 0,
      teamPointShare: parsePercent(row[12])
    }))
}

function parsePercent(value) {
  const raw = String(value || "").trim()

  if (!raw || raw === "#DIV/0!") return 0

  if (raw.includes("%")) {
    return Number(raw.replace("%", "")) || 0
  }

  const num = Number(raw)

  if (!Number.isFinite(num)) return 0

  return num <= 1 ? Math.round(num * 100) : Math.round(num)
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
    const [summaryRows, standingsRows, upcomingRows, liveRows, teamRows, playerRows] = await Promise.all([
     getSheet("A2:B25"),
     getSheet("A28:G40"),
     getSheet("A44:F49"),
     getSheet("A53:G58"),
     getSheet("A2:H50", "EQUIPOS"),
     getSheet("A2:M300", "JUGADORES")
    ])

    const summary = summaryRowsToObject(summaryRows);
    const standings = standingsRowsToObjects(standingsRows);
    const upcomingMatches = upcomingRowsToObjects(upcomingRows);
    const liveMatches = liveRowsToObjects(liveRows);
    const teams = teamRowsToObjects(teamRows)
    const players = playerRowsToObjects(playerRows)

    updateDashboardCards(summary);
    renderStandings(standings);
    renderUpcomingMatches(upcomingMatches);
    renderLiveMatches(liveMatches);
    dashboardState = {
     summary,
     standings,
     upcomingMatches,
     liveMatches,
     teams,
     players
    }

    renderTeamsPage(teams, players)

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

function sortPlayersForTeam(players) {
  return [...players].sort((a, b) => {
    if (a.isCaptain !== b.isCaptain) return a.isCaptain ? -1 : 1
    if (b.points !== a.points) return b.points - a.points
    if (b.sales !== a.sales) return b.sales - a.sales

    return String(a.displayName).localeCompare(String(b.displayName))
  })
}

function renderTeamsPage(teams, players) {
  const container = document.getElementById("teamsContainer")
  if (!container) return

  if (!teams || teams.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>Equipos pendientes</strong>
        <p>Los equipos aparecerán aquí cuando cargue la hoja EQUIPOS.</p>
      </div>
    `
    return
  }

  const unitOrder = ["ELITE", "PREMIER", "BALFER", "LOYALTY"]

  container.innerHTML = unitOrder
    .map(unit => {
      const unitTeams = teams.filter(team => team.unit === unit)

      if (unitTeams.length === 0) return ""

      return renderUnitTeamsSection(unit, unitTeams, players)
    })
    .join("")

  setupTeamAccordions()
}

function renderUnitTeamsSection(unit, teams, players) {
  const unitColors = getUnitColors(unit)

  return `
    <section
      class="teams-unit-section"
      style="
        --unit-primary: ${unitColors.primary};
        --unit-secondary: ${unitColors.secondary};
        --unit-accent: ${unitColors.accent};
        --unit-bg: ${unitColors.bg};
      "
    >
      <div class="teams-unit-header">
        <div>
          <span>Unidad</span>
          <h2>${unit}</h2>
        </div>
        <p>${teams.length} equipos</p>
      </div>

      <div class="country-accordion-list">
        ${teams.map(team => {
          const teamPlayers = players.filter(player => player.teamId === team.teamId)

          return renderCountryAccordion(team, teamPlayers)
        }).join("")}
      </div>
    </section>
  `
}

function renderCountryAccordion(team, players) {
  const teamInfo = getTeamInfo(team.teamId)
  const teamColors = getTeamColors(team.teamId)
  const unitColors = getUnitColors(team.unit)
  const sortedPlayers = sortPlayersForTeam(players)
  const flag = driveImage(team.flagUrl || teamInfo.flagUrl)
  const statusClass = String(team.status || "").trim().toUpperCase() === "ACTIVO" ? "active" : "eliminated"

  return `
    <article
      class="country-team-card"
      style="
        --team-primary: ${teamColors.primary};
        --team-secondary: ${teamColors.secondary};
        --team-accent: ${teamColors.accent};
        --team-bg: ${teamColors.bg};
        --unit-primary: ${unitColors.primary};
        --unit-bg: ${unitColors.bg};
      "
    >
      <button class="country-team-header" type="button" data-team-toggle>
        <div class="country-team-main">
          ${flag ? `<img class="country-team-flag" src="${flag}" alt="Bandera de ${teamInfo.name}">` : ""}

          <div>
            <h3>${teamInfo.name}</h3>
            <p>${sortedPlayers.length} integrantes · Capitán: ${team.captainName || "Pendiente"}</p>
          </div>
        </div>

        <div class="country-team-stats">
          <span class="unit-chip">${team.unit}</span>
          <span class="status ${statusClass}">${team.status || "Pendiente"}</span>
          <strong>${team.points} pts</strong>
          <small>${team.sales} ventas</small>
          <span class="accordion-arrow">⌄</span>
        </div>
      </button>

      <div class="country-roster" data-team-roster>
        ${
          sortedPlayers.length
            ? sortedPlayers.map((player, index) => renderPlayerCard(player, index + 1)).join("")
            : `<div class="empty-state">
                <strong>Roster pendiente</strong>
                <p>No hay jugadores registrados para este equipo todavía.</p>
              </div>`
        }
      </div>
    </article>
  `
}

function renderPlayerCard(player, rank) {
  const teamInfo = getTeamInfo(player.teamId)
  const teamColors = getTeamColors(player.teamId)
  const unitColors = getUnitColors(player.unit)
  const photo = driveImage(player.photoUrl)
  const flag = driveImage(player.flagUrl || teamInfo.flagUrl)
  const performance = Math.max(0, Math.min(100, Number(player.teamPointShare) || 0))

  return `
    <article
      class="player-card ${player.isCaptain ? "captain-card" : ""}"
      style="
        --team-primary: ${teamColors.primary};
        --team-secondary: ${teamColors.secondary};
        --team-accent: ${teamColors.accent};
        --team-bg: ${teamColors.bg};
        --unit-primary: ${unitColors.primary};
        --unit-secondary: ${unitColors.secondary};
        --unit-accent: ${unitColors.accent};
      "
    >
      <div class="player-card-rank">${rank}</div>

      ${player.isCaptain ? `<div class="captain-badge">⭐ Capitán</div>` : ""}

      <div class="player-photo-wrap">
        ${
          photo
            ? `<img class="player-photo" src="${photo}" alt="${player.displayName}">`
            : `<div class="player-photo-placeholder">${getInitials(player.displayName)}</div>`
        }
      </div>

      <div class="player-card-body">
        <h4>${player.displayName}</h4>

        <div class="player-team-line">
          ${flag ? `<img src="${flag}" alt="Bandera de ${teamInfo.name}">` : ""}
          <span>${teamInfo.name}</span>
          <strong>${player.unit}</strong>
        </div>

        <div class="player-meta-line">
          <span>Rol: Integrante</span>
          <span>${player.isCaptain ? "Capitán del equipo" : "Jugador"}</span>
        </div>

        <div class="player-record">
          <div>
            <span>Récord en el torneo</span>
            <strong>${player.sales}V - 0D</strong>
          </div>
          <em>${player.isCaptain ? "Liderazgo activo" : "En competencia"}</em>
        </div>

        <div class="player-stats-grid">
          <div>
            <span>Puntos</span>
            <strong>${formatNumber(player.points)}</strong>
          </div>
          <div>
            <span>Ventas</span>
            <strong>${formatNumber(player.sales)}</strong>
          </div>
          <div>
            <span>Volumen</span>
            <strong>${formatMoney(player.volume)}</strong>
          </div>
          <div>
            <span>Promedio</span>
            <strong>${formatMoney(player.average)}</strong>
          </div>
        </div>

        <div class="player-performance">
          <div>
            <span>% de puntos del equipo</span>
            <strong>${performance}%</strong>
          </div>
          <div class="performance-track">
            <div class="performance-fill" style="width: ${performance}%"></div>
          </div>
        </div>

        <div class="player-last-match">
          <span>Último partido</span>
          <p>Actividad pendiente de registrar</p>
        </div>
      </div>
    </article>
  `
}

function getInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0] || "")
    .join("")
    .toUpperCase() || "?"
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-MX").format(Number(value) || 0)
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(Number(value) || 0)
}

function setupTeamAccordions() {
  document.querySelectorAll("[data-team-toggle]").forEach(button => {
    button.addEventListener("click", () => {
      const card = button.closest(".country-team-card")
      if (!card) return

      card.classList.toggle("open")
    })
  })
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
container.innerHTML = `
  <div class="matches-scroll">
    ${matches
      .map(match => {
        const teamA = getTeamInfo(match.teamA);
        const teamB = getTeamInfo(match.teamB);

        return `
          <div class="match-card">
            <span>${match.phase}</span>

            <div class="match-teams">
              <div class="match-team">
                <img class="team-flag-large" src="${driveImage(teamA.flagUrl)}" alt="Bandera de ${teamA.name}">
                <div class="match-team-name">${teamA.name}</div>
              </div>

              <div class="match-vs">VS</div>

              <div class="match-team">
                <img class="team-flag-large" src="${driveImage(teamB.flagUrl)}" alt="Bandera de ${teamB.name}">
                <div class="match-team-name">${teamB.name}</div>
              </div>
            </div>

            <p>${match.startDate} — ${match.endDate}</p>
          </div>
        `;
      })
      .join("")}
  </div>

  <a class="match-more-banner" href="#">
    Ver calendario completo en Match Center
  </a>
`;
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
    container.innerHTML = `
    <div class="matches-scroll">
        ${matches
        .map(match => {
            const teamA = getTeamInfo(match.teamA);
            const teamB = getTeamInfo(match.teamB);

            return `
            <div class="match-card live">
                <span>${match.phase}</span>

                <div class="match-teams">
                <div class="match-team">
                    <img class="team-flag-large" src="${driveImage(teamA.flagUrl)}" alt="Bandera de ${teamA.name}">
                    <div class="match-team-name">${teamA.name}</div>
                    <div class="match-score">${match.pointsA ?? 0}</div>
                </div>

                <div class="match-vs">VS</div>

                <div class="match-team">
                    <img class="team-flag-large" src="${driveImage(teamB.flagUrl)}" alt="Bandera de ${teamB.name}">
                    <div class="match-team-name">${teamB.name}</div>
                    <div class="match-score">${match.pointsB ?? 0}</div>
                </div>
                </div>

                <p>En vivo</p>
            </div>
            `;
        })
        .join("")}
    </div>

    <a class="match-more-banner" href="#">
        Ver todos los partidos en Match Center
    </a>
    `;
}

function driveImage(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";

  if (raw.includes("thumbnail?id=")) {
    return raw;
  }

  if (raw.includes("uc?export=view&id=")) {
    const id = raw.split("id=")[1];
    return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
  }

  const match = raw.match(/\/d\/([^/]+)/);
  if (match) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
  }

  return raw;
}

const TEAM_COLORS = {
  GER: {
    primary: "#000000",
    secondary: "#DD0000",
    accent: "#FFCE00",
    bg: "#111111"
  },
  ARG: {
    primary: "#75AADB",
    secondary: "#FFFFFF",
    accent: "#F6B40E",
    bg: "#082033"
  },
  BRA: {
    primary: "#009C3B",
    secondary: "#FFDF00",
    accent: "#002776",
    bg: "#061F13"
  },
  COL: {
    primary: "#FFD100",
    secondary: "#0033A0",
    accent: "#CE1126",
    bg: "#2A2300"
  },
  FRA: {
    primary: "#0055A4",
    secondary: "#FFFFFF",
    accent: "#EF4135",
    bg: "#071A33"
  },
  ESP: {
    primary: "#AA151B",
    secondary: "#F1BF00",
    accent: "#FFD700",
    bg: "#2A0709"
  },
  USA: {
    primary: "#1D3557",
    secondary: "#E63946",
    accent: "#F1FAEE",
    bg: "#081A2F"
  },
  NED: {
    primary: "#FF7A00",
    secondary: "#1B365D",
    accent: "#FFFFFF",
    bg: "#241000"
  },
  ENG: {
    primary: "#FFFFFF",
    secondary: "#C8102E",
    accent: "#012169",
    bg: "#1A1E2A"
  },
  MAR: {
    primary: "#C1272D",
    secondary: "#006233",
    accent: "#D4AF37",
    bg: "#23080B"
  },
  MEX: {
    primary: "#006847",
    secondary: "#FFFFFF",
    accent: "#CE1126",
    bg: "#082419"
  },
  POR: {
    primary: "#C8102E",
    secondary: "#006A4E",
    accent: "#FFD700",
    bg: "#260A12"
  }
};

const UNIT_COLORS = {
  ELITE: {
    primary: "#6DAEFF",
    secondary: "#1D6FFF",
    accent: "#D8ECFF",
    bg: "#071A33"
  },
  PREMIER: {
    primary: "#F6B26B",
    secondary: "#FF8C1A",
    accent: "#FFE0B8",
    bg: "#2A1606"
  },
  BALFER: {
    primary: "#93C47D",
    secondary: "#28D17C",
    accent: "#D9F5D0",
    bg: "#0B2412"
  },
  LOYALTY: {
    primary: "#8E7CC3",
    secondary: "#8B5CF6",
    accent: "#E1D8FF",
    bg: "#180F2A"
  }
};

const TEAM_CATALOG = {
  GER: {
    name: "Alemania",
    flagUrl: "https://drive.google.com/uc?export=view&id=1bdZarcqh1gN8rbwTOWMf3kmM-hzI1oh_"
  },
  ARG: {
    name: "Argentina",
    flagUrl: "https://drive.google.com/uc?export=view&id=1PMc9W1fIr5L5R8fNYHDKn_Shkh_H2Kch"
  },
  BRA: {
    name: "Brasil",
    flagUrl: "https://drive.google.com/uc?export=view&id=1SGrCOcxjIDnAq_7QtErUzO7wg_qIOrK6"
  },
  COL: {
    name: "Colombia",
    flagUrl: "https://drive.google.com/uc?export=view&id=1L2wM1hPHu3geSRYg1MZ2q6KlgITYp_08"
  },
  FRA: {
    name: "Francia",
    flagUrl: "https://drive.google.com/uc?export=view&id=1aHEfFBFwP85eXYRnvKY2gVDkWMFtg9PE"
  },
  ESP: {
    name: "España",
    flagUrl: "https://drive.google.com/uc?export=view&id=19NiP935osC8beYjr9_a9feinHtGfigh3"
  },
  USA: {
    name: "Estados Unidos",
    flagUrl: "https://drive.google.com/uc?export=view&id=1c9K8-XaTzPRjEYsJWR7AlfiCO9odttEx"
  },
  NED: {
    name: "Holanda",
    flagUrl: "https://drive.google.com/uc?export=view&id=1MCv5Jkvp_Z0RP2ca5gS24EjKg8xFyEYT"
  },
  ENG: {
    name: "Inglaterra",
    flagUrl: "https://drive.google.com/uc?export=view&id=14O9LRg1Nuf0kq5rLVnDMsvsaassAngDb"
  },
  MAR: {
    name: "Marruecos",
    flagUrl: "https://drive.google.com/uc?export=view&id=1_fcfOQBQ8Y4Gqrxyqq9UH2RzTuCs39Ij"
  },
  MEX: {
    name: "México",
    flagUrl: "https://drive.google.com/uc?export=view&id=1lCrMZOTyNsTpltjKXWbrgixgqJegzX84"
  },
  POR: {
    name: "Portugal",
    flagUrl: "https://drive.google.com/uc?export=view&id=1sK08Xt5j6uc0afI5qGJ9Rl__0vczLoaA"
  }
};

function getTeamInfo(teamId) {
  return TEAM_CATALOG[teamId] || {
    name: teamId,
    flagUrl: ""
  };
}

loadDashboardData();
setInterval(loadDashboardData, REFRESH_MS);