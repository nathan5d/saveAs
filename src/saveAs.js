/*
* SaveAs.js
*
* By Nathan Amaral
*
* License : (MIT)
*/
// The one and only way of getting global scope in all environments
var _global = typeof window === 'object' && window.window === window
    ? window : typeof self === 'object' && self.self === self
        ? self : typeof global === 'object' && global.global === global
            ? global
            : this

// Função para verificar se o navegador é um WebView do macOS
function isMacOSWebView() {
    return _global.navigator && /Macintosh/.test(navigator.userAgent) && /AppleWebKit/.test(navigator.userAgent) && !/Safari/.test(navigator.userAgent)
}

// Função para adicionar BOM (Byte Order Mark) se necessário
function addBOM(blob, opts) {
    if (typeof opts === 'undefined') opts = { autoBom: false }
    else if (typeof opts !== 'object') {
        console.warn('Deprecated: Expected third argument to be a object')
        opts = { autoBom: !opts }
    }

    // Prepend BOM for UTF-8 XML and text/* types (including HTML)
    // Note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
    if (opts.autoBom && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
        return new Blob([String.fromCharCode(0xFEFF), blob], { type: blob.type })
    }
    return blob
}

// Função para baixar um arquivo
function download(url, name, opts) {
    var xhr = new XMLHttpRequest()
    xhr.open('GET', url)
    xhr.responseType = 'blob'
    xhr.onload = function () {
        saveAs(xhr.response, name, opts)
    }
    xhr.onerror = function () {
        console.error('could not download file')
    }
    xhr.send()
}

// Função para verificar se CORS está habilitado para uma URL
function isCORSEnabled(url) {
    var xhr = new XMLHttpRequest()
    // Use sync to avoid popup blocker
    xhr.open('HEAD', url, false)
    try {
        xhr.send()
    } catch (e) { }
    return xhr.status >= 200 && xhr.status <= 299
}

// Função para disparar um evento de clique em um elemento
function simulateClick(node) {
    try {
        node.dispatchEvent(new MouseEvent('click'))
    } catch (e) {
        var evt = document.createEvent('MouseEvents')
        evt.initMouseEvent('click', true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null)
        node.dispatchEvent(evt)
    }
}

// Função principal para salvar um arquivo
var saveAs = _global.saveAs || (
    // Provavelmente em algum web worker
    (typeof window !== 'object' || window !== _global)
        ? function saveAs() { /* noop */ }

        // Use o atributo 'download' primeiro, se possível, a menos que seja um WebView do macOS
        : ('download' in HTMLAnchorElement.prototype && !isMacOSWebView())
            ? function saveAs(blob, name, opts) {
                var URL = _global.URL || _global.webkitURL
                var a = document.createElementNS('http://www.w3.org/1999/xhtml', 'a')
                name = name || blob.name || 'download'

                a.download = name
                a.rel = 'noopener' // tabnabbing

                if (typeof blob === 'string') {
                    // Suporte para links regulares
                    a.href = blob
                    if (a.origin !== location.origin) {
                        isCORSEnabled(a.href)
                            ? download(blob, name, opts)
                            : simulateClick(a, a.target = '_blank')
                    } else {
                        simulateClick(a)
                    }
                } else {
                    // Suporte para blobs
                    a.href = URL.createObjectURL(blob)
                    setTimeout(function () { URL.revokeObjectURL(a.href) }, 4E4) // 40s
                    setTimeout(function () { simulateClick(a) }, 0)
                }
            }

            // Use msSaveOrOpenBlob como segunda abordagem
            : 'msSaveOrOpenBlob' in navigator
                ? function saveAs(blob, name, opts) {
                    name = name || blob.name || 'download'

                    if (typeof blob === 'string') {
                        if (isCORSEnabled(blob)) {
                            download(blob, name, opts)
                        } else {
                            var a = document.createElement('a')
                            a.href = blob
                            a.target = '_blank'
                            setTimeout(function () { simulateClick(a) })
                        }
                    } else {
                        navigator.msSaveOrOpenBlob(addBOM(blob, opts), name)
                    }
                }

                // Fallback para usar FileReader e um popup
                : function saveAs(blob, name, opts, popup) {
                    // Abra um popup imediatamente para contornar o bloqueador de popups
                    // Principalmente disponível na interação do usuário e o fileReader é assíncrono então...
                    popup = popup || open('', '_blank')
                    if (popup) {
                        popup.document.title = popup.document.body.innerText = 'downloading...'
                    }

                    if (typeof blob === 'string') return download(blob, name, opts)

                    var force = blob.type === 'application/octet-stream'
                    var isSafari = /constructor/i.test(_global.HTMLElement) || _global.safari
                    var isChromeIOS = /CriOS\/[\d]+/.test(navigator.userAgent)

                    if ((isChromeIOS || (force && isSafari) || isMacOSWebView()) && typeof FileReader !== 'undefined') {
                        // O Safari não permite o download de URLs de blob
                        var reader = new FileReader()
                        reader.onloadend = function () {
                            var url = reader.result
                            url = isChromeIOS ? url : url.replace(/^data:[^;]*;/, 'data:attachment/file;')
                            if (popup) popup.location.href = url
                            else location = url
                            popup = null // reverse-tabnabbing #460
                        }
                        reader.readAsDataURL(blob)
                    } else {
                        var URL = _global.URL || _global.webkitURL
                        var url = URL.createObjectURL(blob)
                        if (popup) popup.location = url
                        else location.href = url
                        popup = null // reverse-tabnabbing #460
                        setTimeout(function () { URL.revokeObjectURL(url) }, 4E4) // 40s
                    }
                }
)

// Torna a função saveAs global
_global.saveAs = saveAs.saveAs = saveAs

// Exporta a função saveAs se estiver em um ambiente de módulo
if (typeof module !== 'undefined') {
    module.exports = saveAs;
}
