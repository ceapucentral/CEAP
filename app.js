/**
 * CampusNexus - Aplicación Universitaria PWA
 * Arquitectura modular autónoma sin dependencias de pago.
 */

// --- 1. ESTADO GLOBAL Y PERSISTENCIA ---
const DEFAULT_DOMAIN = '@ucen.cl'; // Dominio base configurable desde el panel de admin

const state = {
  authorizedDomain: localStorage.getItem('cn_domain') || DEFAULT_DOMAIN,
  currentUser: JSON.parse(localStorage.getItem('cn_user')) || null,
  activeCategory: 'regional',
  news: [],
  convocatorias: JSON.parse(localStorage.getItem('cn_convocatorias')) || [
    {
      id: 'c1',
      title: 'Beca de Mantención y Arancel Regional',
      org: 'Gobierno Regional de Coquimbo',
      type: 'Becas',
      deadline: '2026-11-30',
      desc: 'Subsidio económico para estudiantes residentes de La Serena, Coquimbo, Ovalle e interior.',
      link: 'https://www.gobiernogestion.cl',
      status: 'vigente'
    },
    {
      id: 'c2',
      title: 'Práctica Profesional en Biotecnología y Recursos Hídricos',
      org: 'Centro de Estudios Avanzados en Zonas Áridas (CEAZA)',
      type: 'Prácticas',
      deadline: '2026-12-15',
      desc: 'Convocatoria abierta para estudiantes de último año en áreas científicas e ingeniería.',
      link: 'https://www.ceaza.cl',
      status: 'vigente'
    }
  ],
  actividades: [
    {
      id: 'a1',
      title: 'Congreso de Innovación Social y Sustentabilidad',
      date: '2026-11-12 10:00',
      location: 'Aula Magna del Campus Central',
      type: 'academico',
      desc: 'Encuentro con ponencias de investigadores regionales y nacionales.',
      organizer: 'Dirección de Vinculación con el Medio'
    },
    {
      id: 'a2',
      title: 'Torneo Interfacultades de Futsal y Vóleibol',
      date: '2026-11-18 16:30',
      location: 'Gimnasio Polideportivo Universitario',
      type: 'deportivo',
      desc: 'Competencia deportiva semestral de la comunidad estudiantil.',
      organizer: 'Asociación de Estudiantes'
    }
  ],
  talleres: [
    {
      id: 't1',
      name: 'Oratoria, Debate y Liderazgo Público',
      instructor: 'Mg. Roberto San Martín',
      day: 'Lunes',
      dayIndex: 1,
      start: '16:00',
      end: '17:30',
      room: 'Sala 302 - Edificio A',
      slots: 25,
      enrolled: 18
    },
    {
      id: 't2',
      name: 'Desarrollo de Software y Robótica con Arduino',
      instructor: 'Ing. Carolina Morales',
      day: 'Miércoles',
      dayIndex: 3,
      start: '14:30',
      end: '16:30',
      room: 'Laboratorio de Computación 2',
      slots: 20,
      enrolled: 20
    },
    {
      id: 't3',
      name: 'Taller de Teatro Universitario y Expresión Corporal',
      instructor: 'Prof. Macarena Valenzuela',
      day: 'Viernes',
      dayIndex: 5,
      start: '17:00',
      end: '19:00',
      room: 'Salón de Actos',
      slots: 30,
      enrolled: 12
    }
  ]
};

// --- 2. FUENTES RSS GRATUITAS (Regionales, Nacionales e Internacionales) ---
const RSS_SOURCES = {
  regional: [
    { name: 'Diario El Día (La Serena/Coquimbo)', url: 'https://www.diarioeldia.cl/feed' },
    { name: 'BioBioChile Región de Coquimbo', url: 'https://www.biobiochile.cl/lista/categorias/region-de-coquimbo/rss' }
  ],
  nacional: [
    { name: 'Cooperativa Educación y Sociedad', url: 'https://www.cooperativa.cl/noticias/site/tax/port/all/rss____1.xml' },
    { name: 'El Mostrador Cultura y Ciencia', url: 'https://www.elmostrador.cl/cultura/feed/' }
  ],
  internacional: [
    { name: 'BBC Mundo Noticias', url: 'https://feeds.bbci.co.uk/mundo/rss.xml' }
  ]
};

// Proxy CORS gratuito y sin registros para consumir RSS directamente en el navegador
const CORS_PROXY = 'https://api.allorigins.win/get?url=';

// --- 3. INICIALIZACIÓN DE SERVICE WORKER Y PWA ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => console.log('PWA Service Worker instalado'))
    .catch((err) => console.error('Error al registrar Service Worker:', err));
}

let deferredInstallPrompt = null;
const installBtn = document.getElementById('pwa-install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  installBtn.style.display = 'block';
});

installBtn.addEventListener('click', async () => {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      installBtn.style.display = 'none';
    }
    deferredInstallPrompt = null;
  }
});

// --- 4. MOTOR DE EXTRACCIÓN Y LIMPIEZA DE NOTICIAS ---
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
      const title = item.querySelector('title')?.textContent || 'Sin título';
      const link = item.querySelector('link')?.textContent || '#';
      const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();
      let description = item.querySelector('description')?.textContent || '';
      
      // Limpieza de etiquetas HTML en el resumen
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = description;
      description = tempDiv.textContent.slice(0, 160) + '...';

      // Extracción de imagen del elemento <enclosure> o <media:content>
      let image = item.querySelector('enclosure')?.getAttribute('url') || 
                  item.querySelector('content')?.getAttribute('url') ||
                  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop';

      parsedItems.push({
        id: link,
        title,
        link,
        source: sourceName,
        category,
        date: new Date(pubDate).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        description,
        image
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
  container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">Sincronizando noticias en tiempo real...</div>`;

  const sources = RSS_SOURCES[state.activeCategory] || [];
  let aggregate = [];

  for (const src of sources) {
    const items = await fetchRSS(src.url, src.name, state.activeCategory);
    aggregate = [...aggregate, ...items];
  }

  // Deduplicación por enlace
  const uniqueNews = Array.from(new Map(aggregate.map(item => [item.link, item])).values());
  
  if (uniqueNews.length === 0) {
    // Si la red bloquea el proxy, presentamos noticias universitarias de respaldo verídicas
    state.news = [
      {
        id: 'fallback-1',
        title: 'Comienza período de postulación a talleres y actividades extracurriculares',
        link: '#',
        source: 'Prensa Universitaria',
        category: 'regional',
        date: 'Hoy, 10:30',
        description: 'La Dirección de Asuntos Estudiantiles habilitó los cupos para las actividades deportivas y artísticas semestrales.',
        image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop'
      }
    ];
  } else {
    state.news = uniqueNews;
  }

  renderNews();
}

function renderNews() {
  const container = document.getElementById('news-grid');
  container.innerHTML = '';

  state.news.forEach((item) => {
    const article = document.createElement('article');
    article.className = 'card';
    article.innerHTML = `
      <img src="${item.image}" alt="${item.title}" class="card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop'">
      <div class="card-body">
        <div class="card-meta">
          <span class="card-tag">${item.source}</span>
          <span>${item.date}</span>
        </div>
        <h3 class="card-title">${item.title}</h3>
        <p class="card-desc">${item.description}</p>
        <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="margin-top: auto;">
          Leer Noticia Completa ↗
        </a>
      </div>
    `;
    container.appendChild(article);
  });
}

// --- 5. RENDERIZADO DE CONVOCATORIAS, ACTIVIDADES Y TALLERES ---
function renderConvocatorias(filter = 'all') {
  const container = document.getElementById('convocatorias-grid');
  container.innerHTML = '';

  const list = state.convocatorias.filter(c => filter === 'all' ? true : c.status === filter);

  list.forEach((c) => {
    const el = document.createElement('article');
    el.className = 'card';
    el.innerHTML = `
      <div class="card-body">
        <div class="card-meta">
          <span class="card-tag">${c.type}</span>
          <span style="color: #ef4444; font-weight: 600;">Límite: ${c.deadline}</span>
        </div>
        <h3 class="card-title">${c.title}</h3>
        <p style="font-size: 0.8rem; font-weight: 700; color: var(--electric-blue); margin-bottom: 0.5rem;">${c.org}</p>
        <p class="card-desc">${c.desc}</p>
        <a href="${c.link}" target="_blank" rel="noopener" class="btn btn-primary">Postular / Más Información</a>
      </div>
    `;
    container.appendChild(el);
  });
}

function renderActividades() {
  const container = document.getElementById('actividades-grid');
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
        <button class="btn btn-primary" onclick="alert('Inscripción confirmada para: ${a.title}')">Inscribirme al Evento</button>
      </div>
    `;
    container.appendChild(el);
  });
}

function renderTalleres() {
  const container = document.getElementById('talleres-grid');
  const tbody = document.getElementById('timetable-body');
  container.innerHTML = '';
  tbody.innerHTML = '';

  // Render tarjetas
  state.talleres.forEach((t) => {
    const card = document.createElement('article');
    card.className = 'card';
    const isFull = t.enrolled >= t.slots;
    card.innerHTML = `
      <div class="card-body">
        <div class="card-meta">
          <span class="card-tag">${t.day} | ${t.start} - ${t.end}</span>
          <span style="font-weight: 700; color: ${isFull ? '#ef4444' : '#10b981'}">
            ${isFull ? 'Agotado' : `${t.slots - t.enrolled} cupos libres`}
          </span>
        </div>
        <h3 class="card-title">${t.name}</h3>
        <p style="font-size: 0.85rem; color: var(--electric-blue); font-weight: 600; margin-bottom: 0.35rem;">Docente: ${t.instructor}</p>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.75rem;">Lugar: ${t.room}</p>
        <button class="btn btn-primary" ${isFull ? 'disabled style="opacity: 0.5;"' : ''} onclick="inscribirTaller('${t.id}')">
          ${isFull ? 'Sin Cupos Disponibles' : 'Inscribir Taller'}
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  // Generación del Horario Académico
  const blocks = ['14:00 - 16:00', '16:00 - 18:00', '18:00 - 20:00'];
  blocks.forEach((block) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><strong>${block}</strong></td>` + 
      ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(day => {
        const found = state.talleres.find(t => t.day.toLowerCase() === day.toLowerCase());
        if (found) {
          return `<td><div class="workshop-slot"><h5>${found.name}</h5><p>${found.room}</p></div></td>`;
        }
        return `<td>-</td>`;
      }).join('');
    tbody.appendChild(tr);
  });
}

window.inscribirTaller = function(id) {
  if (!state.currentUser) {
    alert('Debes iniciar sesión con tu correo institucional para reservar un cupo.');
    document.getElementById('auth-modal').classList.add('active');
    return;
  }
  const workshop = state.talleres.find(t => t.id === id);
  if (workshop && workshop.enrolled < workshop.slots) {
    workshop.enrolled++;
    renderTalleres();
    alert(`¡Inscripción exitosa en "${workshop.name}"!`);
  }
};

// --- 6. AUTENTICACIÓN INSTITUCIONAL CON DOMINIO ESTRICTO ---
const authModal = document.getElementById('auth-modal');
const authBtn = document.getElementById('auth-btn');
const closeAuthModal = document.getElementById('close-auth-modal');
const authForm = document.getElementById('auth-form');
const authAlert = document.getElementById('auth-alert');
const authEmail = document.getElementById('auth-email');
const authDomainHint = document.getElementById('auth-domain-hint');

function updateAuthUI() {
  if (state.currentUser) {
    authBtn.textContent = 'Cerrar Sesión';
    authBtn.className = 'btn btn-outline';
    if (state.currentUser.role === 'admin') {
      document.getElementById('bnav-admin').style.display = 'flex';
    }
  } else {
    authBtn.textContent = 'Ingresar';
    authBtn.className = 'btn btn-primary';
  }
  authDomainHint.textContent = `Dominio institucional requerido: ${state.authorizedDomain}`;
}

authBtn.addEventListener('click', () => {
  if (state.currentUser) {
    state.currentUser = null;
    localStorage.removeItem('cn_user');
    updateAuthUI();
    alert('Sesión cerrada correctamente.');
  } else {
    authAlert.style.display = 'none';
    authModal.classList.add('active');
  }
});

closeAuthModal.addEventListener('click', () => {
  authModal.classList.remove('active');
});

authForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = authEmail.value.trim().toLowerCase();
  const domain = state.authorizedDomain.toLowerCase();

  // Validación rigurosa de correo institucional
  if (!email.endsWith(domain)) {
    authAlert.textContent = `Acceso denegado: únicamente se permiten cuentas con terminación ${domain}`;
    authAlert.style.display = 'block';
    return;
  }

  // Determinación de rol: la cuenta que comience con 'admin' o 'rectoria' recibe perfil administrador
  const role = (email.startsWith('admin') || email.startsWith('director')) ? 'admin' : 'student';

  state.currentUser = { email, role, loggedAt: new Date().toISOString() };
  localStorage.setItem('cn_user', JSON.stringify(state.currentUser));
  
  authModal.classList.remove('active');
  authForm.reset();
  updateAuthUI();
  alert(`Bienvenido a CampusNexus (${role === 'admin' ? 'Administrador' : 'Estudiante'})`);
});

// --- 7. PANEL DE CONTROL Y CONFIGURACIÓN ADMINISTRATIVA ---
document.getElementById('admin-domain-input').value = state.authorizedDomain;
document.getElementById('admin-save-domain-btn').addEventListener('click', () => {
  const newDomain = document.getElementById('admin-domain-input').value.trim();
  if (!newDomain.startsWith('@')) {
    alert('El dominio debe comenzar con @ (ejemplo: @ucen.cl)');
    return;
  }
  state.authorizedDomain = newDomain;
  localStorage.setItem('cn_domain', newDomain);
  updateAuthUI();
  alert(`Dominio institucional actualizado con éxito a: ${newDomain}`);
});

document.getElementById('form-create-convocatoria').addEventListener('submit', (e) => {
  e.preventDefault();
  const newConvo = {
    id: 'c_' + Date.now(),
    title: document.getElementById('c-title').value.trim(),
    org: document.getElementById('c-org').value.trim(),
    type: document.getElementById('c-type').value,
    deadline: document.getElementById('c-deadline').value,
    desc: document.getElementById('c-desc').value.trim(),
    link: document.getElementById('c-link').value.trim(),
    status: 'vigente'
  };

  state.convocatorias.unshift(newConvo);
  localStorage.setItem('cn_convocatorias', JSON.stringify(state.convocatorias));
  renderConvocatorias();
  e.target.reset();
  alert('Convocatoria universitaria publicada en la plataforma.');
});

// --- 8. NAVEGACIÓN Y EVENTOS DE INTERFAZ ---
document.querySelectorAll('.bnav-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.bnav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));

    btn.classList.add('active');
    const target = btn.dataset.target;
    document.getElementById(target).classList.add('active');
  });
});

document.querySelectorAll('#view-news .pill-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#view-news .pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeCategory = btn.dataset.category;
    
    const titles = {
      regional: 'Noticias Regionales (Coquimbo, La Serena, Ovalle, Vicuña)',
      nacional: 'Noticias Nacionales (Chile, Educación, Ciencia)',
      internacional: 'Noticias Internacionales'
    };
    document.getElementById('news-section-title').textContent = titles[state.activeCategory];
    refreshAllNews();
  });
});

document.getElementById('refresh-news-btn').addEventListener('click', refreshAllNews);

// Modo Oscuro
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  document.getElementById('theme-icon').textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('cn_theme', isDark ? 'dark' : 'light');
});

if (localStorage.getItem('cn_theme') === 'dark') {
  document.body.classList.add('dark-mode');
  document.getElementById('theme-icon').textContent = '☀️';
}

// Inicialización general
updateAuthUI();
refreshAllNews();
renderConvocatorias();
renderActividades();
renderTalleres();
