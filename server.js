const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const WS_PORT = 8080;
const caminhoCupom = "C:\\impressao\\cupom.txt";

// Criar servidor WebSocket
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', (ws) => {
    console.log('Servidor WebSocket do cliente pronto!');

    ws.on('message', (message) => {
        try {
            const dadosCupom = JSON.parse(message);
            console.log(dadosCupom);

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

// Função para formatar valores corretamente
function formatarValor(valor) {
    return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

// Função para formatar cada linha do cupom de forma mais organizada
function formatarLinhaProduto(pro) {
    return `${String(pro.descricao_produto).padEnd(5)} | ${String(pro.quantidade + " UN").padStart(5)} | ${String(formatarValor(pro.preco_unitario)).padStart(5)} | ${String(formatarValor(pro.valor_produto)).padStart(5)}`;
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



// Função para gerar cupom de venda
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
DESCRIÇÃO       | QTD   |  UNIT  |   TOTAL
----------------------------------------------
${produtosFormatados}
----------------------------------------------
RESUMO FINANCEIRO
----------------------------------------------
QUANTIDADE ITENS: ${dados.produtos.length}
TOTAL: R$ ${formatarValor(dados.valorFatura)}
DESCONTO: R$ ${formatarValor(dados.desconto)}
ENTRADA: R$ ${formatarValor(dados.entrada)}
VALOR FINAL: R$ ${formatarValor(valorFatura - (desconto + entrada))}
----------------------------------------------
VENDEDOR: ${dados.vendedor || 'NÃO INFORMADO'}
==============================================
     OBRIGADO PELA PREFERÊNCIA
==============================================
`;
}

// Função para gerar cupom de pagamento
function gerarCupomPagamento(dados) {

const dados = {
    saldoContaCliente: 600,
    nomeCliente:"Witalo Pereira dos Santos",
    data_pagamento:'2025-05-30T14:18:46.000Z',
    valorPagamento: 500,
    valorContaAposPagamento: 100,
    vendedor: "admin",
    faturas:[
        {codigoFatura: 101215, desc:"Quitacao de fatura", valorPago: 300},
        {codigoFatura: 101215, desc:"Haver", valorPago: 200} 
    ],
     
}
    return `
==============================================
 A N S E L M O  M O T O  E  A U T O  P E Ç A S
==============================================
CNPJ: 05.771.085/001-25  IE: 12.207.801-2
RUA DUQUE DE CAXIAS, 385 BURITI BRAVO - MA
FONE: (99) 98447-4844
==============================================
 PAGAMENTO DE CONTA
----------------------------------------------
CLIENTE: ${dados.nomeCliente}
----------------------------------------------

----------------------------------------------
RESUMO FINANCEIRO
----------------------------------------------
QUANTIDADE ITENS: ${dados.produtos.length}
TOTAL: R$ ${formatarValor(dados.valorFatura)}
DESCONTO: R$ ${formatarValor(dados.desconto)}
ENTRADA: R$ ${formatarValor(dados.entrada)}
VALOR FINAL: R$ ${formatarValor(valorFatura - (desconto + entrada))}
----------------------------------------------
VENDEDOR: ${dados.vendedor || 'NÃO INFORMADO'}
==============================================
     OBRIGADO PELA PREFERÊNCIA
==============================================
`;
}

// Função para salvar o cupom e imprimir via PowerShell
function imprimirCupom(texto, ws) {
    console.log(texto);

    // Salvar o cupom no arquivo
    fs.writeFileSync(caminhoCupom, texto, 'utf8');

    console.log(`Cupom salvo em: ${caminhoCupom}`);

    // Comando PowerShell para imprimir via Notepad
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
