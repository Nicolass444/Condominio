document.addEventListener("DOMContentLoaded", () => {
    const btnCadastrar = document.querySelector(".btn-cadastrar");
    const btnEditar = document.querySelector(".btn-editar");
    const btnExcluir = document.querySelector(".btn-excluir");
  
  
    const tables = document.querySelectorAll("table");
  
  
    
    const pagina = window.location.pathname.split("/").pop();
  
  
    
    if (btnCadastrar) {
      btnCadastrar.addEventListener("click", () => {
        switch (pagina) {
          case "moradores.html":
            window.location.href = "cadastro-morador.html";
            break;
          case "tipos-manutencao.html":
            window.location.href = "cadastro-tipo-manutencao.html";
            break;
          case "manutencoes-realizadas.html":
            window.location.href = "cadastro-manutencao.html";
            break;
          case "registro-pagamento.html":
            window.location.href = "cadastro-pagamento.html";
            break;
          default:
            alert("Página de cadastro não definida!");
        }
      });
    }
  
  

    function editarItem(event) {
      const row = event.target.closest("tr");
      if (!row) return;
  
  

      for (let i = 0; i < row.cells.length - 1; i++) {
        const valorAtual = row.cells[i].innerText;
        const novoValor = prompt(`Editar valor:`, valorAtual);
        if (novoValor) row.cells[i].innerText = novoValor;
      }
      alert("Item atualizado!");
    }
  
  
 
    function excluirItem(event) {
      const row = event.target.closest("tr");
      if (!row) return;
  
  
      const nome = row.cells[0] ? row.cells[0].innerText : "item";
      if (confirm(`Deseja realmente excluir ${nome}?`)) {
        row.remove();
        alert(`${nome} excluído!`);
      }
    }
  
  
  
    if (btnEditar) {
      btnEditar.addEventListener("click", () => {
        if (tables.length === 0) {
          alert("Nenhum item para editar nesta página!");
          return;
        }
  
  
        const numero = prompt("Digite o identificador do item que deseja editar:");
        tables.forEach(table => {
          const rows = Array.from(table.querySelectorAll("tr:not(:first-child)"));
          const row = rows.find(r => r.cells[0].innerText === numero);
          if (row) {
       
            editarItem({ target: row.querySelector("td") });
          } else {
            alert("Item não encontrado!");
          }
        });
      });
    }
  
  
    if (btnExcluir) {
      btnExcluir.addEventListener("click", () => {
        if (tables.length === 0) {
          alert("Nenhum item para excluir nesta página!");
          return;
        }
  
  
        const numero = prompt("Digite o identificador do item que deseja excluir:");
        tables.forEach(table => {
          const rows = Array.from(table.querySelectorAll("tr:not(:first-child)"));
          const row = rows.find(r => r.cells[0].innerText === numero);
          if (row) {
            excluirItem({ target: row.querySelector("td") });
          } else {
            alert("Item não encontrado!");
          }
        });
      });
    }
  
  
    document.querySelectorAll(".editBtn").forEach(btn => btn.addEventListener("click", editarItem));
    document.querySelectorAll(".deleteBtn").forEach(btn => btn.addEventListener("click", excluirItem));
  });
  
