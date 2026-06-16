const SHEET_ID = "1oKylf8lidgxrwjOkG4MpN4sVH9HB7VzJpNmmDOlpGw8"
const SHEET_NAME = "DASHBOARD"
const REFRESH_MS = 10000

let dashboardState = {
  summary: null,
  standings: [],
  upcomingMatches: [],
  liveMatches: [],
  teams: [],
  players: [],
  liveFeed: [],
  tournamentStandings: [],
  allTournamentMatches: []
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
    (row.c || []).map(cell => cell ? (cell.v ?? cell.f ?? "") : "")
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

function setupMobileMenu() {
  const button = document.getElementById("mobileMenuButton")
  const overlay = document.getElementById("mobileMenuOverlay")
  const menuItems = document.querySelectorAll(".menu-item[data-view]")

  if (!button || !overlay) return

  const closeMenu = () => {
    document.body.classList.remove("mobile-menu-open")
    button.setAttribute("aria-label", "Abrir menú")
    button.textContent = "☰"
  }

  const openMenu = () => {
    document.body.classList.add("mobile-menu-open")
    button.setAttribute("aria-label", "Cerrar menú")
    button.textContent = "×"
  }

  const toggleMenu = () => {
    if (document.body.classList.contains("mobile-menu-open")) {
      closeMenu()
    } else {
      openMenu()
    }
  }

  button.addEventListener("click", toggleMenu)
  overlay.addEventListener("click", closeMenu)

  menuItems.forEach(item => {
    item.addEventListener("click", closeMenu)
  })

  window.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeMenu()
    }
  })

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      closeMenu()
    }
  })
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
    .filter(row => {
      const playerId = idx.playerId >= 0 ? row[idx.playerId] : ""
      const displayName = idx.displayName >= 0 ? row[idx.displayName] : ""
      const teamId = idx.teamId >= 0 ? row[idx.teamId] : ""

      return playerId && displayName && teamId
    })
    .map(row => ({
      playerId: idx.playerId >= 0 ? row[idx.playerId] || "" : "",
      displayName: idx.displayName >= 0 ? row[idx.displayName] || row[idx.playerId] || "Jugador" : "Jugador",
      unit: idx.unit >= 0 ? normalizeId(row[idx.unit]) : "",
      teamId: idx.teamId >= 0 ? normalizeId(row[idx.teamId]) : "",
      isCaptain: idx.captain >= 0
        ? /^(SI|SÍ|YES|TRUE|CAPITAN|CAPITÁN)$/i.test(String(row[idx.captain] || "").trim())
        : false,
      photoUrl: idx.photo >= 0 ? row[idx.photo] || "" : "",
      flagUrl: idx.flag >= 0 ? row[idx.flag] || "" : "",
      points: idx.points >= 0 ? parseNumber(row[idx.points]) : 0,
      sales: idx.sales >= 0 ? parseNumber(row[idx.sales]) : 0,
      volume: idx.volume >= 0 ? parseNumber(row[idx.volume]) : 0,
      average: idx.average >= 0 ? parseNumber(row[idx.average]) : 0
    }))
}

function buildRosterList(teamId, players) {
  const cleanTeamId = normalizeId(teamId)

  const teamPlayers = players
    .filter(player => normalizeId(player.teamId) === cleanTeamId)
    .sort((a, b) => {
      if (a.isCaptain && !b.isCaptain) return -1
      if (!a.isCaptain && b.isCaptain) return 1
      if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints
      if (b.points !== a.points) return b.points - a.points
      return String(a.displayName || "").localeCompare(String(b.displayName || ""))
    })

  if (!teamPlayers.length) {
    return `
      <div class="mc-empty-roster">
        Roster pendiente de cargar
      </div>
    `
  }

  return teamPlayers.map(player => {
    const photo = driveImage(player.headshotUrl || player.photoUrl || player.fullBodyUrl)
    const avatar = photo
      ? `<img class="mc-player-avatar" src="${photo}" alt="${player.displayName}">`
      : `<div class="mc-player-avatar-placeholder">${getInitials(player.displayName)}</div>`

    return `
      <div class="mc-player-row">
        ${avatar}
        <div class="mc-player-meta">
          <div class="mc-player-name">${player.displayName}</div>
          <div class="mc-player-sub">
            ${player.isCaptain ? "Capitán" : "Jugador"} · ${formatNumber(player.points)} pts torneo
          </div>
        </div>
        <div class="mc-player-points">${formatNumber(player.matchPoints)}</div>
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

  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric"
    })
  }

  const raw = String(value).trim()

  const gvizMatch = raw.match(/^Date\((\d+),(\d+),(\d+)\)$/)

  if (gvizMatch) {
    const year = Number(gvizMatch[1])
    const month = Number(gvizMatch[2])
    const day = Number(gvizMatch[3])

    const date = new Date(year, month, day)

    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric"
    })
  }

  const date = new Date(raw)

  if (isNaN(date.getTime())) {
    return raw
  }

  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric"
  })
}

function renderTopContributorShowcase(player, teamName, sideClass) {
  if (!player) {
    return `
      <div class="mc-showcase-card ${sideClass} empty">
        <div class="mc-showcase-empty">
          <span>${teamName}</span>
          <strong>Sin ventas registradas</strong>
          <p>El top contributor aparecerá cuando el equipo sume su primera venta.</p>
        </div>
      </div>
    `
  }

  const image = driveImage(player.fullBodyUrl || player.photoUrl || player.headshotUrl || "")

  return `
    <div class="mc-showcase-card ${sideClass}">
      <div class="mc-showcase-stage">
        ${
          image
            ? `
              <div class="mc-showcase-bg-figure">
                <img class="mc-showcase-bg-img" src="${image}" alt="${player.displayName}">
              </div>
            `
            : `
              <div class="mc-showcase-bg-figure no-image">
                <div class="mc-showcase-placeholder">${getInitials(player.displayName)}</div>
              </div>
            `
        }

        <div class="mc-showcase-result">
          <span class="mc-showcase-label">Top Contributor</span>
          <strong class="mc-showcase-name">${player.displayName}</strong>
          <div class="mc-showcase-points">
            <strong>${formatNumber(player.points)}</strong>
            <span>pts</span>
          </div>
        </div>
      </div>
    </div>
  `
}

function activateView(viewId) {
  const menuButtons = document.querySelectorAll(".menu-item[data-view]")
  const views = document.querySelectorAll(".view")
  const targetView = document.getElementById(viewId)

  if (!targetView) return

  menuButtons.forEach(item => {
    item.classList.toggle("active", item.dataset.view === viewId)
  })

  views.forEach(view => view.classList.add("hidden"))
  targetView.classList.remove("hidden")
}

function renderMatchCenterStage(match, players) {
  const teamA = getTeamInfo(match.teamA)
  const teamB = getTeamInfo(match.teamB)

  const teamAColors = getTeamColors(match.teamA)
  const teamBColors = getTeamColors(match.teamB)

  const teamAPlayers = players.filter(player => normalizeId(player.teamId) === normalizeId(match.teamA))
  const teamBPlayers = players.filter(player => normalizeId(player.teamId) === normalizeId(match.teamB))

  const pointsA = parseNumber(match.scoreA)
  const pointsB = parseNumber(match.scoreB)
  const total = Math.max(pointsA + pointsB, 1)
  const shareA = clamp((pointsA / total) * 100, 0, 100)
  const shareB = clamp((pointsB / total) * 100, 0, 100)

  const topA = [...teamAPlayers]
    .filter(player => parseNumber(player.matchPoints) > 0)
    .sort((a, b) => {
      if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints
      if (b.points !== a.points) return b.points - a.points
      return String(a.displayName || "").localeCompare(String(b.displayName || ""))
    })[0] || null

  const topB = [...teamBPlayers]
    .filter(player => parseNumber(player.matchPoints) > 0)
    .sort((a, b) => {
      if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints
      if (b.points !== a.points) return b.points - a.points
      return String(a.displayName || "").localeCompare(String(b.displayName || ""))
    })[0] || null

  const teamAFlag = driveImage(teamA.flagUrl)
  const teamBFlag = driveImage(teamB.flagUrl)

  const topAImage = driveImage(topA?.fullBodyUrl || topA?.photoUrl || "")
  const topBImage = driveImage(topB?.fullBodyUrl || topB?.photoUrl || "")

  const standingsByTeam = new Map(
    (dashboardState.tournamentStandings || []).map(row => [
      normalizeId(row.teamId),
      row
    ])
  )

  const teamATournamentPoints =
    parseNumber(standingsByTeam.get(normalizeId(match.teamA))?.tournamentPoints)

  const teamBTournamentPoints =
    parseNumber(standingsByTeam.get(normalizeId(match.teamB))?.tournamentPoints)

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
          <div class="mc-team-hero left">
            ${teamAFlag ? `<img class="mc-team-flag" src="${teamAFlag}" alt="${teamA.name}">` : ""}
            <div class="mc-team-name">${teamA.name}</div>
            <div class="mc-team-unit">${teamAPlayers[0]?.unit || ""}</div>
            <div class="mc-team-points">
              Tournament Points
              <strong>${formatNumber(teamATournamentPoints)}</strong>
            </div>
          </div>

          <div class="mc-score-center">
            <div class="mc-phase-line">${match.phase || "Partido en vivo"}</div>
            <div class="mc-time-line">Termina: ${formatMatchDate(match.endDate)}</div>
            <div class="mc-main-score">${formatNumber(pointsA)} - ${formatNumber(pointsB)}</div>
          </div>

          <div class="mc-team-hero right">
            ${teamBFlag ? `<img class="mc-team-flag" src="${teamBFlag}" alt="${teamB.name}">` : ""}
            <div class="mc-team-name">${teamB.name}</div>
            <div class="mc-team-unit">${teamBPlayers[0]?.unit || ""}</div>
            <div class="mc-team-points">
              Tournament Points
              <strong>${formatNumber(teamBTournamentPoints)}</strong>
            </div>
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
              ${renderTopContributorShowcase(topA, teamA.name, "a")}
              ${renderTopContributorShowcase(topB, teamB.name, "b")}
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
                    <span>${topA ? `${topA.displayName} lidera este partido con ${formatNumber(topA.matchPoints)} puntos` : "Sin actividad registrada"}</span>
                  </div>
                  <div class="mc-activity-item">
                    <span class="mc-activity-tag b">${teamB.name}</span>
                    <span>${topB ? `${topB.displayName} lidera este partido con ${formatNumber(topB.matchPoints)} puntos` : "Sin actividad registrada"}</span>
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
                  <div class="mc-info-row"><span>Finaliza</span><strong>${formatMatchDate(match.endDate)}</strong></div>
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
      getSheetFrom("JUGADORES", "A2:O500"),
      getSheetFrom("DASHBOARD", "A2:B25")
    ])

    const matches = partidosRowsToObjects(partidosRows)
      .filter(match => {
        const status = String(match.status || "").toUpperCase()
        return status === "EN VIVO" || status === "LIVE" || status === "ACTIVO"
      })

    const players = matchCenterPlayerRowsToObjects(playerRows)
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

function matchCenterPlayerRowsToObjects(rows) {
  return rows
    .filter(row => row[0] && row[1] && row[4])
    .map(row => ({
      playerId: row[0] || "",
      fullName: row[1] || "",
      displayName: row[2] || row[1] || "Jugador",
      unit: normalizeId(row[3] || ""),
      teamId: normalizeId(row[4] || ""),
      isCaptain: /^(SI|SÍ|YES|TRUE)$/i.test(String(row[5] || "").trim()),

      fullBodyUrl: row[6] || "",
      flagUrl: row[7] || "",

      // Tournament totals — DO NOT CHANGE THESE
      points: parseNumber(row[8]),
      sales: parseNumber(row[9]),
      volume: parseNumber(row[10]),
      average: parseNumber(row[11]),
      teamPointShare: parsePercent(row[12]),
      headshotUrl: row[13] || "",
      photoUrl: row[13] || row[6] || "",

      // Current live match only — from JUGADORES!O:O
      matchPoints: parseNumber(row[14])
    }))
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
      phaseRows,
      summaryRows,
      standingsRows,
      upcomingRows,
      liveRows,
      teamsRows,
      playersRows,
      liveFeedRows,
      partidosRows
    ] = await Promise.all([
      getSheet("B4:B4", "DASHBOARD"),
      getSheet("A2:B25", "DASHBOARD"),
      getSheet("A28:G40", "DASHBOARD"),
      getSheet("A44:F49", "DASHBOARD"),
      getSheet("A53:G58", "DASHBOARD"),
      getSheet("A2:H50", "EQUIPOS"),
      getSheet("A2:P300", "JUGADORES"),
      getSheet("A2:Q100", "LIVE_FEED"),
      getSheet("A2:K200", "PARTIDOS")
    ])

    const summary = summaryRowsToObject(summaryRows)
    summary.currentPhase = phaseRows?.[0]?.[0] || summary.currentPhase || "Pendiente"

    const standings = standingsRowsToObjects(standingsRows)
    const upcomingMatches = upcomingRowsToObjects(upcomingRows)
    const liveMatches = liveRowsToObjects(liveRows)
    const teams = teamRowsToObjects(teamsRows)
    const players = playerRowsToObjects(playersRows)
    const liveFeed = liveFeedRowsToObjects(liveFeedRows)
    const allTournamentMatches = tournamentMatchRowsToObjects(partidosRows)
    const tournamentStandings = buildTournamentStandings(teams, allTournamentMatches)

    dashboardState = {
      summary,
      standings,
      upcomingMatches,
      liveMatches,
      teams,
      players,
      liveFeed,
      tournamentStandings,
      allTournamentMatches
    }

    updateDashboardCards(summary)
    renderStandings(tournamentStandings.slice(0, 8))
    renderUpcomingMatches(upcomingMatches)
    renderLiveMatches(liveMatches)
    renderLiveFeed(liveFeed)
    renderTeamsPage(teams, players)
    renderTournamentStandings(tournamentStandings)
    renderPreviousMatches(allTournamentMatches)

    console.log("Datos cargados:", dashboardState)
  } catch (error) {
    console.error("Error cargando datos del torneo:", error)
    showTeamsError(error)
  }
}

function liveFeedRowsToObjects(rows) {
  return rows
    .filter(row => row[0] && row[14])
    .map(row => ({
      eventId: row[0] || "",
      createdAt: row[1] || "",
      saleTimestamp: row[2] || "",
      matchId: row[3] || "",
      playerName: row[4] || "",
      playerShortName: row[5] || "",
      teamId: row[6] || "",
      teamName: row[7] || "",
      opponentId: row[8] || "",
      opponentName: row[9] || "",
      pointsAdded: parseNumber(row[10]),
      teamScoreAtEvent: parseNumber(row[11]),
      opponentScoreAtEvent: parseNumber(row[12]),
      emoji: row[13] || "⚽",
      title: row[14] || "",
      commentary: row[15] || "",
      scoreText: row[16] || ""
    }))
    .sort((a, b) => {
      const dateA = parseFeedDateValue(a.createdAt || a.saleTimestamp)
      const dateB = parseFeedDateValue(b.createdAt || b.saleTimestamp)
      return dateB - dateA
    })
}

function parseFeedDateValue(value) {
  if (!value) return 0

  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.getTime()
  }

  const raw = String(value).trim()

  const gvizDateTime = raw.match(/^Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)$/)

  if (gvizDateTime) {
    const year = Number(gvizDateTime[1])
    const month = Number(gvizDateTime[2])
    const day = Number(gvizDateTime[3])
    const hour = Number(gvizDateTime[4] || 0)
    const minute = Number(gvizDateTime[5] || 0)
    const second = Number(gvizDateTime[6] || 0)

    return new Date(year, month, day, hour, minute, second).getTime()
  }

  const parsed = new Date(raw)

  if (!isNaN(parsed.getTime())) {
    return parsed.getTime()
  }

  return 0
}

let lastLiveFeedNewestEventId = null
let liveFeedFirstRender = true

function getStableIndex(key, length) {
  if (!length) return 0

  const raw = String(key || "feed-event")
  let hash = 0

  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i)
    hash |= 0
  }

  return Math.abs(hash) % length
}

function pickStable(list, key) {
  return list[getStableIndex(key, list.length)]
}

function feedEventIsCaptain(item) {
  const playerName = normalizeHeader(item.playerName || item.playerShortName)
  const teamId = normalizeId(item.teamId)

  if (!playerName || !teamId) return false

  return (dashboardState.players || []).some(player => {
    const sameTeam = normalizeId(player.teamId) === teamId
    const sameName =
      normalizeHeader(player.displayName) === playerName ||
      normalizeHeader(player.fullName) === playerName

    return sameTeam && sameName && player.isCaptain
  })
}

function getFeedEventType(item) {
  const teamScore = parseNumber(item.teamScoreAtEvent)
  const opponentScore = parseNumber(item.opponentScoreAtEvent)
  const pointsAdded = parseNumber(item.pointsAdded)
  const isCaptain = feedEventIsCaptain(item)

  if (teamScore === opponentScore) return "feed-tie"
  if (teamScore === 1 && opponentScore === 0) return "feed-first-goal"
  if (pointsAdded >= 2) return "feed-big-play"
  if (teamScore > opponentScore && teamScore - opponentScore >= 2) return "feed-pulling-away"
  if (isCaptain) return "feed-captain"
  if (teamScore > opponentScore) return "feed-takes-lead"

  return "feed-default"
}

function buildFeedScoreText(item) {
  if (item.scoreText) return item.scoreText

  const team = item.teamName || getTeamInfo(item.teamId).name || "Equipo"
  const opponent = item.opponentName || getTeamInfo(item.opponentId).name || "Rival"

  return `${team} ${formatNumber(item.teamScoreAtEvent)} - ${formatNumber(item.opponentScoreAtEvent)} ${opponent}`
}

function buildFeedCommentary(item) {
  const player = item.playerShortName || item.playerName || "Un jugador"
  const team = item.teamName || getTeamInfo(item.teamId).name || "El equipo"
  const opponent = item.opponentName || getTeamInfo(item.opponentId).name || "el rival"
  const eventType = getFeedEventType(item)
  const key = `${item.eventId || ""}-${item.matchId || ""}-${item.playerName || ""}`

  const templates = {
    "feed-first-goal": [
      {
        title: "¡SE ABRE EL MARCADOR!",
        body: `${player} pone a ${team} arriba. El partido ya tiene dueño momentáneo.`
      },
      {
        title: "¡PRIMER GOL DEL PARTIDO!",
        body: `${team} pega primero con punto de ${player}. Ahora ${opponent} tiene que responder.`
      },
      {
        title: "¡ARRANCA LA ACCIÓN!",
        body: `${player} inaugura el marcador para ${team}. Esto apenas empieza.`
      }
    ],

    "feed-tie": [
      {
        title: "¡SE EMPATA EL PARTIDO!",
        body: `${team} no se queda atrás. ${player} mete a su selección de lleno en la pelea.`
      },
      {
        title: "¡TODO IGUALADO!",
        body: `${player} aparece en el momento justo y deja el partido empatado.`
      },
      {
        title: "¡TENEMOS PARTIDO!",
        body: `${team} responde y empareja las cosas. Nadie se quiere quedar atrás.`
      }
    ],

    "feed-takes-lead": [
      {
        title: "¡SE VAN ARRIBA!",
        body: `${player} pone a ${team} al frente. ${opponent} empieza a sentir presión.`
      },
      {
        title: "¡CAMBIA EL LÍDER!",
        body: `${team} toma ventaja con aportación de ${player}. El partido se mueve.`
      },
      {
        title: "¡GOLPE EN LA MESA!",
        body: `${player} suma y ${team} toma control parcial del marcador.`
      }
    ],

    "feed-pulling-away": [
      {
        title: "¡SE EMPIEZAN A ESCAPAR!",
        body: `${team} abre distancia. ${opponent} necesita reaccionar pronto.`
      },
      {
        title: "¡VENTAJA PELIGROSA!",
        body: `${player} ayuda a que ${team} tome más aire en el marcador.`
      },
      {
        title: "¡EL PARTIDO SE INCLINA!",
        body: `${team} empieza a marcar diferencia. El reloj ya juega en contra de ${opponent}.`
      }
    ],

    "feed-big-play": [
      {
        title: "¡GOL DE AUTORIDAD!",
        body: `${player} suma fuerte para ${team}. Este punto pesa en el partido.`
      },
      {
        title: "¡JUGADA GRANDE!",
        body: `${player} aparece con una venta importante y mueve el marcador.`
      },
      {
        title: "¡PUNTO DE IMPACTO!",
        body: `${team} recibe un impulso fuerte gracias a ${player}.`
      }
    ],

    "feed-captain": [
      {
        title: "¡EL CAPITÁN APARECE!",
        body: `${player} responde como líder y suma para ${team}.`
      },
      {
        title: "¡LIDERAZGO EN CANCHA!",
        body: `${player} toma responsabilidad y mete a ${team} en la conversación.`
      },
      {
        title: "¡CAPITÁN AL RESCATE!",
        body: `${team} recibe puntos de su capitán cuando más lo necesitaba.`
      }
    ],

    "feed-default": [
      {
        title: "¡SUMAN PUNTOS!",
        body: `${player} aporta para ${team}. Cada punto cuenta en esta ronda.`
      },
      {
        title: "¡SE MUEVE EL MARCADOR!",
        body: `${team} suma gracias a ${player}. El partido sigue vivo.`
      },
      {
        title: "¡PUNTO IMPORTANTE!",
        body: `${player} mantiene a ${team} compitiendo en el marcador.`
      },
      {
        title: "¡APARECE EN EL MOMENTO JUSTO!",
        body: `${player} suma y mantiene la presión sobre ${opponent}.`
      }
    ]
  }

  const selected = pickStable(templates[eventType] || templates["feed-default"], key)

  return {
    type: eventType,
    title: selected.title,
    body: selected.body,
    score: buildFeedScoreText(item)
  }
}

function renderLiveFeed(feedItems = []) {
  const container = document.getElementById("liveFeedTicker")
  if (!container) return

  const itemsNewestFirst = [...feedItems]
    .filter(item => item.eventId)
    .sort((a, b) => {
      const dateA = parseFeedDateValue(a.createdAt || a.saleTimestamp)
      const dateB = parseFeedDateValue(b.createdAt || b.saleTimestamp)

      if (dateB !== dateA) return dateB - dateA

      return String(b.eventId).localeCompare(String(a.eventId))
    })
    .slice(0, 18)

  const itemsOldestFirst = [...itemsNewestFirst].reverse()
  const newestEventId = itemsNewestFirst[0]?.eventId || null

  const distanceFromBottom =
    container.scrollHeight - container.scrollTop - container.clientHeight

  const userWasNearBottom = distanceFromBottom < 80
  const hasNewEvent = newestEventId && newestEventId !== lastLiveFeedNewestEventId

  if (!itemsOldestFirst.length) {
    container.innerHTML = `
      <div class="feed-empty">
        <strong>Esperando goles</strong>
        <p>El narrador aparecerá cuando caigan puntos nuevos.</p>
      </div>
    `
    return
  }

  container.innerHTML = `
    <div class="live-chat-feed">
      ${itemsOldestFirst.map(item => {
        const commentary = buildFeedCommentary(item)

        return `
          <article class="feed-message ${commentary.type}">
            <div class="feed-avatar">${item.emoji || "⚽"}</div>

            <div class="feed-bubble">
              <div class="feed-message-top">
                <strong class="feed-author">${commentary.title}</strong>
                <span class="feed-time">${formatFeedTime(item.saleTimestamp)}</span>
              </div>

              <p class="feed-commentary">${commentary.body}</p>

              <div class="feed-score-pill">
                ${commentary.score}
              </div>
            </div>
          </article>
        `
      }).join("")}
    </div>
  `

  if (liveFeedFirstRender || (hasNewEvent && userWasNearBottom)) {
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight
    })
  }

  lastLiveFeedNewestEventId = newestEventId
  liveFeedFirstRender = false
}

function formatFeedTime(value) {
  if (!value) return ""

  let date = null

  if (value instanceof Date && !isNaN(value.getTime())) {
    date = value
  } else {
    const raw = String(value).trim()

    const gvizDate = raw.match(/^Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)$/)

    if (gvizDate) {
      date = new Date(
        Number(gvizDate[1]),
        Number(gvizDate[2]),
        Number(gvizDate[3]),
        Number(gvizDate[4] || 0),
        Number(gvizDate[5] || 0),
        Number(gvizDate[6] || 0)
      )
    } else {
      const parsed = new Date(raw)

      if (!isNaN(parsed.getTime())) {
        date = parsed
      }
    }
  }

  if (!date || isNaN(date.getTime())) return String(value)

  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  })
}

function summaryRowsToObject(rows) {
  const map = {}

  rows.forEach(row => {
    const key = String(row[0] || "").trim()
    const value = row[1] || ""

    if (key) {
      map[key] = value
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
    currentLeader: map["Líder actual"] || "",

    "Fase actual": map["Fase actual"] || "",
    "Estado del torneo": map["Estado del torneo"] || "",
    "Última actualización": map["Última actualización"] || ""
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
      playerId: row[0] || "",
      fullName: row[1] || "",
      displayName: row[2] || row[1] || "Jugador",
      unit: normalizeId(row[3]),
      teamId: normalizeId(row[4]),
      isCaptain: String(row[5] || "").trim().toUpperCase() === "SI",

      fullBodyUrl: row[6] || "",
      photoUrl: row[6] || "",
      flagUrl: row[7] || "",

      // Tournament totals
      points: parseNumber(row[8]),
      sales: parseNumber(row[9]),
      volume: parseNumber(row[10]),
      average: parseNumber(row[11]),
      teamPointShare: parsePercent(row[12]),

      // Extra image / match / rank fields
      headshotUrl: row[13] || "",
      matchPoints: parseNumber(row[14]),
      tournamentRank: String(row[15] ?? "").trim()
    }))
}

const TOURNAMENT_LOGO_URL =
  "https://drive.google.com/thumbnail?id=1IOKVX9rR2b_KZA_Gpk1CD0P_EeV71w2p&sz=w700"

function splitPlayerName(displayName = "") {
  const parts = String(displayName).trim().split(/\s+/).filter(Boolean)

  if (parts.length <= 1) {
    return {
      firstName: parts[0] || "Jugador",
      lastName: ""
    }
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ")
  }
}

const CAPTAIN_BADGE_URL =
  "https://drive.google.com/thumbnail?id=1LVY4kH2lrDqhK32UOhzcYyaHNR7fFVaK&sz=w600"

function buildPlayerSerial(player) {
  const team = normalizeId(player.teamId) || "TEAM"
  const rank = parseNumber(player.tournamentRank) || 0

  return `NC-2026-${team}-${String(rank || 1).padStart(2, "0")}`
}

function getOfficialCardTheme(teamId) {
  const id = normalizeId(teamId)

  const themes = {
    COL: {
      primary: "#F5C542",
      secondary: "#123A8C",
      accent: "#D4212C",
      glow: "rgba(245, 197, 66, 0.44)",
      nameTop: "#f8f8f8",
      nameBottom: "#f5c542"
    },
    MEX: {
      primary: "#006847",
      secondary: "#f7f7f7",
      accent: "#ce1126",
      glow: "rgba(0, 104, 71, 0.44)",
      nameTop: "#f8f8f8",
      nameBottom: "#18c27b"
    },
    BRA: {
      primary: "#ffdf00",
      secondary: "#009c3b",
      accent: "#002776",
      glow: "rgba(255, 223, 0, 0.42)",
      nameTop: "#f8f8f8",
      nameBottom: "#ffdf00"
    },
    ARG: {
      primary: "#75aadb",
      secondary: "#ffffff",
      accent: "#f6b40e",
      glow: "rgba(117, 170, 219, 0.42)",
      nameTop: "#f8f8f8",
      nameBottom: "#75aadb"
    },
    USA: {
      primary: "#e63946",
      secondary: "#1d3557",
      accent: "#f1faee",
      glow: "rgba(230, 57, 70, 0.42)",
      nameTop: "#f8f8f8",
      nameBottom: "#e63946"
    },
    ENG: {
      primary: "#ffffff",
      secondary: "#c8102e",
      accent: "#012169",
      glow: "rgba(255, 255, 255, 0.32)",
      nameTop: "#f8f8f8",
      nameBottom: "#dce8ff"
    },
    FRA: {
      primary: "#0055a4",
      secondary: "#ffffff",
      accent: "#ef4135",
      glow: "rgba(0, 85, 164, 0.44)",
      nameTop: "#f8f8f8",
      nameBottom: "#6daeff"
    },
    ESP: {
      primary: "#f1bf00",
      secondary: "#aa151b",
      accent: "#ffd700",
      glow: "rgba(241, 191, 0, 0.42)",
      nameTop: "#f8f8f8",
      nameBottom: "#f1bf00"
    },
    NED: {
      primary: "#ff7a00",
      secondary: "#1b365d",
      accent: "#ffffff",
      glow: "rgba(255, 122, 0, 0.44)",
      nameTop: "#f8f8f8",
      nameBottom: "#ff7a00"
    },
    MAR: {
      primary: "#c1272d",
      secondary: "#006233",
      accent: "#d4af37",
      glow: "rgba(193, 39, 45, 0.44)",
      nameTop: "#f8f8f8",
      nameBottom: "#d4af37"
    },
    POR: {
      primary: "#c8102e",
      secondary: "#006a4e",
      accent: "#ffd700",
      glow: "rgba(200, 16, 46, 0.44)",
      nameTop: "#f8f8f8",
      nameBottom: "#ffd700"
    },
    GER: {
      primary: "#ffce00",
      secondary: "#dd0000",
      accent: "#ffffff",
      glow: "rgba(255, 206, 0, 0.38)",
      nameTop: "#f8f8f8",
      nameBottom: "#ffce00"
    }
  }

  return themes[id] || {
    primary: "#d9a441",
    secondary: "#123a8c",
    accent: "#ffffff",
    glow: "rgba(217, 164, 65, 0.38)",
    nameTop: "#f8f8f8",
    nameBottom: "#d9a441"
  }
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
  const body = document.getElementById("standingsBody")
  if (!body) return

  if (!standings || !standings.length) {
    body.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <strong>Sin tabla disponible</strong>
            <p>La tabla aparecerá cuando haya equipos cargados.</p>
          </div>
        </td>
      </tr>
    `
    return
  }

  body.innerHTML = standings.map((row, index) => {
    const team = getTeamInfo(row.teamId)
    const flag = driveImage(team.flagUrl)

    return `
      <tr class="standing-click-row" data-standing-team="${row.teamId}">
        <td>${index + 1}</td>
        <td>
          <button class="standing-team-button" type="button" data-standing-team="${row.teamId}">
            ${flag ? `<img class="team-flag" src="${flag}" alt="${team.name}">` : ""}
            <span>${team.name}</span>
          </button>
        </td>
        <td>${row.unit || "—"}</td>
        <td><strong>${formatNumber(row.tournamentPoints)}</strong></td>
        <td>
          <span class="status ${getStatusClass(row.status)}">
            ${formatTeamStatus(row.status)}
          </span>
        </td>
      </tr>
    `
  }).join("")

  setupDashboardTeamLinks()
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
          <button class="match-card live dashboard-live-match" type="button" data-dashboard-match="${match.matchId}">
            <span>${match.phase || "Partido en vivo"}</span>

            <div class="match-teams">
              ${renderMatchTeam(teamA, match.pointsA)}
              <div class="match-vs">VS</div>
              ${renderMatchTeam(teamB, match.pointsB)}
            </div>

            <p>En vivo · finaliza ${match.endDate || "pendiente"}</p>
          </button>
        `
      }).join("")}
    </div>

    <button class="match-more-banner dashboard-match-center-link" type="button">
      Ver todos los partidos en Match Center
    </button>
  `

  setupDashboardMatchLinks()
}

function tournamentMatchRowsToObjects(rows) {
  return rows
    .filter(row => row[0] && row[3] && row[4])
    .map(row => ({
      matchId: String(row[0] || "").trim(),
      phase: row[1] || "",
      matchday: row[2] || "",
      teamA: normalizeId(row[3] || ""),
      teamB: normalizeId(row[4] || ""),
      startDate: row[5] || "",
      endDate: row[6] || "",
      status: row[7] || "",
      pointsA: parseNumber(row[8]),
      pointsB: parseNumber(row[9]),
      winner: normalizeId(row[10] || "")
    }))
}

function isFinishedMatch(match) {
  const status = normalizeHeader(match.status)

  return (
    status === "TERMINADO" ||
    status === "FINALIZADO" ||
    status === "COMPLETE" ||
    status === "FINAL"
  )
}

function isLiveMatch(match) {
  const status = normalizeHeader(match.status)

  return (
    status === "EN VIVO" ||
    status === "LIVE" ||
    status === "ACTIVO"
  )
}

function buildTournamentStandings(teams, matches) {
  const table = new Map()

  teams.forEach(team => {
    const teamId = normalizeId(team.teamId)

    if (!teamId) return

    table.set(teamId, {
      teamId,
      unit: team.unit || "",
      status: team.status || "Pendiente",
      played: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      pointsFor: 0,
      tournamentPoints: 0
    })
  })

  matches
    .filter(isFinishedMatch)
    .forEach(match => {
      const teamA = normalizeId(match.teamA)
      const teamB = normalizeId(match.teamB)

      if (!table.has(teamA)) {
        table.set(teamA, createEmptyStanding(teamA))
      }

      if (!table.has(teamB)) {
        table.set(teamB, createEmptyStanding(teamB))
      }

      const rowA = table.get(teamA)
      const rowB = table.get(teamB)

      const pointsA = parseNumber(match.pointsA)
      const pointsB = parseNumber(match.pointsB)

      rowA.played += 1
      rowB.played += 1

      rowA.pointsFor += pointsA
      rowB.pointsFor += pointsB

      if (pointsA > pointsB) {
        rowA.wins += 1
        rowA.tournamentPoints += 3
        rowB.losses += 1
      } else if (pointsB > pointsA) {
        rowB.wins += 1
        rowB.tournamentPoints += 3
        rowA.losses += 1
      } else {
        rowA.ties += 1
        rowB.ties += 1
        rowA.tournamentPoints += 1
        rowB.tournamentPoints += 1
      }
    })

  return [...table.values()]
    .sort((a, b) => {
      if (b.tournamentPoints !== a.tournamentPoints) return b.tournamentPoints - a.tournamentPoints
      if (b.wins !== a.wins) return b.wins - a.wins
      if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor

      const nameA = getTeamInfo(a.teamId).name
      const nameB = getTeamInfo(b.teamId).name

      return nameA.localeCompare(nameB)
    })
}

function getStatusClass(status) {
  const clean = normalizeHeader(status)

  if (clean === "ACTIVO") return "active"

  if (
    clean === "ELIMINADO" ||
    clean === "ELIMINADA" ||
    clean === "INACTIVO" ||
    clean === "FUERA"
  ) {
    return "eliminated"
  }

  return "pending"
}

function formatTeamStatus(status) {
  const clean = String(status || "").trim()
  return clean || "Pendiente"
}

function createEmptyStanding(teamId) {
  return {
    teamId,
    unit: "",
    status: "Pendiente",
    played: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    pointsFor: 0,
    tournamentPoints: 0
  }
}

function renderTournamentStandings(standings) {
  const body = document.getElementById("tournamentStandingsBody")
  if (!body) return

  if (!standings || !standings.length) {
    body.innerHTML = `
      <tr>
        <td colspan="9">
          <div class="empty-state">
            <strong>Sin standings</strong>
            <p>Todavía no hay equipos disponibles para calcular la tabla.</p>
          </div>
        </td>
      </tr>
    `
    return
  }

  body.innerHTML = standings.map((row, index) => {
    const team = getTeamInfo(row.teamId)
    const flag = driveImage(team.flagUrl)

    return `
      <tr class="standing-click-row" data-standing-team="${row.teamId}">
        <td>${index + 1}</td>
        <td>
          <button class="standing-team-button" type="button" data-standing-team="${row.teamId}">
            ${flag ? `<img class="team-flag" src="${flag}" alt="${team.name}">` : ""}
            <span>${team.name}</span>
          </button>
        </td>
        <td>${row.unit || "—"}</td>
        <td>${formatNumber(row.played)}</td>
        <td>${formatNumber(row.wins)}</td>
        <td>${formatNumber(row.losses)}</td>
        <td>${formatNumber(row.ties)}</td>
        <td>${formatNumber(row.pointsFor)}</td>
        <td><strong>${formatNumber(row.tournamentPoints)}</strong></td>
      </tr>
    `
  }).join("")

  setupDashboardTeamLinks()
}

function renderPreviousMatches(matches) {
  const container = document.getElementById("previousMatchesList")
  if (!container) return

  const previousMatches = (matches || [])
    .filter(isFinishedMatch)
    .sort((a, b) => {
      const dateA = parseMatchSortDate(a.endDate || a.startDate)
      const dateB = parseMatchSortDate(b.endDate || b.startDate)

      if (dateB !== dateA) return dateB - dateA

      return String(b.matchId || "").localeCompare(String(a.matchId || ""))
    })

  if (!previousMatches.length) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>Sin partidos terminados</strong>
        <p>Los resultados aparecerán aquí cuando se cierre el primer partido.</p>
      </div>
    `
    return
  }

  container.innerHTML = previousMatches
    .map(match => renderPreviousMatchCard(match))
    .join("")
}

function renderPreviousMatchCard(match) {
  const teamA = getTeamInfo(match.teamA)
  const teamB = getTeamInfo(match.teamB)

  const flagA = driveImage(teamA.flagUrl)
  const flagB = driveImage(teamB.flagUrl)

  const pointsA = parseNumber(match.pointsA)
  const pointsB = parseNumber(match.pointsB)

  const isTie = pointsA === pointsB
  const winner = isTie
    ? ""
    : pointsA > pointsB
      ? normalizeId(match.teamA)
      : normalizeId(match.teamB)

  return `
    <article class="previous-match-card">
      <div class="previous-match-meta">
        <span>${match.phase || "Partido"}</span>
        <strong>${getFriendlyMatchLabel(match)}</strong>
        <small>${formatMatchDate(match.endDate || match.startDate)}</small>
      </div>

      <div class="previous-match-teams">
        <div class="previous-match-team ${winner === normalizeId(match.teamA) ? "winner" : ""}">
          ${flagA ? `<img src="${flagA}" alt="${teamA.name}">` : ""}
          <div>
            <strong>${teamA.name}</strong>
            ${winner === normalizeId(match.teamA) ? `<span class="winner-badge">Ganador</span>` : ""}
          </div>
          <em>${formatNumber(pointsA)}</em>
        </div>

        <div class="previous-match-vs">
          ${isTie ? `<span class="tie-badge">Empate</span>` : `<span>VS</span>`}
        </div>

        <div class="previous-match-team right ${winner === normalizeId(match.teamB) ? "winner" : ""}">
          <em>${formatNumber(pointsB)}</em>
          <div>
            <strong>${teamB.name}</strong>
            ${winner === normalizeId(match.teamB) ? `<span class="winner-badge">Ganador</span>` : ""}
          </div>
          ${flagB ? `<img src="${flagB}" alt="${teamB.name}">` : ""}
        </div>
      </div>
    </article>
  `
}

function parseMatchSortDate(value) {
  if (!value) return 0

  const raw = String(value || "").trim()
  const gvizMatch = raw.match(/^Date\((\d+),(\d+),(\d+)\)$/)

  if (gvizMatch) {
    return new Date(
      Number(gvizMatch[1]),
      Number(gvizMatch[2]),
      Number(gvizMatch[3])
    ).getTime()
  }

  const date = new Date(raw)

  return isNaN(date.getTime()) ? 0 : date.getTime()
}

function setupDashboardMatchLinks() {
  document.querySelectorAll("[data-dashboard-match]").forEach(button => {
    button.addEventListener("click", () => {
      const matchId = String(button.dataset.dashboardMatch || "").trim()
      openMatchCenterFromDashboard(matchId)
    })
  })

  document.querySelectorAll(".dashboard-match-center-link").forEach(button => {
    button.addEventListener("click", () => {
      activateView("matchCenterView")
      loadMatchCenterData()
    })
  })
}

function openMatchCenterFromDashboard(matchId) {
  if (!matchId) return

  matchCenterState.selectedMatchId = matchId

  activateView("matchCenterView")

  loadMatchCenterData().then(() => {
    requestAnimationFrame(() => {
      const selectedCard = document.querySelector(`[data-match-id="${matchId}"]`)
      const stage = document.getElementById("matchCenterStage")

      if (selectedCard) {
        selectedCard.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest"
        })
      }

      if (stage) {
        stage.scrollIntoView({
          behavior: "smooth",
          block: "start"
        })
      }
    })
  })
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

function setupDashboardTeamLinks() {
  document.querySelectorAll("[data-standing-team]").forEach(element => {
    element.addEventListener("click", event => {
      event.preventDefault()
      event.stopPropagation()

      const teamId = normalizeId(element.dataset.standingTeam)
      openTeamAccordionFromDashboard(teamId)
    })
  })
}

function openTeamAccordionFromDashboard(teamId) {
  const cleanTeamId = normalizeId(teamId)
  if (!cleanTeamId) return

  currentTeamFilter = "ALL"

  document.querySelectorAll("[data-unit-filter]").forEach(button => {
    button.classList.toggle("active", normalizeId(button.dataset.unitFilter) === "ALL")
  })

  openTeamIds.add(cleanTeamId)

  renderTeamsPage(dashboardState.teams, dashboardState.players)
  activateView("teamsView")

  requestAnimationFrame(() => {
    const card = document.querySelector(`[data-team-card="${cleanTeamId}"]`)

    if (card) {
      card.classList.add("open")
      card.scrollIntoView({
        behavior: "smooth",
        block: "start"
      })
    }
  })
}

function renderPlayerCard(player, rank) {
  const teamInfo = getTeamInfo(player.teamId)
  const theme = getOfficialCardTheme(player.teamId)
  const unitColors = getUnitColors(player.unit)

  const photo = driveImage(player.fullBodyUrl || player.photoUrl)
  const flag = driveImage(player.flagUrl || teamInfo.flagUrl)

  const { firstName, lastName } = splitPlayerName(player.displayName)
  const share = clamp(parseNumber(player.teamPointShare), 0, 100)
  const tournamentRankRaw = String(player.tournamentRank ?? "").trim()
  const tournamentRank =
    tournamentRankRaw === "-"
      ? "-"
      : formatNumber(tournamentRankRaw || rank)

  const serial = buildPlayerSerial({
    ...player,
    tournamentRank: tournamentRankRaw === "-" ? rank : tournamentRankRaw || rank
  })

  return `
    <article
      class="official-player-card ${player.isCaptain ? "is-captain" : ""}"
      data-player-id="${player.playerId}"
      style="
        --opc-primary: ${theme.primary};
        --opc-secondary: ${theme.secondary};
        --opc-accent: ${theme.accent};
        --opc-glow: ${theme.glow};
        --opc-name-top: ${theme.nameTop};
        --opc-name-bottom: ${theme.nameBottom};
        --unit-primary: ${unitColors.primary};
      "
    >
      <div class="opc-frame">
        <div class="opc-bg"></div>
        <div class="opc-energy opc-energy-one"></div>
        <div class="opc-energy opc-energy-two"></div>

        <div class="opc-top">
          <div class="opc-logo-block">
            <img src="${TOURNAMENT_LOGO_URL}" alt="Netcenter Americas FIFA Cup 2026">
          </div>

          ${
            player.isCaptain
              ? `
                <div class="opc-captain-badge">
                  <img src="${CAPTAIN_BADGE_URL}" alt="Capitán de Equipo">
                </div>
              `
              : ``
          }
        </div>

        <div class="opc-main">
          <div class="opc-name-block">
            <div class="opc-first-name">${firstName}</div>
            <div class="opc-last-name">${lastName}</div>

            <div class="opc-identity-row">
              <div class="opc-country-pill">
                ${flag ? `<img src="${flag}" alt="Bandera de ${teamInfo.name}">` : ""}
                <span>${teamInfo.name}</span>
              </div>

              <div class="opc-unit-pill">${player.unit}</div>
            </div>
          </div>

          <div class="opc-photo-block">
            ${
              photo
                ? `
                  <img
                    class="opc-player-photo"
                    src="${photo}"
                    alt="${player.displayName}"
                    onerror="this.remove();"
                  />
                `
                : ``
            }
          </div>
        </div>

        <div class="opc-stats-panel">
          <div class="opc-stat">
            <div class="opc-stat-icon">★</div>
            <span>Puntos</span>
            <strong>${formatNumber(player.points)}</strong>
          </div>

          <div class="opc-stat">
            <div class="opc-stat-icon">▰</div>
            <span>Volumen</span>
            <strong>${formatMoney(player.volume)}</strong>
          </div>

          <div class="opc-stat">
            <div class="opc-stat-icon">🏆</div>
            <span>Rank de torneo</span>
            <strong>${tournamentRank === "-" ? "-" : `#${tournamentRank}`}</strong>
          </div>
        </div>

        <div class="opc-team-share">
          <div class="opc-team-share-head">
            <span>% del equipo</span>
            <strong>${share}%</strong>
          </div>

          <div class="opc-share-bar">
            <div class="opc-share-fill" style="width: ${share}%"></div>
          </div>
        </div>

        <div class="opc-footer">
          <span>Netcenter Americas</span>
          <span class="opc-footer-emblem">⚽</span>
          <span>FIFA Cup 2026</span>
        </div>

        <div class="opc-serial">${serial}</div>

        <button class="opc-download-button" type="button" data-download-card="${player.playerId}">
          Descargar carta
        </button>
      </div>
    </article>
  `
}

const MATCH_ROUND_LABELS = {
  PR: "Jornada 1",
  SR: "Jornada 2",
  TR: "Jornada 3",
  CR: "Jornada 4",
  OF: "Octavos de final",
  CF: "Cuartos de final",
  SF: "Semifinal",
  GF: "Gran final"
}

function getFriendlyMatchLabel(match) {
  const rawId = String(match.matchId || "").trim().toUpperCase()
  const codeMatch = rawId.match(/^[A-Z]+/)
  const numberMatch = rawId.match(/\d+/)

  const code = codeMatch ? codeMatch[0] : ""
  const roundLabel = MATCH_ROUND_LABELS[code] || match.phase || "Partido"

  const friendlyNumber = numberMatch
    ? `Partido ${Number(numberMatch[0])}`
    : "Partido"

  return `${roundLabel} · ${friendlyNumber}`
}

function setupViewNavigation() {
  const menuButtons = document.querySelectorAll(".menu-item[data-view]")

  menuButtons.forEach(button => {
    button.addEventListener("click", () => {
      const viewId = button.dataset.view
      activateView(viewId)

      if (viewId === "matchCenterView") {
        loadMatchCenterData()
      }

      if (viewId === "placingsView") {
        renderTournamentStandings(dashboardState.tournamentStandings)
        renderPreviousMatches(dashboardState.allTournamentMatches)
      }
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

  if (
    !raw ||
    raw === "#N/A" ||
    raw === "N/A" ||
    raw === "MISSING_IMG" ||
    raw === "MISSING_HS"
  ) {
    return ""
  }

  const driveIdMatch = raw.match(/[-\w]{25,}/)

  if (driveIdMatch) {
    return `https://drive.google.com/thumbnail?id=${driveIdMatch[0]}&sz=w1000`
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

document.addEventListener("DOMContentLoaded", () => {
  setupViewNavigation()
  setupMobileMenu()
  setupMatchCenterStripArrows()

  loadDashboardData()
  loadMatchCenterData()
  updateMatchCenterClock()

  setInterval(loadDashboardData, REFRESH_MS)
  setInterval(loadMatchCenterData, REFRESH_MS)
  setInterval(updateMatchCenterClock, 30000)
})