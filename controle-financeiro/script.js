/* ═══════════════════════════════════════════════
   Finance Dashboard — script.js
   ─ Navegação entre seções
   ─ Adicionar / excluir transações
   ─ Filtros e busca
   ─ Gráficos (linha + pizza)
   ─ Relatórios dinâmicos
   ─ Persistência via localStorage
   ═══════════════════════════════════════════════ */

const App = (() => {

  /* ── Estado ── */
  let transacoes = [];
  let graficoLinha = null;
  let graficoPizza = null;

  /* ── Utilitários ── */
  const fmt = (v) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const fmtData = (iso) => {
    if (!iso) return '';
    const [a, m, d] = iso.split('-');
    return `${d}/${m}/${a}`;
  };

  const hoje = () => new Date().toISOString().split('T')[0];

  const categoriaEmoji = {
    alimentacao: '🍔',
    transporte:  '🚗',
    moradia:     '🏠',
    saude:       '💊',
    lazer:       '🎮',
    educacao:    '📚',
    salario:     '💼',
    investimento:'📈',
    outros:      '📦',
  };

  const categoriaLabel = {
    alimentacao: 'Alimentação',
    transporte:  'Transporte',
    moradia:     'Moradia',
    saude:       'Saúde',
    lazer:       'Lazer',
    educacao:    'Educação',
    salario:     'Salário',
    investimento:'Investimento',
    outros:      'Outros',
  };

  /* ── Persistência ── */
  const salvar = () =>
    localStorage.setItem('finance_transacoes', JSON.stringify(transacoes));

  const carregar = () => {
    try {
      const raw = localStorage.getItem('finance_transacoes');
      transacoes = raw ? JSON.parse(raw) : [];
    } catch { transacoes = []; }
  };

  /* ── Toast ── */
  let toastTimer = null;

  const toast = (msg) => {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
  };

  /* ── Navegação ── */
  const navegarPara = (sectionId) => {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    document.getElementById(sectionId)?.classList.add('active');
    document.querySelector(`[data-section="${sectionId}"]`)?.classList.add('active');

    // atualiza relatórios ao entrar na seção
    if (sectionId === 'relatoriosSection') renderizarRelatorios();
  };

  /* ── Filtro de período ── */
  const filtrarPorPeriodo = (lista) => {
    const periodo = document.getElementById('filtroPeriodo')?.value || 'todos';
    if (periodo === 'todos') return lista;

    const agora = new Date();
    return lista.filter(t => {
      if (!t.data) return true;
      const d = new Date(t.data + 'T12:00:00');
      if (periodo === 'mes') {
        return d.getFullYear() === agora.getFullYear() && d.getMonth() === agora.getMonth();
      }
      if (periodo === 'semana') {
        const diff = (agora - d) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff < 7;
      }
      return true;
    });
  };

  /* ── Cálculos ── */
  const calcular = (lista) => {
    const entradas = lista.filter(t => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0);
    const saidas   = lista.filter(t => t.tipo === 'saida').reduce((s, t) => s + t.valor, 0);
    return { entradas, saidas, saldo: entradas - saidas };
  };

  /* ── Atualizar cards ── */
  const atualizarCards = () => {
    const filtrada = filtrarPorPeriodo(transacoes);
    const { entradas, saidas, saldo } = calcular(filtrada);

    document.getElementById('totalEntradas').textContent = fmt(entradas);
    document.getElementById('totalSaidas').textContent   = fmt(saidas);
    document.getElementById('saldoAtual').textContent    = fmt(saldo);

    const qtdE = filtrada.filter(t => t.tipo === 'entrada').length;
    const qtdS = filtrada.filter(t => t.tipo === 'saida').length;

    document.getElementById('qtdEntradas').textContent = `${qtdE} transação${qtdE !== 1 ? 'ões' : ''}`;
    document.getElementById('qtdSaidas').textContent   = `${qtdS} transação${qtdS !== 1 ? 'ões' : ''}`;

    const statusEl = document.getElementById('saldoStatus');
    if (saldo > 0)      { statusEl.textContent = '✅ Positivo'; statusEl.style.color = 'var(--entrada)'; }
    else if (saldo < 0) { statusEl.textContent = '⚠️ Negativo';  statusEl.style.color = 'var(--saida)'; }
    else                { statusEl.textContent = '—'; statusEl.style.color = 'var(--muted)'; }
  };

  /* ── Gráfico de linha ── */
  const atualizarGraficoLinha = () => {
    const filtrada = filtrarPorPeriodo(transacoes);

    // agrupar por data
    const mapa = {};
    filtrada.forEach(t => {
      const d = t.data || hoje();
      if (!mapa[d]) mapa[d] = { entrada: 0, saida: 0 };
      mapa[d][t.tipo] += t.valor;
    });

    const datas = Object.keys(mapa).sort();
    const labels   = datas.map(fmtData);
    const entradas = datas.map(d => mapa[d].entrada);
    const saidas   = datas.map(d => mapa[d].saida);

    const ctx = document.getElementById('graficoLinha').getContext('2d');

    if (graficoLinha) graficoLinha.destroy();

    graficoLinha = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Entradas',
            data: entradas,
            borderColor: '#4ecca3',
            backgroundColor: 'rgba(78,204,163,0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#4ecca3',
          },
          {
            label: 'Saídas',
            data: saidas,
            borderColor: '#ff6b6b',
            backgroundColor: 'rgba(255,107,107,0.08)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#ff6b6b',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#a09eb0', font: { family: 'DM Sans' } } },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          x: { ticks: { color: '#7a7888' }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: {
            ticks: {
              color: '#7a7888',
              callback: (v) => 'R$ ' + v.toLocaleString('pt-BR'),
            },
            grid: { color: 'rgba(255,255,255,0.04)' },
          },
        },
      },
    });
  };

  /* ── Gráfico de pizza ── */
  const atualizarGraficoPizza = () => {
    const filtrada = filtrarPorPeriodo(transacoes).filter(t => t.tipo === 'saida');

    const mapa = {};
    filtrada.forEach(t => {
      const cat = t.categoria || 'outros';
      mapa[cat] = (mapa[cat] || 0) + t.valor;
    });

    const labels = Object.keys(mapa).map(k => categoriaLabel[k] || k);
    const data   = Object.values(mapa);
    const cores  = ['#ff6b6b','#ffa94d','#ffd43b','#69db7c','#4ec9f5','#748ffc','#da77f2','#f783ac','#a9e34b'];

    const ctx = document.getElementById('graficoPizza').getContext('2d');
    if (graficoPizza) graficoPizza.destroy();

    if (data.length === 0) {
      graficoPizza = null;
      return;
    }

    graficoPizza = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: cores.slice(0, data.length),
          borderColor: '#18181f',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#a09eb0',
              font: { family: 'DM Sans', size: 11 },
              padding: 10,
              boxWidth: 12,
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${fmt(ctx.raw)}`,
            },
          },
        },
      },
    });
  };

  /* ── Lista de transações ── */
  const renderizarLista = () => {
    const busca    = (document.getElementById('busca')?.value || '').toLowerCase();
    const tipo     = document.getElementById('filtroTipo')?.value || 'todos';
    const categ    = document.getElementById('filtroCategoria')?.value || 'todos';

    let filtrada = [...transacoes].reverse(); // mais recentes primeiro

    if (tipo !== 'todos')  filtrada = filtrada.filter(t => t.tipo === tipo);
    if (categ !== 'todos') filtrada = filtrada.filter(t => t.categoria === categ);
    if (busca)             filtrada = filtrada.filter(t => t.descricao.toLowerCase().includes(busca));

    const lista  = document.getElementById('lista');
    const empty  = document.getElementById('emptyLista');

    lista.innerHTML = '';

    if (filtrada.length === 0) {
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    filtrada.forEach(t => lista.appendChild(criarItem(t, true)));
  };

  /* ── Lista recente (dashboard) ── */
  const renderizarRecente = () => {
    const lista = document.getElementById('listaRecente');
    const empty = document.getElementById('emptyRecente');
    const recentes = [...transacoes].reverse().slice(0, 5);

    lista.innerHTML = '';

    if (recentes.length === 0) {
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    recentes.forEach(t => lista.appendChild(criarItem(t, false)));
  };

  /* ── Criar item de transação ── */
  const criarItem = (t, comDelete) => {
    const li = document.createElement('li');
    li.className = 'transaction-item';

    const emoji = categoriaEmoji[t.categoria] || '📦';
    const sinal = t.tipo === 'entrada' ? '+' : '−';
    const obs   = t.observacao ? ` · ${t.observacao}` : '';
    const cat   = categoriaLabel[t.categoria] || 'Outros';

    li.innerHTML = `
      <div class="tx-icon ${t.tipo}">${emoji}</div>
      <div class="tx-info">
        <div class="tx-desc">${t.descricao}</div>
        <div class="tx-meta">${cat}${t.data ? ' · ' + fmtData(t.data) : ''}${obs}</div>
      </div>
      <div class="tx-valor ${t.tipo}">${sinal} ${fmt(t.valor)}</div>
      ${comDelete ? `<button class="tx-delete" title="Excluir" onclick="App.excluir('${t.id}')">✕</button>` : ''}
    `;

    return li;
  };

  /* ── Adicionar transação ── */
  const adicionar = (tipo) => {
    const descEl  = document.getElementById('descricao');
    const valorEl = document.getElementById('valor');
    const catEl   = document.getElementById('categoria');
    const dataEl  = document.getElementById('dataTransacao');
    const obsEl   = document.getElementById('observacao');
    const feedback = document.getElementById('formFeedback');

    const descricao  = descEl.value.trim();
    const valor      = parseFloat(valorEl.value);
    const categoria  = catEl.value;
    const data       = dataEl.value || hoje();
    const observacao = obsEl.value.trim();

    // validação
    if (!descricao) {
      mostrarFeedback(feedback, 'Por favor, insira uma descrição.', 'error');
      descEl.focus();
      return;
    }

    if (!valor || isNaN(valor) || valor <= 0) {
      mostrarFeedback(feedback, 'Por favor, insira um valor válido maior que zero.', 'error');
      valorEl.focus();
      return;
    }

    const transacao = {
      id: Date.now().toString(),
      tipo,
      descricao,
      valor,
      categoria,
      data,
      observacao,
    };

    transacoes.push(transacao);
    salvar();
    atualizarTudo();

    // limpar form
    descEl.value  = '';
    valorEl.value = '';
    obsEl.value   = '';
    catEl.value   = 'outros';
    dataEl.value  = hoje();

    const label = tipo === 'entrada' ? 'Entrada' : 'Saída';
    mostrarFeedback(feedback, `✅ ${label} de ${fmt(valor)} registrada com sucesso!`, 'success');
    toast(`${tipo === 'entrada' ? '✅' : '📤'} ${descricao} · ${fmt(valor)}`);
  };

  /* ── Feedback de formulário ── */
  const mostrarFeedback = (el, msg, tipo) => {
    el.textContent = msg;
    el.className = `form-feedback ${tipo}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3500);
  };

  /* ── Excluir transação ── */
  const excluir = (id) => {
    const idx = transacoes.findIndex(t => t.id === id);
    if (idx === -1) return;
    const t = transacoes[idx];
    transacoes.splice(idx, 1);
    salvar();
    atualizarTudo();
    toast(`🗑 "${t.descricao}" removido.`);
  };

  /* ── Limpar tudo ── */
  const limparTudo = () => {
    if (!confirm('Tem certeza que deseja apagar todas as transações?')) return;
    transacoes = [];
    salvar();
    atualizarTudo();
    toast('🗑 Todos os dados foram apagados.');
  };

  /* ── Relatórios ── */
  const renderizarRelatorios = () => {
    const { entradas, saidas, saldo } = calcular(transacoes);
    const total = transacoes.length;

    /* Resumo */
    const resumo = document.getElementById('relatorioResumo');
    resumo.innerHTML = `
      <li class="relatorio-item">
        <span class="relatorio-item-label">Total de entradas</span>
        <span class="relatorio-item-value positivo">${fmt(entradas)}</span>
      </li>
      <li class="relatorio-item">
        <span class="relatorio-item-label">Total de saídas</span>
        <span class="relatorio-item-value negativo">${fmt(saidas)}</span>
      </li>
      <li class="relatorio-item">
        <span class="relatorio-item-label">Saldo atual</span>
        <span class="relatorio-item-value ${saldo >= 0 ? 'neutro' : 'negativo'}">${fmt(saldo)}</span>
      </li>
      <li class="relatorio-item">
        <span class="relatorio-item-label">Transações registradas</span>
        <span class="relatorio-item-value">${total}</span>
      </li>
      ${saidas > 0 ? `
      <li class="relatorio-item">
        <span class="relatorio-item-label">Taxa de comprometimento</span>
        <span class="relatorio-item-value ${saidas/entradas > 0.8 ? 'negativo' : 'neutro'}">
          ${entradas > 0 ? ((saidas / entradas) * 100).toFixed(1) + '%' : '—'}
        </span>
      </li>` : ''}
    `;

    /* Categorias */
    const mapaCateg = {};
    transacoes.filter(t => t.tipo === 'saida').forEach(t => {
      const c = t.categoria || 'outros';
      mapaCateg[c] = (mapaCateg[c] || 0) + t.valor;
    });

    const categList = Object.entries(mapaCateg)
      .sort((a, b) => b[1] - a[1]);

    const maxVal = categList[0]?.[1] || 1;
    const catEl  = document.getElementById('relatorioCategorias');

    if (categList.length === 0) {
      catEl.innerHTML = '<li class="relatorio-item"><span class="relatorio-item-label">Nenhuma saída registrada.</span></li>';
    } else {
      catEl.innerHTML = categList.slice(0, 6).map(([k, v]) => `
        <li class="relatorio-item" style="flex-direction:column; align-items:flex-start; gap:6px;">
          <div class="relatorio-bar-wrap">
            <div class="relatorio-bar-meta">
              <span>${categoriaEmoji[k]} ${categoriaLabel[k] || k}</span>
              <span style="color:var(--saida)">${fmt(v)}</span>
            </div>
            <div class="relatorio-bar-track">
              <div class="relatorio-bar-fill" style="width:${((v / maxVal) * 100).toFixed(1)}%"></div>
            </div>
          </div>
        </li>
      `).join('');
    }

    /* Maiores despesas */
    const maiores = [...transacoes]
      .filter(t => t.tipo === 'saida')
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);

    const maioresEl = document.getElementById('relatorioMaiores');
    if (maiores.length === 0) {
      maioresEl.innerHTML = '<li class="relatorio-item"><span class="relatorio-item-label">Nenhuma saída registrada.</span></li>';
    } else {
      maioresEl.innerHTML = maiores.map((t, i) => `
        <li class="relatorio-item">
          <span style="color:var(--muted); font-size:13px; min-width:20px;">#${i+1}</span>
          <span class="relatorio-item-label">${categoriaEmoji[t.categoria] || '📦'} ${t.descricao}</span>
          <span class="relatorio-item-value negativo">${fmt(t.valor)}</span>
        </li>
      `).join('');
    }
  };

  /* ── Atualizar tudo ── */
  const atualizarTudo = () => {
    atualizarCards();
    atualizarGraficoLinha();
    atualizarGraficoPizza();
    renderizarRecente();
    renderizarLista();
  };

  /* ── Init ── */
  const init = () => {
    carregar();

    // data atual
    const dataEl = document.getElementById('dataAtual');
    if (dataEl) {
      dataEl.textContent = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    }

    // data padrão no form
    const dataForm = document.getElementById('dataTransacao');
    if (dataForm) dataForm.value = hoje();

    // navegação pelo sidebar
    document.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', () => {
        const section = item.dataset.section;
        if (section) navegarPara(section);
      });
    });

    atualizarTudo();
  };

  document.addEventListener('DOMContentLoaded', init);

  // expor publicamente
  return { adicionar, excluir, limparTudo, atualizarTudo, renderizarLista, navegarPara };

})();
