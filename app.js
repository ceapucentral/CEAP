/**
 * CEAP UCEN - Plataforma Universitaria PWA
 * Centro de Estudiantes / Universidad Central
 */

// --- 1. CONFIGURACIÓN DE DOMINIO Y ESTADO GLOBAL ---
const DEFAULT_DOMAIN = '@ucen.cl';

const state = {
  authorizedDomain: localStorage.getItem('cn_domain') || DEFAULT_DOMAIN,
  currentUser: JSON.parse(localStorage.getItem('cn_user')) || null,
  activeCategory: 'nacional',
  news: [
    {
      id: 'init-1',
      title: 'Comienza período de inscripción a talleres deportivos y culturales CEAP UCEN',
      link: '#',
      source: 'CEAP UCEN',
      subcategoria: 'Educación',
      category: 'nacional',
      date: 'Hoy',
      description: 'Ya están disponibles los cupos para Vóleibol, Futsal Damas, Futsal Varones y Música en la sede.',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop',
      isImportant: true
    }
  ],
  convocatorias: JSON.parse(localStorage.getItem('cn_convocatorias')) || [
    {
      id: 'c1',
      title: 'Beca de Mantención y Arancel Regional',
      org: 'Gobierno Regional de Coquimbo - UCEN',
      type: 'Becas',
      deadline: '2026-11-30',
      desc: 'Subsidio económico para estudiantes residentes de La Serena, Coquimbo, Ovalle e interior.',
      link: 'https://www.ucen.cl',
      status: 'vigente'
    },
    {
      id: 'c2',
      title: 'Práctica Profesional en Biotecnología y Recursos Hídricos',
      org: 'CEAZA / Convenio UCEN',
      type: 'Prácticas',
      deadline: '2026-12-15',
      desc: 'Convocatoria abierta para estudiantes de último año en áreas científicas y sociales.',
      link: 'https://www.ucen.cl',
      status: 'vigente'
    }
  ],
  actividades: [
    {
      id: 'a1',
      title: 'Asamblea General de Estudiantes CEAP UCEN',
      date: '2026-11-12 13:00',
      location: 'Patio Central / Aula Magna UCEN La Serena',
      type: 'academico',
      desc: 'Encuentro estudiantil para discusión de proyectos y presupuesto participativo.',
      organizer: 'CEAP UCEN'
    },
    {
      id: 'a2',
      title: 'Jornada Cultural y Feria del Libro Universitario',
      date: '2026-11-20 11:00',
      location: 'Sede La Serena',
      type: 'cultural',
      desc: 'Exposición artística, música en vivo y conversatorio de autores regionales.',
      organizer: 'Vocalía de Cultura CEAP'
    }
  ],
  // TALLERES OFICIALES CEAP UCEN
  talleres: [
    {
      id: 't-voleibol',
      name: 'Taller de Vóleibol',
      instructor: 'Coordinación de Deportes',
      day: 'Martes',
      start: '15:45',
      end: '17:00',
      room: 'Gimnasio',
      slots: 25,
      enrolled: 12
    },
    {
      id: 't-futsal-varones',
      name: 'Taller de Futsal Varones',
      instructor: 'Coordinación de Deportes',
      day: 'Martes',
      start: '17:00',
      end: '18:30',
      room: 'Gimnasio',
      slots: 25,
      enrolled: 17
    },
    {
      id: 't-musica-canto',
      name: 'Taller de Instrumentos y Canto',
      instructor: 'Vocalía de Cultura',
      day: 'Miércoles',
      start: '18:00',
      end: '19:30',
      room: 'Salón GHU',
      slots: 20,
      enrolled: 9
    },
    {
      id: 't-futsal-damas',
      name: 'Taller de Futsal Damas',
      instructor: 'Coordinación de Deportes',
      day: 'Jueves',
      start: '17:15',
      end: '18:45',
      room: 'Gimnasio',
      slots: 25,
      enrolled: 14
    }
  ]
};

// --- 2. FILTRADO TEMÁTICO DE NOTICIAS ---
const TEMAS_PERMITIDOS = {
  'Educación': ['educación', 'universidad', 'cruch', 'mineduc', 'estudiante', 'paes', 'arancel', 'gratuidad', 'beca', 'profesor', 'docente', 'académic'],
  'Política': ['política', 'congreso', 'senado', 'diputad', 'gobierno', 'reforma', 'ley', 'ministr', 'constituc', 'democracia', 'plebiscito', 'eleccion'],
  'Ciencias': ['ciencia', 'científic', 'investigación', 'ceaza', 'astronomía', 'tecnología', 'conicyt', 'anid', 'cambio climático', 'medioambiente'],
  'Salud': ['salud', 'minsal', 'fonasa', 'hospital', 'médic', 'vacuna', 'salud mental', 'enfermedad', 'bienestar', 'clínic'],
  'Equidad de Género': ['género', 'mujer', 'mujeres', 'feminism', 'paridad', 'diversidad', 'disidencias', 'violencia de género', 'derechos de la mujer'],
  'Cultura y Artes': ['cultura', 'arte', 'artes', 'teatro', 'cine', 'música', 'libro', 'literatura', 'patrimonio', 'museo', 'exposición', 'danza']
};

const KEYWORDS_IMPORTANT = [
  'urgente', 'alerta', 'comunicado', 'rectoría', 'suspensión',
  'paro', 'ucen', 'admisión', 'gratuidad', 'beca bicentenario',
  'la serena', 'coquimbo'
];

const RSS_SOURCES = {
  nacional: [
    { name: 'Cooperativa Educación y País', url: 'https://www.cooperativa.cl/noticias/site/tax/port/all/rss____1.xml' },
    { name: 'El Mostrador Cultura y Ciencias', url: 'https://www.elmostrador.cl/cultura/feed/' },
    { name: 'BioBioChile Nacional', url: 'https://www.biobiochile.cl/lista/categorias/nacional/rss' }
  ],
  regional: [
    { name: 'Diario El Día (Región de Coquimbo)', url: 'https://www.diarioeldia.cl/feed' },
    { name: 'BioBio Región de Coquimbo', url: 'https://www.biobiochile.cl/lista/categorias/region-de-coquimbo/rss' }
  ],
  internacional: [
    { name: 'BBC Mundo Noticias', url: 'https://feeds.bbci.co.uk/mundo/rss.xml' }
  ]
};

const CORS_PROXY = 'https://api.allorigins.win/get?url=';

// --- 3. EXTRACCIÓN Y PROCESAMIENTO RSS ---
function detectarTemaYFiltro(texto, categoria) {
  if (categoria !== 'nacional') {
    return { aceptada: true, subcategoria: 'Actualidad' };
  }

  const textoMin = texto.toLowerCase();
  const descartar = ['homicidio', 'balead', 'apuñala', 'asaltan', 'detienen a sujeto', 'farándula', 'reality'];
  if (descartar.some(p => textoMin.includes(p))) {
    return { aceptada: false, subcategoria: null };
  }

  for (const [tema, palabras] of Object.entries(TEMAS_PERMITIDOS)) {
    if (palabras.some(p => textoMin.includes(p))) {
      return { aceptada: true, subcategoria: tema };
    }
  }

  return { aceptada: false, subcategoria: null };
}

async function fetchRSS(feedUrl, sourceName, category) {
  try {
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(feedUrl)}`);
    if (!response.ok) return [];

    const data = await response.json();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data.contents, 'text/xml');
    const items = xmlDoc.querySelectorAll('item');
    const parsedItems = [];

    items.forEach((item) => {
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '#';
      const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();
      let rawDesc = item.querySelector('description')?.textContent || '';

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = rawDesc;
      const cleanDesc = tempDiv.textContent.slice(0, 160) + '...';

      const filtro = detectarTemaYFiltro(title + ' ' + cleanDesc, category);
      if (!filtro.aceptada) return;

      const textoCompleto = (title + ' ' + cleanDesc).toLowerCase();
      const isImportant = KEYWORDS_IMPORTANT.some(word => textoCompleto.includes(word));

      let image = item.querySelector('enclosure')?.getAttribute('url') ||
                  item.querySelector('content')?.getAttribute('url') ||
                  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop';

      parsedItems.push({
        id: link,
        title,
        link,
        source: sourceName,
        subcategoria: filtro.subcategoria,
        category,
        date: new Date(pubDate).toLocaleString('es-CL', {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        }),
        description: cleanDesc,
        image,
        isImportant
      });
    });

    return parsedItems;
  } catch (error) {
    console.warn(`No se pudo sincronizar el feed de ${sourceName}:`, error);
    return [];
  }
}

async function refreshAllNews() {
  const container = document.getElementById('news-grid');
  if (!container) return;

  const sources = RSS_SOURCES[state.activeCategory] || [];
  let aggregate = [];

  for (const src of sources) {
    const items = await fetchRSS(src.url, src.name, state.activeCategory);
    aggregate = [...aggregate, ...items];
  }

  if (aggregate.length > 0) {
    const uniqueNews = Array.from(new Map(aggregate.map(item => [item.link, item])).values());
    uniqueNews.sort((a, b) => (b.isImportant ? 1 : 0) - (a.isImportant ? 1 : 0));
    state.news = uniqueNews;
  }

  renderNews();
}

function renderNews() {
  const container = document.getElementById('news-grid');
  if (!container) return;
  container.innerHTML = '';

  state.news.forEach((item) => {
    const article = document.createElement('article');
    article.className = 'card';
    article.innerHTML = `
      <img src="${item.image}" alt="${item.title}" class="card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop'">
      <div class="card-body">
        <div class="card-meta">
          <span class="card-tag">${item.subcategoria || item.source}</span>
          ${item.isImportant ? '<span class="card-tag" style="background: #ef4444; color: #ffffff;">⚠️ IMPORTANTE</span>' : ''}
          <span>${item.date}</span>
        </div>
        <h3 class="card-title">${item.title}</h3>
        <p class="card-desc">${item.description}</p>
        <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="margin-top: auto;">
          Leer en fuente original ↗
        </a>
      </div>
    `;
    container.appendChild(article);
  });
}

// --- 4. TALLERES, CONVOCATORIAS Y ACTIVIDADES ---
function renderTalleres() {
  const container = document.getElementById('talleres-grid');
  const tbody = document.getElementById('timetable-body');
  if (!container || !tbody) return;

  container.innerHTML = '';
  tbody.innerHTML = '';

  // 1. Tarjetas de talleres con inscripción
  state.talleres.forEach((t) => {
    const card = document.createElement('article');
    card.className = 'card';
    const isFull = t.enrolled >= t.slots;
    card.innerHTML = `
      <div class="card-body">
        <div class="card-meta">
          <span class="card-tag">${t.day} • ${t.start} hrs</span>
          <span style="font-weight: 700; color: ${isFull ? '#ef4444' : '#10b981'}">
            ${isFull ? 'Agotado' : `${t.slots - t.enrolled} cupos disponibles`}
          </span>
        </div>
        <h3 class="card-title">${t.name}</h3>
        <p style="font-size: 0.88rem; color: var(--electric-blue); font-weight: 700; margin-bottom: 0.35rem;">📍 Lugar: ${t.room}</p>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.75rem;">Horario: ${t.start} a ${t.end} hrs</p>
        <button class="btn btn-primary" ${isFull ? 'disabled style="opacity:0.5;"' : ''} onclick="inscribirTaller('${t.id}')">
          ${isFull ? 'Sin Cupos' : 'Inscribirme al Taller'}
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  // 2. Horario semanal visual
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const row = document.createElement('tr');
  row.innerHTML = `<td><strong>Talleres</strong></td>` + days.map(day => {
    const matches = state.talleres.filter(t => t.day.toLowerCase() === day.toLowerCase());
    if (matches.length > 0) {
      const itemsHtml = matches.map(m => `
        <div class="workshop-slot" style="margin-bottom: 0.4rem;">
          <h5>${m.name}</h5>
          <p>⏰ ${m.start} hrs</p>
          <p>📍 ${m.room}</p>
        </div>
      `).join('');
      return `<td>${itemsHtml}</td>`;
    }
    return `<td><span style="color: var(--text-muted);">-</span></td>`;
  }).join('');

  tbody.appendChild(row);
}

window.inscribirTaller = function(id) {
  if (!state.currentUser) {
    alert('Debes iniciar sesión con tu correo institucional @ucen.cl para reservar un cupo.');
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('active');
    return;
  }
  const workshop = state.talleres.find(t => t.id === id);
  if (workshop && workshop.enrolled < workshop.slots) {
    workshop.enrolled++;
    renderTalleres();
    alert(`¡Inscripción exitosa en "${workshop.name}"!`);
  }
};

function renderConvocatorias(filter = 'all') {
  const container = document.getElementById('convocatorias-grid');
  if (!container) return;
  container.innerHTML = '';

  const list = state.convocatorias.filter(c => filter === 'all' ? true : c.status === filter);

  list.forEach((c) => {
    const el = document.createElement('article');
    el.className = 'card';
    el.innerHTML = `
      <div class="card-body">
        <div class="card-meta">
          <span class="card-tag">${c.type}</span>
          <span style="color: #ef4444; font-weight: 700;">Límite: ${c.deadline}</span>
        </div>
        <h3 class="card-title">${c.title}</h3>
        <p style="font-size: 0.85rem; font-weight: 700; color: var(--electric-blue); margin-bottom: 0.5rem;">${c.org}</p>
        <p class="card-desc">${c.desc}</p>
        <a href="${c.link}" target="_blank" rel="noopener" class="btn btn-primary">Postular / Información</a>
      </div>
    `;
    container.appendChild(el);
  });
}

function renderActividades() {
  const container = document.getElementById('actividades-grid');
  if (!container) return;
  container.innerHTML = '';

  state.actividades.forEach((a) => {
    const el = document.createElement('article');
    el.className = 'card';
    el.innerHTML = `
      <div class="card-body">
        <div class="card-meta">
          <span class="card-tag">${a.type}</span>
          <span>📅 ${a.date}</span>
        </div>
        <h3 class="card-title">${a.title}</h3>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.5rem;">📍 ${a.location}</p>
        <p class="card-desc">${a.desc}</p>
        <button class="btn btn-primary" onclick="alert('Inscripción registrada para: ${a.title}')">Inscribirme al Evento</button>
      </div>
    `;
    container.appendChild(el);
  });
}

// --- 5. AUTENTICACIÓN INSTITUCIONAL UCEN ---
const authModal = document.getElementById('auth-modal');
const authBtn = document.getElementById('auth-btn');
const closeAuthModal = document.getElementById('close-auth-modal');
const authForm = document.getElementById('auth-form');
const authAlert = document.getElementById('auth-alert');
const authEmail = document.getElementById('auth-email');
const authDomainHint = document.getElementById('auth-domain-hint');

function updateAuthUI() {
  if (!authBtn) return;
  if (state.currentUser) {
    authBtn.textContent = 'Cerrar Sesión';
    authBtn.className = 'btn btn-outline';
    const bnavAdmin = document.getElementById('bnav-admin');
    if (bnavAdmin && state.currentUser.role === 'admin') {
      bnavAdmin.style.display = 'flex';
    }
  } else {
    authBtn.textContent = 'Ingresar';
    authBtn.className = 'btn btn-primary';
  }
  if (authDomainHint) {
    authDomainHint.textContent = `Dominio institucional requerido: ${state.authorizedDomain}`;
  }
}

if (authBtn) {
  authBtn.addEventListener('click', () => {
    if (state.currentUser) {
      state.currentUser = null;
      localStorage.removeItem('cn_user');
      updateAuthUI();
      alert('Sesión cerrada correctamente.');
    } else if (authModal) {
      if (authAlert) authAlert.style.display = 'none';
      authModal.classList.add('active');
    }
  });
}

if (closeAuthModal && authModal) {
  closeAuthModal.addEventListener('click', () => {
    authModal.classList.remove('active');
  });
}

if (authForm) {
  authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = authEmail.value.trim().toLowerCase();
    const domain = state.authorizedDomain.toLowerCase();

    if (!email.endsWith(domain)) {
      if (authAlert) {
        authAlert.textContent = `Acceso denegado: debes ingresar con correo institucional ${domain}`;
        authAlert.style.display = 'block';
      }
      return;
    }

    const role = (email.startsWith('admin') || email.startsWith('ceap')) ? 'admin' : 'student';

    state.currentUser = { email, role, loggedAt: new Date().toISOString() };
    localStorage.setItem('cn_user', JSON.stringify(state.currentUser));

    authModal.classList.remove('active');
    authForm.reset();
    updateAuthUI();
    alert(`Bienvenido/a a CEAP UCEN (${role === 'admin' ? 'Administrador/a' : 'Estudiante'})`);
  });
}

// --- 6. NAVEGACIÓN Y CONFIGURACIÓN ---
document.querySelectorAll('.bnav-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.bnav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));

    btn.classList.add('active');
    const target = btn.dataset.target;
    const targetEl = document.getElementById(target);
    if (targetEl) targetEl.classList.add('active');
  });
});

document.querySelectorAll('#view-news .pill-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#view-news .pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeCategory = btn.dataset.category;

    const titles = {
      nacional: 'Chile y Educación (Política, Ciencias, Educación, Salud, Género y Cultura)',
      regional: 'Noticias Regionales (Coquimbo, La Serena, Ovalle, Vicuña)',
      internacional: 'Noticias Internacionales'
    };
    const titleEl = document.getElementById('news-section-title');
    if (titleEl) titleEl.textContent = titles[state.activeCategory];
    refreshAllNews();
  });
});

const refreshNewsBtn = document.getElementById('refresh-news-btn');
if (refreshNewsBtn) refreshNewsBtn.addEventListener('click', refreshAllNews);

// Service Worker PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => console.log('CEAP UCEN Service Worker activo'))
    .catch((err) => console.error('Error SW:', err));
}

// Auto-actualización cada 5 minutos
setInterval(() => {
  console.log('Sincronizando noticias automáticas...');
  refreshAllNews();
}, 300000);

// --- 7. INICIALIZACIÓN INMEDIATA EN PANTALLA ---
updateAuthUI();
renderNews();
renderConvocatorias();
renderActividades();
renderTalleres();
refreshAllNews();
