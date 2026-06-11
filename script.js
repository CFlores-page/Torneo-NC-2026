const SHEET_ID = "1oKylf8lidgxrwjOkG4MpN4sVH9HB7VzJpNmmDOlpGw8"
const SHEET_NAME = "DASHBOARD"
const REFRESH_MS = 10000

let dashboardState = {
  summary: null,
  standings: [],
  upcomingMatches: [],
  liveMatches: [],
  teams: [],
  players: []
}

let currentTeamFilter = "ALL"
let openTeamIds = new Set()

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
}

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
}

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

  return (json.table?.rows || []).map(row =>
    (row.c || []).map(cell => cell ? (cell.f || cell.v || "") : "")
  )
}

async function getSheetFrom(sheetName, range) {
  const url =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${encodeURIComponent(sheetName)}&range=${range}&t=${Date.now()}`

  const res = await fetch(url)
  const text = await res.text()

  const jsonText = text.substring(
    text.indexOf("{"),
    text.lastIndexOf("}") + 1
  )

  const data = JSON.parse(jsonText)
  const rows = data.table.rows || []

  return rows.map(row =>
    (row.c || []).map(cell => (cell ? cell.v : ""))
  )
}

const matchCenterState = {
  matches: [],
  players: [],
  selectedMatchId: null
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map(part => part[0]).join("").toUpperCase() || "NA"
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") return 0
  const cleaned = String(value).replace(/[^0-9.-]/g, "")
  const num = Number(cleaned)
  return Number.isFinite(num) ? num : 0
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-MX").format(parseNumber(value))
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(parseNumber(value))
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function rowsToPlayerObjects(rows) {
  if (!rows || !rows.length) return []

  const headers = rows[0].map(normalizeHeader)
  const dataRows = rows.slice(1)

  const getIndex = (...names) => {
    for (const name of names) {
      const idx = headers.indexOf(normalizeHeader(name))
      if (idx !== -1) return idx
    }
    return -1
  }

  const idx = {
    playerId: getIndex("PLAYER_ID"),
    displayName: getIndex("NOMBRE_NORM", "JUGADORES"),
    unit: getIndex("UNIDAD"),
    teamId: getIndex("EQUIPO", "TEAM_ID"),
    captain: getIndex("CAPITAN"),
    photo: getIndex("HS_IMG", "HEADSHOT", "PLR_IMG"),
    flag: getIndex("BANDERA"),
    points: getIndex("PUNTOS"),
    sales: getIndex("VENTAS"),
    volume: getIndex("VOLUMEN"),
    average: getIndex("PROMEDIO")
  }

  return dataRows
    .filter(row => row[idx.playerId] || row[idx.displayName])
    .map(row => ({
      playerId: row[idx.playerId] || "",
      displayName: row[idx.displayName] || row[idx.playerId] || "Jugador",
      unit: row[idx.unit] || "",
      teamId: row[idx.teamId] || "",
      isCaptain: /^(SI|SÍ|YES|TRUE|CAPITAN|CAPITÁN)$/i.test(String(row[idx.captain] || "").trim()),
      photoUrl: row[idx.photo] || "",
      flagUrl: row[idx.flag] || "",
      points: parseNumber(row[idx.points]),
      sales: parseNumber(row[idx.sales]),
      volume: parseNumber(row[idx.volume]),
      average: parseNumber(row[idx.average])
    }))
}

function buildRosterList(teamId, players) {
  const teamPlayers = players
    .filter(player => player.teamId === teamId)
    .sort((a, b) => {
      if (a.isCaptain && !b.isCaptain) return -1
      if (!a.isCaptain && b.isCaptain) return 1
      return b.points - a.points
    })

  return teamPlayers.map(player => {
    const photo = driveImage(player.photoUrl)
    const avatar = photo
      ? `<img class="mc-player-avatar" src="${photo}" alt="${player.displayName}">`
      : `<div class="mc-player-avatar-placeholder">${getInitials(player.displayName)}</div>`

    return `
      <div class="mc-player-row">
        ${avatar}
        <div class="mc-player-meta">
          <div class="mc-player-name">${player.displayName}</div>
          <div class="mc-player-sub">${player.isCaptain ? "Capitán" : "Jugador"}</div>
        </div>
        <div class="mc-player-points">${formatNumber(player.points)}</div>
      </div>
    `
  }).join("")
}

function renderMatchStripCard(match, active = false) {
  const teamA = getTeamInfo(match.teamA)
  const teamB = getTeamInfo(match.teamB)

  const flagA = driveImage(teamA.flagUrl)
  const flagB = driveImage(teamB.flagUrl)

  return `
    <button class="mc-strip-card ${active ? "active" : ""}" data-match-id="${match.matchId}">
      <div class="mc-strip-vs">
        <div class="mc-strip-team">
          ${flagA ? `<img src="${flagA}" alt="${teamA.name}">` : ""}
          <span>${teamA.name}</span>
        </div>

        <div class="mc-strip-score">
          <strong>${formatNumber(match.scoreA)} - ${formatNumber(match.scoreB)}</strong>
        </div>

        <div class="mc-strip-team right">
          <span>${teamB.name}</span>
          ${flagB ? `<img src="${flagB}" alt="${teamB.name}">` : ""}
        </div>
      </div>

      <div class="mc-strip-footer">
        <span>${match.phase || "Partido en vivo"}</span>
        <strong>Termina: ${formatMatchDate(match.endDate)}</strong>
      </div>
    </button>
  `
}

function formatMatchDate(value) {
  if (!value) return "Pendiente"

  const date = new Date(value)

  if (isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric"
  })
}

function renderMatchCenterStage(match, players) {
  const teamA = getTeamInfo(match.teamA)
  const teamB = getTeamInfo(match.teamB)

  const teamAColors = getTeamColors(match.teamA)
  const teamBColors = getTeamColors(match.teamB)

  const teamAPlayers = players.filter(player => player.teamId === match.teamA)
  const teamBPlayers = players.filter(player => player.teamId === match.teamB)

  const pointsA = parseNumber(match.scoreA)
  const pointsB = parseNumber(match.scoreB)
  const total = Math.max(pointsA + pointsB, 1)
  const shareA = clamp((pointsA / total) * 100, 0, 100)
  const shareB = clamp((pointsB / total) * 100, 0, 100)

  const topA = [...teamAPlayers].sort((a, b) => b.points - a.points)[0]
  const topB = [...teamBPlayers].sort((a, b) => b.points - a.points)[0]

  const teamAFlag = driveImage(teamA.flagUrl)
  const teamBFlag = driveImage(teamB.flagUrl)

  return `
    <div
      class="mc-stage"
      style="
        --team-a-primary: ${teamAColors.primary};
        --team-b-primary: ${teamBColors.primary};
        --team-a-share: ${shareA}%;
        --team-b-share: ${shareB}%;
      "
    >
      <div class="mc-stage-inner">
        <div class="mc-stage-topline">
          <div class="mc-stage-badge">LIVE MATCH</div>
        </div>

        <div class="mc-headline">
          <div class="mc-team-hero">
            ${teamAFlag ? `<img class="mc-team-flag" src="${teamAFlag}" alt="${teamA.name}">` : ""}
            <div class="mc-team-name">${teamA.name}</div>
            <div class="mc-team-unit">${teamAPlayers[0]?.unit || ""}</div>
            <div class="mc-team-points">Tournament Points<strong>${formatNumber(teamAPlayers.reduce((sum, p) => sum + p.points, 0))}</strong></div>
          </div>

          <div class="mc-score-center">
            <div class="mc-phase-line">${match.phase || "Partido en vivo"}</div>
            <div class="mc-time-line">${match.final || ""}</div>
            <div class="mc-main-score">${formatNumber(pointsA)} - ${formatNumber(pointsB)}</div>
          </div>

          <div class="mc-team-hero right">
            ${teamBFlag ? `<img class="mc-team-flag" src="${teamBFlag}" alt="${teamB.name}">` : ""}
            <div class="mc-team-name">${teamB.name}</div>
            <div class="mc-team-unit">${teamBPlayers[0]?.unit || ""}</div>
            <div class="mc-team-points">Tournament Points<strong>${formatNumber(teamBPlayers.reduce((sum, p) => sum + p.points, 0))}</strong></div>
          </div>
        </div>

        <div class="mc-progress-wrap">
          <div class="mc-progress-head">
            <span>${teamA.name} ${formatNumber(pointsA)}</span>
            <span>Points Progress</span>
            <span>${teamB.name} ${formatNumber(pointsB)}</span>
          </div>

          <div class="mc-progress-bar">
            <div class="mc-progress-a"></div>
            <div class="mc-progress-b"></div>
          </div>
        </div>

        <div class="mc-body-grid">
          <div class="mc-roster-card">
            <div class="mc-roster-head">
              <div>
                <h3>${teamA.name} Roster</h3>
                <span>${teamAPlayers.length} jugadores</span>
              </div>
            </div>

            <div class="mc-roster-list">
              ${buildRosterList(match.teamA, players)}
            </div>
          </div>

          <div class="mc-center-card">
            <div class="mc-mini-stats">
              <div class="mc-stat-box">
                <span>Top contributor</span>
                <strong>${topA ? topA.displayName : "—"}</strong>
              </div>

              <div class="mc-stat-box">
                <span>Top contributor</span>
                <strong>${topB ? topB.displayName : "—"}</strong>
              </div>

              <div class="mc-stat-box">
                <span>${teamA.name}</span>
                <strong>${topA ? formatNumber(topA.points) : "0"} pts</strong>
              </div>

              <div class="mc-stat-box">
                <span>${teamB.name}</span>
                <strong>${topB ? formatNumber(topB.points) : "0"} pts</strong>
              </div>
            </div>

            <div class="mc-info-grid">
              <div class="mc-info-card">
                <h4>Match Info</h4>
                <div class="mc-info-list">
                  <div class="mc-info-row"><span>Formato</span><strong>Head-to-Head</strong></div>
                  <div class="mc-info-row"><span>Scoring</span><strong>Total Sales Points</strong></div>
                  <div class="mc-info-row"><span>Tiebreaker</span><strong>Most Volume</strong></div>
                </div>
              </div>

              <div class="mc-info-card">
                <h4>Recent Activity</h4>
                <div class="mc-activity-list">
                  <div class="mc-activity-item">
                    <span class="mc-activity-tag a">${teamA.name}</span>
                    <span>${topA ? `${topA.displayName} lidera con ${formatNumber(topA.points)} puntos` : "Sin actividad registrada"}</span>
                  </div>
                  <div class="mc-activity-item">
                    <span class="mc-activity-tag b">${teamB.name}</span>
                    <span>${topB ? `${topB.displayName} lidera con ${formatNumber(topB.points)} puntos` : "Sin actividad registrada"}</span>
                  </div>
                  <div class="mc-activity-item">
                    <span class="mc-activity-tag a">${teamA.name}</span>
                    <span>Marcador actual: ${formatNumber(pointsA)}</span>
                  </div>
                  <div class="mc-activity-item">
                    <span class="mc-activity-tag b">${teamB.name}</span>
                    <span>Marcador actual: ${formatNumber(pointsB)}</span>
                  </div>
                </div>
              </div>

              <div class="mc-info-card">
                <h4>About This Match</h4>
                <div class="mc-info-list">
                  <div class="mc-info-row"><span>Fase</span><strong>${match.phase || "—"}</strong></div>
                  <div class="mc-info-row"><span>Match ID</span><strong>${match.matchId || "—"}</strong></div>
                  <div class="mc-info-row"><span>Estado</span><strong>Live</strong></div>
                </div>
              </div>
            </div>
          </div>

          <div class="mc-roster-card">
            <div class="mc-roster-head">
              <div>
                <h3>${teamB.name} Roster</h3>
                <span>${teamBPlayers.length} jugadores</span>
              </div>
            </div>

            <div class="mc-roster-list">
              ${buildRosterList(match.teamB, players)}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

async function loadMatchCenterData() {
  try {
    const [partidosRows, playerRows, summaryRows] = await Promise.all([
      getSheetFrom("PARTIDOS", "A2:K200"),
      getSheetFrom("JUGADORES", "A1:Z500"),
      getSheetFrom("DASHBOARD", "A2:B25")
    ])

    const matches = partidosRowsToObjects(partidosRows)
      .filter(match => {
        const status = String(match.status || "").toUpperCase()
        return status === "EN VIVO" || status === "LIVE" || status === "ACTIVO"
      })

    const players = rowsToPlayerObjects(playerRows)
    const summary = summaryRowsToObject(summaryRows)

    matchCenterState.matches = matches
    matchCenterState.players = players

    if (!matchCenterState.selectedMatchId && matches.length) {
      matchCenterState.selectedMatchId = matches[0].matchId
    }

    const selectedMatch =
      matches.find(match => match.matchId === matchCenterState.selectedMatchId) ||
      matches[0] ||
      null

    renderMatchCenter(matches, selectedMatch, players, summary)
    updateMatchCenterClock()
  } catch (error) {
    console.error("Error loading Match Center:", error)

    const strip = document.getElementById("matchCenterStrip")
    const stage = document.getElementById("matchCenterStage")

    if (strip) {
      strip.innerHTML = `
        <div class="empty-state">
          <strong>Error cargando partidos</strong>
          <p>${error.message}</p>
        </div>
      `
    }

    if (stage) {
      stage.innerHTML = `
        <div class="empty-state">
          <strong>Error cargando Match Center</strong>
          <p>${error.message}</p>
        </div>
      `
    }
  }
}

function renderMatchCenter(matches, selectedMatch, players, summary = {}) {
  const strip = document.getElementById("matchCenterStrip")
  const stage = document.getElementById("matchCenterStage")

  const mcPeriod = document.getElementById("mcPeriod")
  const mcPhase = document.getElementById("mcPhase")

  if (mcPeriod) {
    mcPeriod.textContent = summary["Fase actual"] || summary["Estado del torneo"] || "En curso"
  }

  if (mcPhase) {
    mcPhase.textContent = summary["Última actualización"] || "Actualización en vivo"
  }

  if (!matches.length) {
    strip.innerHTML = `
      <div class="empty-state">
        <strong>No hay partidos en vivo</strong>
        <p>Cuando existan partidos activos aparecerán aquí.</p>
      </div>
    `

    stage.innerHTML = `
      <div class="empty-state">
        <strong>Sin partido activo</strong>
        <p>No hay head-to-head disponible en este momento.</p>
      </div>
    `
    return
  }

  strip.innerHTML = matches
    .map(match => renderMatchStripCard(match, selectedMatch && match.matchId === selectedMatch.matchId))
    .join("")

  stage.innerHTML = selectedMatch
    ? renderMatchCenterStage(selectedMatch, players)
    : `
      <div class="empty-state">
        <strong>Selecciona un partido</strong>
        <p>Elige uno de los partidos activos de la franja superior.</p>
      </div>
    `

  strip.querySelectorAll(".mc-strip-card").forEach(button => {
    button.addEventListener("click", () => {
      matchCenterState.selectedMatchId = button.dataset.matchId
      const nextMatch = matchCenterState.matches.find(match => match.matchId === matchCenterState.selectedMatchId)
      renderMatchCenter(matchCenterState.matches, nextMatch, matchCenterState.players, summary)
    })
  })
}

function updateMatchCenterClock() {
  const timeEl = document.getElementById("mcServerTime")
  const dateEl = document.getElementById("mcServerDate")
  if (!timeEl || !dateEl) return

  const now = new Date()

  timeEl.textContent = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  })

  dateEl.textContent = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })
}

function setupMatchCenterStripArrows() {
  const strip = document.getElementById("matchCenterStrip")
  const prev = document.getElementById("mcStripPrev")
  const next = document.getElementById("mcStripNext")

  if (!strip || !prev || !next) return

  const scrollAmount = 320

  prev.addEventListener("click", () => {
    strip.scrollBy({
      left: -scrollAmount,
      behavior: "smooth"
    })
  })

  next.addEventListener("click", () => {
    strip.scrollBy({
      left: scrollAmount,
      behavior: "smooth"
    })
  })
}

async function loadDashboardData() {
  try {
    const [
      summaryRows,
      standingsRows,
      upcomingRows,
      liveRows,
      teamRows,
      playerRows
    ] = await Promise.all([
      getSheet("A2:B25", "DASHBOARD"),
      getSheet("A28:G40", "DASHBOARD"),
      getSheet("A44:F49", "DASHBOARD"),
      getSheet("A53:G58", "DASHBOARD"),
      getSheet("A2:H50", "EQUIPOS"),
      getSheet("A2:M300", "JUGADORES")
    ])

    const summary = summaryRowsToObject(summaryRows)
    const standings = standingsRowsToObjects(standingsRows)
    const upcomingMatches = upcomingRowsToObjects(upcomingRows)
    const liveMatches = liveRowsToObjects(liveRows)
    const teams = teamRowsToObjects(teamRows)
    const players = playerRowsToObjects(playerRows)

    dashboardState = {
      summary,
      standings,
      upcomingMatches,
      liveMatches,
      teams,
      players
    }

    updateDashboardCards(summary)
    renderStandings(standings)
    renderUpcomingMatches(upcomingMatches)
    renderLiveMatches(liveMatches)
    renderTeamsPage(teams, players)

    console.log("Datos cargados:", dashboardState)
  } catch (error) {
    console.error("Error cargando datos del torneo:", error)
    showTeamsError(error)
  }
}

function summaryRowsToObject(rows) {
  const obj = {}

  rows.forEach(row => {
    const key = String(row[0] || "").trim()
    const value = row[1] || ""

    if (key) {
      obj[key] = value
    }
  })

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
  }
}

function standingsRowsToObjects(rows) {
  return rows
    .filter(row => row[0] && row[1] && row[1] !== "#N/A")
    .map(row => ({
      rank: row[0],
      teamId: normalizeId(row[1]),
      name: row[2],
      unit: normalizeId(row[3]),
      sales: parseNumber(row[4]),
      points: parseNumber(row[5]),
      status: String(row[6] || "").trim()
    }))
}

function upcomingRowsToObjects(rows) {
  return rows
    .filter(row => row[0])
    .map(row => ({
      matchId: row[0],
      phase: row[1],
      teamA: normalizeId(row[2]),
      teamB: normalizeId(row[3]),
      startDate: row[4],
      endDate: row[5],
      status: "PRÓXIMO"
    }))
}

function liveRowsToObjects(rows) {
  return rows
    .filter(row => row[0])
    .map(row => ({
      matchId: row[0],
      phase: row[1],
      teamA: normalizeId(row[2]),
      teamB: normalizeId(row[3]),
      endDate: row[4],
      pointsA: parseNumber(row[5]),
      pointsB: parseNumber(row[6]),
      status: "EN VIVO"
    }))
}

function teamRowsToObjects(rows) {
  return rows
    .filter(row => row[0] && row[1])
    .map(row => ({
      teamName: row[0],
      teamId: normalizeId(row[1]),
      captainName: row[2],
      unit: normalizeId(row[3]),
      flagUrl: row[4],
      status: String(row[5] || "").trim(),
      points: parseNumber(row[6]),
      sales: parseNumber(row[7])
    }))
}

function playerRowsToObjects(rows) {
  return rows
    .filter(row => row[0] && row[1] && row[4])
    .map(row => ({
      playerId: row[0],
      fullName: row[1],
      displayName: row[2] || row[1],
      unit: normalizeId(row[3]),
      teamId: normalizeId(row[4]),
      isCaptain: String(row[5] || "").trim().toUpperCase() === "SI",
      photoUrl: row[6],
      flagUrl: row[7],
      points: parseNumber(row[8]),
      sales: parseNumber(row[9]),
      volume: parseNumber(row[10]),
      average: parseNumber(row[11]),
      teamPointShare: parsePercent(row[12])
    }))
}

function updateDashboardCards(summary) {
  setText("faseActual", summary.currentPhase || "Pendiente")
  setText("equiposActivos", summary.activeTeams || 0)
  setText("ventasRegistradas", summary.totalSales || 0)

  const leader = String(summary.currentLeader || "Pendiente")
  const parts = leader.split(" - ")

  setText("liderActual", parts[0] || "Pendiente")
  setText("puntosLider", parts[1] || "")
  setText("lastUpdate", summary.lastUpdate || "Pendiente")
}

function renderStandings(standings) {
  const standingsBody = document.getElementById("standingsBody")
  if (!standingsBody) return

  if (!standings || standings.length === 0) {
    standingsBody.innerHTML = `
      <tr>
        <td colspan="5">Información pendiente</td>
      </tr>
    `
    return
  }

  standingsBody.innerHTML = standings
    .map(team => {
      const teamInfo = getTeamInfo(team.teamId)
      const flag = driveImage(teamInfo.flagUrl)
      const statusText = team.status || "Pendiente"
      const statusClass = statusText.toUpperCase() === "ACTIVO" ? "active" : "eliminated"

      return `
        <tr>
          <td>${team.rank}</td>
          <td>
            <div class="team-name-cell">
              ${flag ? `<img class="team-flag" src="${flag}" alt="Bandera de ${teamInfo.name}">` : ""}
              <span>${teamInfo.name || team.name}</span>
            </div>
          </td>
          <td>${team.unit}</td>
          <td>${team.points}</td>
          <td><span class="status ${statusClass}">${statusText}</span></td>
        </tr>
      `
    })
    .join("")
}

function renderUpcomingMatches(matches) {
  const container = document.getElementById("upcomingMatches")
  if (!container) return

  if (!matches || matches.length === 0) {
    container.className = "empty-state"
    container.innerHTML = `
      <strong>Calendario pendiente</strong>
      <p>Los próximos partidos se mostrarán cuando se publiquen oficialmente.</p>
    `
    return
  }

  container.className = "matches-list"
  container.innerHTML = `
    <div class="matches-scroll">
      ${matches.map(match => {
        const teamA = getTeamInfo(match.teamA)
        const teamB = getTeamInfo(match.teamB)

        return `
          <div class="match-card">
            <span>${match.phase || "Próximo partido"}</span>

            <div class="match-teams">
              ${renderMatchTeam(teamA)}
              <div class="match-vs">VS</div>
              ${renderMatchTeam(teamB)}
            </div>

            <p>${match.startDate || "Inicio pendiente"} — ${match.endDate || "Final pendiente"}</p>
          </div>
        `
      }).join("")}
    </div>

    <a class="match-more-banner" href="#">
      Ver calendario completo en Match Center
    </a>
  `
}

function renderLiveMatches(matches) {
  const container = document.getElementById("liveMatches")
  if (!container) return

  if (!matches || matches.length === 0) {
    container.className = "empty-state"
    container.innerHTML = `
      <strong>Información pendiente</strong>
      <p>Los partidos aparecerán aquí cuando estén en vivo.</p>
    `
    return
  }

  container.className = "matches-list"
  container.innerHTML = `
    <div class="matches-scroll">
      ${matches.map(match => {
        const teamA = getTeamInfo(match.teamA)
        const teamB = getTeamInfo(match.teamB)

        return `
          <div class="match-card live">
            <span>${match.phase || "Partido en vivo"}</span>

            <div class="match-teams">
              ${renderMatchTeam(teamA, match.pointsA)}
              <div class="match-vs">VS</div>
              ${renderMatchTeam(teamB, match.pointsB)}
            </div>

            <p>En vivo · finaliza ${match.endDate || "pendiente"}</p>
          </div>
        `
      }).join("")}
    </div>

    <a class="match-more-banner" href="#">
      Ver todos los partidos en Match Center
    </a>
  `
}

function renderMatchTeam(team, points = null) {
  const flag = driveImage(team.flagUrl)

  return `
    <div class="match-team">
      ${flag ? `<img class="team-flag-large" src="${flag}" alt="Bandera de ${team.name}">` : ""}
      <div class="match-team-name">${team.name}</div>
      ${points !== null && points !== undefined && points !== "" ? `<div class="match-score">${points}</div>` : ""}
    </div>
  `
}

function renderTeamsPage(teams, players) {
  const container = document.getElementById("teamsContainer")
  if (!container) return

  if (!teams || teams.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>Equipos pendientes</strong>
        <p>No se encontraron datos en la hoja EQUIPOS.</p>
      </div>
    `
    return
  }

  const unitOrder = ["ELITE", "PREMIER", "BALFER", "LOYALTY"]
  const visibleUnits = currentTeamFilter === "ALL" ? unitOrder : [currentTeamFilter]

  container.innerHTML = visibleUnits
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

function sortPlayersForTeam(players) {
  return [...players].sort((a, b) => {
    if (a.isCaptain !== b.isCaptain) return a.isCaptain ? -1 : 1
    if (b.points !== a.points) return b.points - a.points
    if (b.sales !== a.sales) return b.sales - a.sales

    return String(a.displayName || "").localeCompare(String(b.displayName || ""))
  })
}

function renderCountryAccordion(team, players) {
  const teamInfo = getTeamInfo(team.teamId)
  const teamColors = getTeamColors(team.teamId)
  const unitColors = getUnitColors(team.unit)
  const sortedPlayers = sortPlayersForTeam(players)
  const flag = driveImage(team.flagUrl || teamInfo.flagUrl)
  const statusText = team.status || "Pendiente"
  const statusClass = statusText.toUpperCase() === "ACTIVO" ? "active" : "eliminated"
  const isOpen = openTeamIds.has(team.teamId)

  return `
    <article
      class="country-team-card ${isOpen ? "open" : ""}"
      data-team-card="${team.teamId}"
      style="
        --team-primary: ${teamColors.primary};
        --team-secondary: ${teamColors.secondary};
        --team-accent: ${teamColors.accent};
        --team-bg: ${teamColors.bg};
        --unit-primary: ${unitColors.primary};
        --unit-bg: ${unitColors.bg};
      "
    >
      <button class="country-team-header" type="button" data-team-toggle="${team.teamId}">
        <div class="country-team-main">
          ${flag ? `<img class="country-team-flag" src="${flag}" alt="Bandera de ${teamInfo.name}">` : ""}

          <div>
            <h3>${teamInfo.name}</h3>
            <p>${sortedPlayers.length} integrantes · Capitán: ${team.captainName || "Pendiente"}</p>
          </div>
        </div>

        <div class="country-team-stats">
          <span class="unit-chip">${team.unit}</span>
          <span class="status ${statusClass}">${statusText}</span>
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
  const performance = clamp(parseNumber(player.teamPointShare), 0, 100)

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
      </div>
    </article>
  `
}

function setupViewNavigation() {
  const menuButtons = document.querySelectorAll(".menu-item[data-view]")
  const views = document.querySelectorAll(".view")

  menuButtons.forEach(button => {
    button.addEventListener("click", () => {
      const viewId = button.dataset.view
      const targetView = document.getElementById(viewId)

      if (!targetView) return

      menuButtons.forEach(item => item.classList.remove("active"))
      button.classList.add("active")

      views.forEach(view => view.classList.add("hidden"))
      targetView.classList.remove("hidden")
    })
  })
}

function setupTeamFilters() {
  const filterButtons = document.querySelectorAll("[data-unit-filter]")

  filterButtons.forEach(button => {
    button.addEventListener("click", () => {
      currentTeamFilter = normalizeId(button.dataset.unitFilter || "ALL")

      filterButtons.forEach(item => item.classList.remove("active"))
      button.classList.add("active")

      renderTeamsPage(dashboardState.teams, dashboardState.players)
    })
  })
}

function setupTeamAccordions() {
  document.querySelectorAll("[data-team-toggle]").forEach(button => {
    button.addEventListener("click", () => {
      const teamId = normalizeId(button.dataset.teamToggle)
      const card = button.closest(".country-team-card")

      if (!card || !teamId) return

      card.classList.toggle("open")

      if (card.classList.contains("open")) {
        openTeamIds.add(teamId)
      } else {
        openTeamIds.delete(teamId)
      }
    })
  })
}

function showTeamsError(error) {
  const container = document.getElementById("teamsContainer")
  if (!container) return

  container.innerHTML = `
    <div class="empty-state">
      <strong>Error cargando equipos</strong>
      <p>${error.message || "Revisa la consola para más detalles."}</p>
    </div>
  `
}

function getTeamInfo(teamId) {
  const id = normalizeId(teamId)

  return TEAM_CATALOG[id] || {
    name: id || "Equipo pendiente",
    flagUrl: ""
  }
}

function getTeamColors(teamId) {
  const id = normalizeId(teamId)

  return TEAM_COLORS[id] || {
    primary: "#1D6FFF",
    secondary: "#68A7FF",
    accent: "#FFFFFF",
    bg: "#071426"
  }
}

function getUnitColors(unit) {
  const key = normalizeId(unit)

  return UNIT_COLORS[key] || {
    primary: "#6DAEFF",
    secondary: "#1D6FFF",
    accent: "#D8ECFF",
    bg: "#071A33"
  }
}

function driveImage(url) {
  const raw = String(url || "").trim()
  if (!raw) return ""

  if (raw.includes("thumbnail?id=")) {
    return raw
  }

  if (raw.includes("uc?export=view&id=")) {
    try {
      const parsed = new URL(raw)
      const id = parsed.searchParams.get("id")

      if (id) {
        return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`
      }
    } catch (error) {
      const id = raw.split("id=")[1]?.split("&")[0]

      if (id) {
        return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`
      }
    }
  }

  const match = raw.match(/\/d\/([^/]+)/)
  if (match) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`
  }

  return raw
}

function normalizeId(value) {
  return String(value || "").trim().toUpperCase()
}

function parseNumber(value) {
  if (typeof value === "number") return value

  const raw = String(value || "")
    .replace(/[$,%]/g, "")
    .replace(/,/g, "")
    .trim()

  const num = Number(raw)

  return Number.isFinite(num) ? num : 0
}

function parsePercent(value) {
  const raw = String(value || "").trim()

  if (!raw || raw === "#DIV/0!") return 0

  if (raw.includes("%")) {
    return clamp(parseNumber(raw), 0, 100)
  }

  const num = parseNumber(raw)

  if (num <= 1) {
    return clamp(Math.round(num * 100), 0, 100)
  }

  return clamp(Math.round(num), 0, 100)
}

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || 0, min), max)
}

function partidosRowsToObjects(rows) {
  if (!rows || !rows.length) return []

  return rows
    .filter(row => row[0] && row[3] && row[4])
    .map(row => ({
      matchId: String(row[0] || "").trim(),
      phase: String(row[1] || "").trim(),
      matchday: String(row[2] || "").trim(),
      teamA: String(row[3] || "").trim().toUpperCase(),
      teamB: String(row[4] || "").trim().toUpperCase(),
      startDate: row[5] || "",
      endDate: row[6] || "",
      status: String(row[7] || "").trim(),
      scoreA: parseNumber(row[8]),
      scoreB: parseNumber(row[9]),
      winner: String(row[10] || "").trim().toUpperCase()
    }))
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
  return new Intl.NumberFormat("es-MX").format(parseNumber(value))
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(parseNumber(value))
}

function setText(id, value) {
  const element = document.getElementById(id)

  if (element) {
    element.textContent = value
  }
}

setupViewNavigation()
setupMatchCenterStripArrows()
loadDashboardData()
setInterval(loadDashboardData, REFRESH_MS)