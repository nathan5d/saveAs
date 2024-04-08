# saveAs.js

## Descrição
O `saveAs.js` é uma biblioteca JavaScript que oferece uma maneira simplificada de permitir que os usuários baixem arquivos de forma programática a partir do navegador.

## Como usar
1. Baixe o arquivo `saveAs.js` e inclua-o em seu projeto.
2. Importe ou inclua o `saveAs.js` em seu arquivo HTML.
3. Use a função `saveAs` para baixar arquivos conforme necessário em seu código JavaScript.

## Exemplo de uso
```javascript
saveAs(blob, fileName, options);
```
## Parâmetros
1. ```blob:``` O blob ou URL do arquivo a ser baixado.
2. ```fileName:``` O nome do arquivo a ser usado para o download.
3. ```options (opcional):``` Opções adicionais para o download, como autoBom para adicionar o BOM (Byte Order Mark).

## Exemplo prático

```javascript
var blob = new Blob(["Hello, world!"], { type: "text/plain;charset=utf-8" });
saveAs(blob, "hello.txt");
```