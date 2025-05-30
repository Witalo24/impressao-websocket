const express = require('express');
const pagamentoController = require('../controllers/pagamentoController');

const router = express.Router();

router.post('/imprimir-pagamento', pagamentoController.imprimirPagamento);

module.exports = router;
