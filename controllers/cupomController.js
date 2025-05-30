const fs = require('fs');
const { exec } = require('child_process');

const caminhoCupom = "C:\\Users\\wital\\PROGRAMACAO\\impressateste\\cupom.txt";

exports.imprimirCupom = (req, res) => {
    const { produtos, detalhesFatura } = req.body;
    const { nome_cliente, valor_fatura = '0', nome_funcionario, desconto = '0', entrada = '0', tipo_pagamento = 'Desconhecido', codigo_fatura, data_compra, valor_pago = '0',forma_pagamento } = detalhesFatura[0];

    console.log(produtos);
    console.log(nome_cliente);
    console.log(data_compra);

    const dataOriginal = new Date(data_compra);
    const formatoSimples = dataOriginal.toISOString().replace('T', ' ').slice(0, 19);

    function formatarNumero(valor) {
        // Converte para número, caso seja string
        const numero = parseFloat(valor);
        
        // Usa toLocaleString para formato brasileiro
        return numero.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    }

    // Cálculo do troco
    const valorFinal = (parseFloat(valor_fatura) || 0) - (parseFloat(desconto) || 0) - (parseFloat(entrada) || 0);
    const troco = (parseFloat(valor_pago) || 0) - valorFinal;

    const comprovante = `
==========================================
  A N S E L M O   A U T O   P E Ç A S
==========================================
CNPJ: 05.771.085/0001-25   IE: 12.207.801-2
RUA DUQUE DE CAXIAS, 385 - BURITI BRAVO - MA
FONE: (99) 98447-4844
===========================================

FATURA: ${codigo_fatura}   DATA: ${formatoSimples}
-------------------------------------------
CLIENTE: ${nome_cliente}
-------------------------------------------

DESCRIÇÃO               QTD   UNIT.   TOTAL
--------------------------------------------
${produtos.map(item =>
    `${(item.descricao_produto || '').padEnd(30)} ${String(item.quantidade || '0').padEnd(2)} X R$ ${String(formatarNumero(item.preco_unitario || '0')).padEnd(10)} R$ ${String(formatarNumero(item.valor_produto || '0'))}`
).join('\n')}

--------------------------------------------
**RESUMO FINANCEIRO**  
--------------------------------------------
🛒 Quantidade itens: ${produtos.length}
💰 Total: R$ ${formatarNumero(valor_fatura)}
🔻 Desconto: R$ ${formatarNumero(desconto)}
💳 Entrada: R$ ${formatarNumero(entrada)}
🛍️ Valor Final: R$ ${formatarNumero(valorFinal)}
--------------------------------------------

VENDEDOR: ${nome_funcionario}
============================================
    Obrigado pela preferência!
============================================
`;

    // fs.writeFileSync(caminhoCupom, comprovante, 'utf-8');
    // exec(`powershell.exe Start-Process -FilePath "${caminhoCupom}" -Verb Print`, (error) => {
    //     if (error) {
    //         console.error(`Erro ao imprimir: ${error.message}`);
    //         return res.status(500).json({ erro: "Erro ao imprimir!" });
    //     }

    //     res.json({ mensagem: "Cupom impresso com sucesso!" });
    // });
    console.log(comprovante)
};
