const express = require('express');
const cupomController = require('../controllers/cupomController');

const router = express.Router();

router.post('/imprimir-cupom', cupomController.imprimirCupom);

module.exports = router;
