// ============================================
// THE ENGLISH PATH — app.js
// Carga content/index.json y renderiza mapa de niveles,
// listas de temas por nivel, y lecciones markdown individuales.
// ============================================

const GROUP_LABELS = {
  grammar: "Gramática",
  vocabulary: "Vocabulario",
  anexos: "Anexos"
};

async function loadIndex() {
  const res = await fetch("content/index.json");
  return res.json();
}

function qs(param) {
  return new URLSearchParams(window.location.search).get(param);
}

// ---------- HOME PAGE: levels map ----------
async function renderHome() {
  const track = document.getElementById("levels-track");
  const anexosTrack = document.getElementById("anexos-track");
  if (!track) return;

  const data = await loadIndex();

  data.levels.forEach(level => {
    if (level.code === "EXTRA") return; // rendered separately below
    const totalItems = level.groups.reduce((sum, g) => sum + g.items.length, 0);
    const row = document.createElement("a");
    row.href = `level.html?level=${level.code}`;
    row.className = "level-row";
    row.style.setProperty("--lvl-color", level.color);
    row.innerHTML = `
      <div class="level-badge" style="background:${level.color}">${level.code}</div>
      <div class="level-info">
        <h3>${level.label}<span class="level-tag" style="background:${level.color}">${level.code}</span></h3>
        <p>${level.desc}</p>
      </div>
      <div class="level-count"><strong>${totalItems}</strong>temas</div>
    `;
    track.appendChild(row);
  });

  // Anexos as cards
  const extra = data.levels.find(l => l.code === "EXTRA");
  if (extra && anexosTrack) {
    extra.groups.forEach(g => {
      g.items.forEach((item, i) => {
        const card = document.createElement("a");
        card.href = `lesson.html?file=${encodeURIComponent(item.file)}`;
        card.className = "anexo-card";
        const shortTitle = item.title.replace(/^EXTRA[^—-]*[—-]\s*/, "");
        card.innerHTML = `
          <span class="anexo-num">Anexo ${String(i + 1).padStart(2, "0")}</span>
          <h4>${shortTitle}</h4>
        `;
        anexosTrack.appendChild(card);
      });
    });
  }
}

// ---------- LEVEL PAGE ----------
async function renderLevel() {
  const container = document.getElementById("level-groups");
  if (!container) return;

  const levelCode = qs("level");
  const data = await loadIndex();
  const level = data.levels.find(l => l.code === levelCode);
  if (!level) {
    container.innerHTML = "<p>Nivel no encontrado.</p>";
    return;
  }

  document.title = `${level.code} · ${level.label} — The English Path`;
  document.getElementById("level-eyebrow").textContent = `Nivel ${level.code}`;
  document.getElementById("level-eyebrow").style.color = level.color;
  document.getElementById("level-title").textContent = level.label;
  document.getElementById("level-desc").textContent = level.desc;

  level.groups.forEach(group => {
    const block = document.createElement("div");
    block.className = "group-block";
    const label = GROUP_LABELS[group.key] || group.key;
    let cardsHTML = "";
    group.items.forEach((item, i) => {
      const shortTitle = item.title
        .replace(/^[A-Za-z0-9]+([.·]\d*)?\s*[·.]?\s*(Gramática|Vocabulario|Anexo)?\s*\d*\s*[—–-]\s*/, "")
        .trim() || item.title;
      cardsHTML += `
        <a class="topic-card" href="lesson.html?file=${encodeURIComponent(item.file)}&level=${level.code}">
          <span class="topic-num">${String(i + 1).padStart(2, "0")}</span>
          <h4>${shortTitle}</h4>
        </a>`;
    });
    block.innerHTML = `<h3>${label}</h3><div class="topic-grid">${cardsHTML}</div>`;
    container.appendChild(block);
  });
}

// ---------- LESSON PAGE ----------
async function renderLesson() {
  const mdContainer = document.getElementById("md-content");
  if (!mdContainer) return;

  const file = qs("file");
  const levelCode = qs("level");
  const data = await loadIndex();

  // Build flat ordered list of all lessons for prev/next + sidebar
  const flatLessons = [];
  data.levels.forEach(level => {
    level.groups.forEach(group => {
      group.items.forEach(item => {
        flatLessons.push({ ...item, levelCode: level.code, levelColor: level.color, groupKey: group.key });
      });
    });
  });

  const currentIndex = flatLessons.findIndex(l => l.file === file);
  const current = flatLessons[currentIndex];

  if (!current) {
    mdContainer.innerHTML = "<p>Lección no encontrada.</p>";
    return;
  }

  // Fetch and render markdown
  try {
    const res = await fetch(`content/${current.file}`);
    const mdText = await res.text();
    document.title = `${current.title} — The English Path`;

    marked.setOptions({ gfm: true, breaks: false });
    // Extract mermaid code blocks and render as .mermaid divs
    const html = marked.parse(mdText);
    mdContainer.innerHTML = html;

    // Convert ```mermaid code blocks (marked renders as <pre><code class="language-mermaid">)
    mdContainer.querySelectorAll("code.language-mermaid").forEach(codeEl => {
      const pre = codeEl.parentElement;
      const div = document.createElement("div");
      div.className = "mermaid";
      div.textContent = codeEl.textContent;
      pre.replaceWith(div);
    });

    if (window.mermaid) {
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          primaryColor: "#F3EFE4",
          primaryTextColor: "#201E1B",
          primaryBorderColor: "#2B3A67",
          lineColor: "#8B4B6B",
          fontFamily: "Inter, sans-serif",
          fontSize: "14px"
        }
      });
      mermaid.run({ querySelector: ".mermaid" });
    }
  } catch (e) {
    mdContainer.innerHTML = `<p>No se pudo cargar la lección. (${e})</p>`;
  }

  // Progress indicator
  const progressEl = document.getElementById("lesson-progress");
  if (progressEl) {
    progressEl.textContent = `${current.levelCode} · ${GROUP_LABELS[current.groupKey] || current.groupKey} · Lección ${currentIndex + 1} de ${flatLessons.length}`;
    progressEl.style.color = current.levelColor;
  }

  // Sidebar nav: same level lessons
  const navContainer = document.getElementById("lesson-nav");
  if (navContainer) {
    const sameLevel = data.levels.find(l => l.code === current.levelCode);
    let navHTML = `<a href="level.html?level=${current.levelCode}" style="font-weight:600;color:${current.levelColor}">◂ Nivel ${current.levelCode}</a>`;
    sameLevel.groups.forEach(group => {
      navHTML += `<div class="nav-level-label">${GROUP_LABELS[group.key] || group.key}</div>`;
      group.items.forEach((item, i) => {
        const isCurrent = item.file === current.file;
        const shortTitle = item.title
          .replace(/^[A-Za-z0-9]+([.·]\d*)?\s*[·.]?\s*(Gramática|Vocabulario|Anexo)?\s*\d*\s*[—–-]\s*/, "")
          .trim() || item.title;
        navHTML += `<a href="lesson.html?file=${encodeURIComponent(item.file)}&level=${current.levelCode}" class="${isCurrent ? "current" : ""}">${i + 1}. ${shortTitle}</a>`;
      });
    });
    navContainer.innerHTML = navHTML;
  }

  // Prev/Next pager (global flat order)
  const pager = document.getElementById("lesson-pager");
  if (pager) {
    let pagerHTML = "";
    if (currentIndex > 0) {
      const prev = flatLessons[currentIndex - 1];
      const prevTitle = prev.title.replace(/^[A-Za-z0-9]+([.·]\d*)?\s*[·.]?\s*(Gramática|Vocabulario|Anexo)?\s*\d*\s*[—–-]\s*/, "").trim();
      pagerHTML += `<a href="lesson.html?file=${encodeURIComponent(prev.file)}&level=${prev.levelCode}" class="prev"><span>← Anterior</span>${prevTitle}</a>`;
    } else {
      pagerHTML += `<span></span>`;
    }
    if (currentIndex < flatLessons.length - 1) {
      const next = flatLessons[currentIndex + 1];
      const nextTitle = next.title.replace(/^[A-Za-z0-9]+([.·]\d*)?\s*[·.]?\s*(Gramática|Vocabulario|Anexo)?\s*\d*\s*[—–-]\s*/, "").trim();
      pagerHTML += `<a href="lesson.html?file=${encodeURIComponent(next.file)}&level=${next.levelCode}" class="next"><span>Siguiente →</span>${nextTitle}</a>`;
    }
    pager.innerHTML = pagerHTML;
  }
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
  renderHome();
  renderLevel();
  renderLesson();
});
