# Centralizar cupom não fiscal na impressão

## Contexto

O cupom não fiscal (venda ou pagamento de OS) é gerado como texto monoespaçado
de largura fixa (46 colunas) por `buildThermalReceipt` em
`lib/receipt-builder.ts`, e impresso via `buildPrintHTML`, que abre uma janela
com esse texto dentro de um `<pre>` e chama `window.print()`.

O HTML de impressão não tem nenhuma regra de centralização horizontal. Em
impressora térmica (bobina ~80mm) isso não é perceptível, porque a página já
tem a largura do conteúdo. Em impressora comum (A4/Carta) o cupom sai colado
na margem esquerda da folha, em vez de centralizado — a loja usa os dois
tipos de impressora dependendo do cliente.

## Problema

Melhorar a apresentação do cupom impresso em impressora comum, sem
prejudicar (ou alterar) a impressão em impressora térmica.

## Solução

Ajustar apenas o CSS embutido no template gerado por `buildPrintHTML`
(`lib/receipt-builder.ts:149-170`):

- Tornar o `body` um container flex que centraliza o `<pre>`
  horizontalmente (`display: flex; justify-content: center;`).
- Manter a largura natural do `<pre>` (não esticar nem truncar o conteúdo).

Esse ajuste é neutro em impressora térmica — como a página já tem
aproximadamente a largura do conteúdo, centralizar não move nada
visivelmente — e resolve o caso da impressora A4, onde o bloco passa a
ficar centralizado na folha.

## Fora de escopo

- `buildThermalReceipt` (o texto do cupom em si) não muda.
- O preview do cupom dentro do modal do app (`os-pay-button.tsx`,
  `whatsapp-receipt-button.tsx`) não muda — é só uma prévia em tela, não o
  que vai para a impressora.
- Mensagem de WhatsApp (`buildWhatsAppMessage`) não muda.

## Arquivos afetados

- `lib/receipt-builder.ts` — função `buildPrintHTML`.

## Teste

Abrir o cupom de impressão (a partir de uma venda ou do pagamento de uma OS)
e conferir, no preview de impressão do navegador, que o bloco do cupom
aparece centralizado horizontalmente na página.
