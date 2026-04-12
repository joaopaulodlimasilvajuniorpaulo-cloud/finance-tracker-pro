let transacoes = [];
let chart;

function adicionar(tipo) {
  const descricao = document.getElementById("descricao").value;
  const valor = Number(document.getElementById("valor").value);

  if (!descricao || !valor) {
    alert("Preencha os dados!");
    return;
  }

  transacoes.push({ descricao, valor, tipo });

  document.getElementById("descricao").value = "";
  document.getElementById("valor").value = "";
  document.getElementById("descricao").focus();

  atualizar();
}

function atualizar() {
  let entradas = 0;
  let saidas = 0;

  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  transacoes.forEach(t => {
    if (t.tipo === "entrada") entradas += t.valor;
    else saidas += t.valor;

    const item = document.createElement("li");
    item.innerText = `${t.descricao} - R$ ${t.valor}`;
    lista.appendChild(item);
  });

  const saldo = entradas - saidas;

  document.getElementById("entradas").innerText = `R$ ${entradas}`;
  document.getElementById("saidas").innerText = `R$ ${saidas}`;
  document.getElementById("saldo").innerText = `R$ ${saldo}`;

  atualizarGrafico(entradas, saidas);
}

function atualizarGrafico(entradas, saidas) {
  const ctx = document.getElementById("grafico");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Entradas", "Saídas"],
      datasets: [{
        data: [entradas, saidas],
        backgroundColor: ["#22c55e", "#ef4444"]
      }]
    }
  });
}

function activateSection(sectionId) {
  document.querySelectorAll('.page-section').forEach(section => {
    section.classList.toggle('active', section.id === sectionId);
  });
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.toggle('active', item.dataset.section === sectionId);
  });
}

document.addEventListener("DOMContentLoaded", function() {
  const sidebarMenu = document.getElementById("sidebarMenu");
  const menuItems = document.querySelectorAll('.menu-item');

  menuItems.forEach(item => {
    item.addEventListener('click', function() {
      activateSection(this.dataset.section);
    });
  });
});
