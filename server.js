const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const WS_PORT = 8080;
const caminhoCupom = path.join(__dirname, 'cupom.txt');


// Criar servidor WebSocket
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', (ws) => {
    console.log('Servidor WebSocket do cliente pronto!');

    ws.on('message', (message) => {
        try {
            const dadosCupom = JSON.parse(message);

            let impressaoTexto;
            switch (dadosCupom.tipo) {
                case 'cupom_venda':
                    impressaoTexto = gerarCupomVenda(dadosCupom);
                    break;
                case 'cupom_pagamento':
                    impressaoTexto = gerarCupomPagamento(dadosCupom);
                    break;
                default:
                    throw new Error("Tipo de cupom inválido");
            }

            imprimirCupom(impressaoTexto, ws);

        } catch (error) {
            console.error("Erro ao processar cupom:", error);
            ws.send(`Erro ${error.message}`);
        }
    });

    ws.on('close', () => {
        console.log('Cliente desconectado');
    });
});

function formatarValor(valor) {
    return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function truncarTexto(texto, limite) {
    texto = String(texto);
    return texto.length > limite ? texto.substring(0, limite - 1) + '…' : texto;
}

function alinharExtremos(esquerda, direita, larguraTotal = 40) {
    esquerda = String(esquerda).trim();
    direita = String(direita).trim();
    const espacos = larguraTotal - esquerda.length - direita.length;

    if (espacos < 1) {
        return esquerda.substring(0, larguraTotal - direita.length - 1) + ' ' + direita;
    }

    return esquerda + ' '.repeat(espacos) + direita;
}

function formatarLinhaProduto(pro) {
    const nome = truncarTexto(pro.descricao_produto, 20).padEnd(20);
    const qtd = String(pro.quantidade + " UN").padStart(6);
    const unit = formatarValor(pro.preco_unitario).padStart(10);
    const total = formatarValor(pro.valor_produto).padStart(10);
    return `${nome}${qtd}${unit}${total}`;
}

function formatarData(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function gerarCupomVenda(dados) {
    const entrada = Number(dados.entrada);
    const desconto = Number(dados.desconto);
    const valorFatura = Number(dados.valorFatura);

    const produtosFormatados = dados.produtos.map(formatarLinhaProduto).join('\n');

    return `
==============================================
 A N S E L M O  M O T O  E  A U T O  P E Ç A S
==============================================
CNPJ: 05.771.085/001-25  IE: 12.207.801-2
RUA DUQUE DE CAXIAS, 385 BURITI BRAVO - MA
FONE: (99) 98447-4844
==============================================
FATURA: ${dados.codigoFatura}  DATA: ${formatarData(dados.data_compra)}
----------------------------------------------
CLIENTE: ${dados.nomeCliente}
----------------------------------------------
DESCRIÇÃO           QTD    UNIT      TOTAL
----------------------------------------------
${produtosFormatados}
----------------------------------------------
RESUMO FINANCEIRO
----------------------------------------------
QUANTIDADE ITENS: ${dados.produtos.length}
${alinharExtremos('TOTAL:', `R$ ${formatarValor(dados.valorFatura)}`)}
${alinharExtremos('DESCONTO:', `R$ ${formatarValor(dados.desconto)}`)}
${alinharExtremos('ENTRADA:', `R$ ${formatarValor(dados.entrada)}`)}
${alinharExtremos('VALOR FINAL:', `R$ ${formatarValor(valorFatura - (desconto + entrada))}`)}
----------------------------------------------
VENDEDOR: ${dados.vendedor || 'NÃO INFORMADO'}
==============================================
     OBRIGADO PELA PREFERÊNCIA
==============================================
`;
}

function gerarCupomPagamento(dados) {
    const valorPago = Number(dados.totalPago);
    const saldoDevedor = Number(dados.saldoDevedor);
    console.log(dados)

    return `
==============================================
 A N S E L M O  M O T O  E  A U T O  P E Ç A S
==============================================
CNPJ: 05.771.085/001-25  IE: 12.207.801-2
RUA DUQUE DE CAXIAS, 385 BURITI BRAVO - MA
FONE: (99) 98447-4844
==============================================
                ✓ CONFIRMADO
==============================================
        COMPROVANTE DE PAGAMENTO
----------------------------------------------
DATA: ${formatarData(dados.contas[0].data_hora)}
EMITIDO POR: ${dados.empresa || 'ANSELMO MOTO E AUTO PEÇAS'}
----------------------------------------------
CLIENTE: ${dados.nomeCliente}
----------------------------------------------
${alinharExtremos('VALOR PAGO:', `R$ ${formatarValor(valorPago)}`)}
${alinharExtremos('SALDO DEVEDOR:', `R$ ${formatarValor(saldoDevedor)}`)}
----------------------------------------------
FORMA DE PAGAMENTO: ${dados.formaPagamento || 'NÃO INFORMADA'}
----------------------------------------------
${saldoDevedor > 0 ? `⚠ ATENÇÃO: Saldo pendente de R$ ${formatarValor(saldoDevedor)}` : ''}
==============================================
     OBRIGADO POR PREFERIR NOSSOS SERVIÇOS!
==============================================
`;
}

function imprimirCupom(texto, ws) {
    console.log(texto);

    fs.writeFileSync(caminhoCupom, texto, 'utf8');
    const powerShellCommand = `powershell.exe -Command "Start-Process notepad.exe -ArgumentList '/p ${caminhoCupom}'"`;
    exec(powerShellCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erro ao imprimir: ${error.message}`);
            ws.send(`Erro ao imprimir: ${error.message}`);
            return;
        }
        console.log("Impressão enviada com sucesso!");
        ws.send("Impressão enviada com sucesso!");
    });
}

console.log(`Servidor WebSocket do cliente rodando em ws://localhost:${WS_PORT}`);
