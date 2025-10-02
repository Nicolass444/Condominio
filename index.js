const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});


app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});


app.use(express.static(__dirname));


const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'condominio',
  waitForConnections: true,
  connectionLimit: 10,
});

(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('✅ MySQL conectado (condominio)');
  } catch (err) {
    console.error('❌ Falha ao conectar MySQL:', err.message);
    process.exit(1);
  }
})();


app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));


app.get(/^\/(?!api\/).*/i, (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


async function cadastrarBloco(req, res) {
  const { nome } = req.body;
  if (!nome) return res.status(400).send('nome é obrigatório');
  try {
    const conn = await pool.getConnection();
    await conn.query('INSERT INTO blocos (nome) VALUES (?)', [nome]);
    conn.release();
    return res.redirect('/blocos');
  } catch (e) {
    console.error(e);
    return res.status(400).send('Erro ao cadastrar bloco');
  }
}
app.post('/cadastrar-bloco', cadastrarBloco);
app.post('/cadastrar-blocos', cadastrarBloco); 


async function cadastrarApartamento(req, res) {
  const { numero, bloco_id } = req.body;
  if (!numero || !bloco_id) return res.status(400).send('numero e bloco_id são obrigatórios');
  try {
    const conn = await pool.getConnection();
    await conn.query('INSERT INTO apartamentos (bloco_id, numero) VALUES (?,?)', [bloco_id, numero]);
    conn.release();
    return res.redirect('/apartamentos');
  } catch (e) {
    console.error(e);
    return res.status(400).send('Erro ao cadastrar apartamento');
  }
}
app.post('/cadastrar-apartamento', cadastrarApartamento);
app.post('/cadastrar-apartamentos', cadastrarApartamento); 

async function cadastrarMorador(req, res) {
  const { nome, apartamento, bloco, telefone } = req.body;
  if (!nome || !apartamento || !bloco) return res.status(400).send('nome, apartamento e bloco são obrigatórios');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    
    const [bRows] = await conn.query('SELECT id FROM blocos WHERE nome = ?', [bloco]);
    let blocoId = bRows[0]?.id;
    if (!blocoId) {
      const [insB] = await conn.query('INSERT INTO blocos (nome) VALUES (?)', [bloco]);
      blocoId = insB.insertId;
    }

  
    const [aRows] = await conn.query('SELECT id FROM apartamentos WHERE bloco_id=? AND numero=?', [blocoId, apartamento]);
    let aptoId = aRows[0]?.id;
    if (!aptoId) {
      const [insA] = await conn.query('INSERT INTO apartamentos (bloco_id, numero) VALUES (?,?)', [blocoId, apartamento]);
      aptoId = insA.insertId;
    }

    await conn.query(
      'INSERT INTO moradores (nome, bloco_id, apartamento_id, telefone, email) VALUES (?,?,?,?,?)',
      [nome, blocoId, aptoId, telefone || null, null]
    );

    await conn.commit();
    return res.redirect('/moradores');
  } catch (e) {
    await conn.rollback();
    console.error(e);
    return res.status(400).send('Erro ao cadastrar morador');
  } finally {
    conn.release();
  }
}
app.post('/cadastrar-morador', cadastrarMorador);
app.post('/cadastrar-moradores', cadastrarMorador);


async function cadastrarTipoManutencao(req, res) {
  const { nome } = req.body;
  if (!nome) return res.status(400).send('nome é obrigatório');
  try {
    const conn = await pool.getConnection();
    await conn.query('INSERT INTO tipos_manutencao (nome) VALUES (?)', [nome]);
    conn.release();
    return res.redirect('/tipos-manutencao');
  } catch (e) {
    console.error(e);
    return res.status(400).send('Erro ao cadastrar tipo de manutenção');
  }
}
app.post('/cadastrar-tipo-manutencao', cadastrarTipoManutencao);
app.post('/cadastrar-tipos-manutencao', cadastrarTipoManutencao); 


async function cadastrarPagamento(req, res) {
  const morador_id    = req.body.morador_id === '' ? null : Number(req.body.morador_id);
  const valor         = req.body.valor === '' ? null : Number(req.body.valor);
  const data_pagamento= String(req.body.data_pagamento || '').trim();
  if (!morador_id || !valor || !data_pagamento)
    return res.status(400).send('morador_id, valor e data_pagamento são obrigatórios');

  const referencia = data_pagamento.slice(0,7); // AAAA-MM

  try {
    const conn = await pool.getConnection();
    await conn.query(
      'INSERT INTO pagamentos (morador_id, valor, data_pagamento, referencia) VALUES (?,?,?,?)',
      [morador_id, valor, data_pagamento, referencia]
    );
    conn.release();
    return res.redirect('/registro-pagamento');
  } catch (e) {
    console.error(e);
    return res.status(400).send('Erro ao registrar pagamento');
  }
}
app.post('/cadastrar-pagamento', cadastrarPagamento);
app.post('/cadastrar-registro-pagamento', cadastrarPagamento);



async function cadastrarManutencao(req, res) {
  const { descricao, data, custo, tipo_id } = req.body; 
  if (!tipo_id || !data || !descricao)
    return res.status(400).send('tipo_id, data e descricao são obrigatórios');
  try {
    const conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO manutencoes (tipo_manutencao_id, bloco_id, apartamento_id, data, responsavel, observacao)
       VALUES (?,?,?,?,?,?)`,
      [Number(tipo_id), null, null, data, 'N/D', descricao]
    );
    conn.release();
    return res.redirect('/manutencoes-realizadas');
  } catch (e) {
    console.error(e);
    return res.status(400).send('Erro ao cadastrar manutenção');
  }
}
app.post('/cadastrar-manutencao', cadastrarManutencao);
app.post('/cadastrar-manutencoes-realizadas', cadastrarManutencao);

async function list(res, sql, params = []) {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(sql, params);
    conn.release();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao listar' });
  }
}
async function getOne(res, sql, id) {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(sql, [id]);
    conn.release();
    if (!rows.length) return res.status(404).json({ error: 'Não encontrado' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao consultar' });
  }
}
async function run(res, sql, params = [], okMsg = 'OK') {
  try {
    const conn = await pool.getConnection();
    const [result] = await conn.query(sql, params);
    conn.release();
    res.json({ message: okMsg, affectedRows: result.affectedRows, insertId: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || 'Erro na operação' });
  }
}

app.get('/api/blocos', async (req, res) => {
  const q = (req.query.q || '').trim();
  const where = q ? 'WHERE nome LIKE ?' : '';
  const params = q ? [`%${q}%`] : [];
  await list(res, `SELECT * FROM blocos ${where} ORDER BY nome`, params);
});


const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));
