const fs = require('fs');
const { exec } = require('child_process');

const caminhoPagamento = "C:\\Users\\wital\\PROGRAMACAO\\impressateste\\pagamento.txt";

exports.imprimirPagamento = (req, res) => {
    const pagamento = req.body;

    if (!pagamento || !pagamento.valorTotal || !pagamento.valorPago || !pagamento.cpf || !pagamento.nomeCliente || !pagamento.data || !pagamento.hora || !pagamento.fatura) {
        return res.status(400).json({ erro: "Dados inválidos!" });
    }

    // Cálculo do saldo devedor
    const saldoDevedor = pagamento.valorTotal - pagamento.valorPago;

    // Função para formatar número para moeda brasileira
    function formatarNumero(valor) {
        return parseFloat(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    }

    const comprovantePagamento = `
**************************************************
            COMPROVANTE DE PAGAMENTO               
**************************************************

Cliente: ${pagamento.nomeCliente}  
CPF: ${pagamento.cpf}  
Data: ${pagamento.data}   Hora: ${pagamento.hora}  

--------------------------------------------------
CONTA REFERENTE A:  
Fatura: ${pagamento.fatura} - ${pagamento.referenciaMesAno}  

Valor Total:        R$ ${formatarNumero(pagamento.valorTotal)}  
Valor Pago:         R$ ${formatarNumero(pagamento.valorPago)}  
Saldo Devedor:      R$ ${formatarNumero(saldoDevedor)}  

Forma de Pagamento: ${pagamento.metodo}  
--------------------------------------------------
ATENÇÃO: Ainda há um saldo pendente de R$ ${formatarNumero(saldoDevedor)}  
--------------------------------------------------

**************************************************
              OBRIGADO POR SUA PREFERÊNCIA!       
**************************************************
`;

    fs.writeFileSync(caminhoPagamento, comprovantePagamento, 'utf-8');
    exec(`powershell.exe Start-Process -FilePath "${caminhoPagamento}" -Verb Print`, (error) => {
        if (error) {
            console.error(`Erro ao imprimir: ${error.message}`);
            return res.status(500).json({ erro: "Erro ao imprimir!" });
        }

        res.json({ mensagem: "Comprovante de pagamento impresso com sucesso!" });
    });
};
