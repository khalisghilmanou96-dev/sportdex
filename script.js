const API_BASE = "https://www.thesportsdb.com/api/v1/json/123";
const PAGE_SIZE = 8;

// Cette sélection sert uniquement à construire la page d'accueil.
// Les données affichées viennent ensuite de TheSportsDB.
const POPULAR_PLAYERS = [
  "Lionel Messi", "Cristiano Ronaldo", "Kylian Mbappe", "Neymar",
  "LeBron James", "Stephen Curry", "Kevin Durant", "Giannis Antetokounmpo",
  "Novak Djokovic", "Rafael Nadal", "Carlos Alcaraz", "Jannik Sinner",
  "Lewis Hamilton", "Max Verstappen", "Lando Norris", "Charles Leclerc",
  "Patrick Mahomes", "Lamar Jackson", "Shohei Ohtani", "Aaron Judge",
  "Erling Haaland", "Mohamed Salah", "Jude Bellingham", "Vinicius Junior"
];

const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
  <rect width="500" height="500" rx="50" fill="#eef1f6"/>
  <circle cx="250" cy="190" r="85" fill="#cbd5e1"/>
  <path d="M95 445c18-105 78-160 155-160s137 55 155 160" fill="#cbd5e1"/>
  <text x="250" y="475" text-anchor="middle" font-family="Arial" font-size="24" fill="#64748b">SPORTDEX</text>
</svg>`);

const grid = document.querySelector("#sportGrid");
const statusEl = document.querySelector("#status");
const searchInput = document.querySelector("#searchInput");
const searchType = document.querySelector("#searchType");
const searchButton = document.querySelector("#searchButton");
const randomButton = document.querySelector("#randomButton");
const loadMoreButton = document.querySelector("#loadMoreButton");
const cardTemplate = document.querySelector("#sportCardTemplate");
const dialog = document.querySelector("#sportDialog");
const details = document.querySelector("#sportDetails");
const closeDialogButton = document.querySelector("#closeDialogButton");

let loadedCount = 0;

function setStatus(message = "") {
  statusEl.textContent = message;
}

function safe(value, fallback = "—") {
  return value && value !== "null" ? value : fallback;
}

function shortId(id) {
  if (!id) return "SPORT";
  return `#${String(id).slice(-6)}`;
}

function playerImage(player) {
  return player.strCutout || player.strThumb || player.strRender || player.strFanart1 || FALLBACK_IMAGE;
}

function teamImage(team) {
  return team.strBadge || team.strLogo || team.strEquipment || team.strFanart1 || FALLBACK_IMAGE;
}

async function apiGet(endpoint, params) {
  const url = new URL(`${API_BASE}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erreur API (${response.status})`);
  return response.json();
}

async function fetchPlayer(name) {
  const data = await apiGet("searchplayers.php", { p: name.trim() });
  if (!data.player?.length) throw new Error("Sportif introuvable");
  return { kind: "player", data: data.player[0] };
}

async function fetchTeam(name) {
  const data = await apiGet("searchteams.php", { t: name.trim() });
  if (!data.teams?.length) throw new Error("Équipe introuvable");
  return { kind: "team", data: data.teams[0] };
}

function createPill(text) {
  const pill = document.createElement("span");
  pill.className = "type-pill";
  pill.textContent = safe(text, "Sport");
  return pill;
}

function createCard(entity) {
  const node = cardTemplate.content.cloneNode(true);
  const card = node.querySelector(".pokemon-card");
  const image = node.querySelector(".pokemon-image");
  const pills = node.querySelector(".pokemon-types");
  const item = entity.data;

  if (entity.kind === "player") {
    node.querySelector(".sport-id").textContent = shortId(item.idPlayer);
    node.querySelector(".pokemon-name").textContent = safe(item.strPlayer, "Sportif");
    image.src = playerImage(item);
    image.alt = `Photo de ${safe(item.strPlayer, "ce sportif")}`;
    pills.appendChild(createPill(item.strSport));
    if (item.strTeam) pills.appendChild(createPill(item.strTeam));
  } else {
    node.querySelector(".sport-id").textContent = shortId(item.idTeam);
    node.querySelector(".pokemon-name").textContent = safe(item.strTeam, "Équipe");
    image.src = teamImage(item);
    image.alt = `Logo de ${safe(item.strTeam, "cette équipe")}`;
    pills.appendChild(createPill(item.strSport));
    if (item.strCountry) pills.appendChild(createPill(item.strCountry));
  }

  image.onerror = () => { image.src = FALLBACK_IMAGE; };
  card.addEventListener("click", () => openDetails(entity));
  return node;
}

async function loadPopular(count = PAGE_SIZE) {
  if (loadedCount >= POPULAR_PLAYERS.length) {
    setStatus("Toute la sélection a été chargée.");
    loadMoreButton.disabled = true;
    return;
  }

  setStatus("Chargement des sportifs depuis l’API…");
  loadMoreButton.disabled = true;
  const names = POPULAR_PLAYERS.slice(loadedCount, loadedCount + count);

  try {
    const results = await Promise.allSettled(names.map(fetchPlayer));
    let added = 0;
    results.forEach(result => {
      if (result.status === "fulfilled") {
        grid.appendChild(createCard(result.value));
        added += 1;
      }
    });
    loadedCount += names.length;
    setStatus(`${added} nouvelles fiches chargées depuis TheSportsDB.`);
    if (loadedCount >= POPULAR_PLAYERS.length) loadMoreButton.disabled = true;
  } catch (error) {
    setStatus("Impossible de charger la sélection. Vérifie ta connexion puis réessaie.");
  } finally {
    if (loadedCount < POPULAR_PLAYERS.length) loadMoreButton.disabled = false;
  }
}

function infoRow(label, value) {
  return `<div class="info-row"><span>${label}</span><strong>${safe(value)}</strong></div>`;
}

function renderPlayer(player) {
  const born = [player.dateBorn, player.strBirthLocation].filter(Boolean).join(" • ");
  const description = player.strDescriptionFR || player.strDescriptionEN;

  details.innerHTML = `
    <div class="detail-shell">
      <div class="detail-hero">
        <img src="${playerImage(player)}" alt="Photo de ${safe(player.strPlayer, "sportif")}" onerror="this.src='${FALLBACK_IMAGE}'">
        <div>
          <div class="detail-number">${shortId(player.idPlayer)} · SPORTIF</div>
          <h2 class="detail-name">${safe(player.strPlayer)}</h2>
          <div class="pokemon-types">
            <span class="type-pill">${safe(player.strSport)}</span>
            ${player.strPosition ? `<span class="type-pill">${player.strPosition}</span>` : ""}
          </div>
          <div class="detail-meta">
            <span><strong>${safe(player.strNationality)}</strong><br>Nationalité</span>
            <span><strong>${safe(player.strTeam)}</strong><br>Équipe</span>
            <span><strong>${safe(player.strNumber)}</strong><br>Numéro</span>
          </div>
        </div>
      </div>
      <div class="stats">
        <p class="eyebrow">Informations</p>
        ${infoRow("Naissance", born || null)}
        ${infoRow("Taille", player.strHeight)}
        ${infoRow("Poids", player.strWeight)}
        ${infoRow("Poste", player.strPosition)}
        ${infoRow("Équipe actuelle", player.strTeam)}
        ${description ? `<div class="description"><strong>Biographie</strong><p>${description}</p></div>` : ""}
      </div>
    </div>`;
}

function renderTeam(team) {
  const stadium = [team.strStadium, team.strStadiumLocation].filter(Boolean).join(" • ");
  const description = team.strDescriptionFR || team.strDescriptionEN;

  details.innerHTML = `
    <div class="detail-shell">
      <div class="detail-hero">
        <img src="${teamImage(team)}" alt="Logo de ${safe(team.strTeam, "équipe")}" onerror="this.src='${FALLBACK_IMAGE}'">
        <div>
          <div class="detail-number">${shortId(team.idTeam)} · ÉQUIPE</div>
          <h2 class="detail-name">${safe(team.strTeam)}</h2>
          <div class="pokemon-types">
            <span class="type-pill">${safe(team.strSport)}</span>
            ${team.strLeague ? `<span class="type-pill">${team.strLeague}</span>` : ""}
          </div>
          <div class="detail-meta">
            <span><strong>${safe(team.strCountry)}</strong><br>Pays</span>
            <span><strong>${safe(team.intFormedYear)}</strong><br>Création</span>
            <span><strong>${safe(team.strLeague)}</strong><br>Championnat</span>
          </div>
        </div>
      </div>
      <div class="stats">
        <p class="eyebrow">Informations</p>
        ${infoRow("Nom complet", team.strTeam)}
        ${infoRow("Sport", team.strSport)}
        ${infoRow("Championnat", team.strLeague)}
        ${infoRow("Stade", stadium || null)}
        ${infoRow("Capacité", team.intStadiumCapacity)}
        ${description ? `<div class="description"><strong>Présentation</strong><p>${description}</p></div>` : ""}
      </div>
    </div>`;
}

function openDetails(entity) {
  if (entity.kind === "player") renderPlayer(entity.data);
  else renderTeam(entity.data);
  if (typeof dialog.showModal === "function") dialog.showModal();
}

async function searchSport() {
  const query = searchInput.value.trim();
  if (!query) {
    searchInput.focus();
    setStatus("Entre le nom d’un sportif ou d’une équipe.");
    return;
  }

  const typeLabel = searchType.value === "player" ? "sportif" : "équipe";
  setStatus(`Recherche de ${typeLabel} : “${query}”…`);

  try {
    const entity = searchType.value === "player"
      ? await fetchPlayer(query)
      : await fetchTeam(query);
    openDetails(entity);
    const name = entity.kind === "player" ? entity.data.strPlayer : entity.data.strTeam;
    setStatus(`${safe(name)} trouvé via TheSportsDB.`);
  } catch {
    setStatus(`Aucun résultat trouvé pour “${query}”. Essaie l’orthographe anglaise ou change le type de recherche.`);
  }
}

async function randomSport() {
  const name = POPULAR_PLAYERS[Math.floor(Math.random() * POPULAR_PLAYERS.length)];
  setStatus("Sélection d’un sportif au hasard…");
  try {
    const entity = await fetchPlayer(name);
    openDetails(entity);
    setStatus(`${safe(entity.data.strPlayer)} a été tiré au sort.`);
  } catch {
    setStatus("Impossible de charger le sportif pour le moment.");
  }
}

searchButton.addEventListener("click", searchSport);
searchInput.addEventListener("keydown", event => {
  if (event.key === "Enter") searchSport();
});
randomButton.addEventListener("click", randomSport);
loadMoreButton.addEventListener("click", () => loadPopular(PAGE_SIZE));
closeDialogButton.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
});

loadPopular(PAGE_SIZE);
