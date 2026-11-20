const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const source = path.join(root, '.lowtrack-reference', 'index.html');
const html = fs.readFileSync(source, 'utf8');
const style = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1];
const fontCssPath = path.join(root, '.lowtrack-reference', '_external', 'fonts.googleapis.com', 'css2-q-92476b7291');
const fontCss = fs.readFileSync(fontCssPath, 'utf8').replaceAll('../fonts.gstatic.com/', '/landing/fonts.gstatic.com/');
const bodyStart = html.indexOf('<body');
const bodyOpenEnd = html.indexOf('>', bodyStart) + 1;
let markup = html.slice(bodyOpenEnd, html.indexOf('</body>', bodyOpenEnd));

if (!style || bodyStart < 0) throw new Error('Landing de referência incompleta.');

const initScript = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
  .find(([, attrs, code]) => !attrs.includes('type=') && code.includes('LowTrack landing: menu'))?.[2];
if (!initScript) throw new Error('Script de interações da landing não encontrado.');
const initBody = initScript
  .replace(/^\s*\/\*[\s\S]*?\*\/\s*\(function\s*\(\)\s*\{\s*['"]use strict['"];?/, '')
  .replace(/\}\s*\)\s*\(\);\s*$/, '')
  .replace('watch(ph, loop, function () { seq++; }, 0.45);', 'watch(ph, loop, function () { seq++; }, 0.2);');

markup = markup
  .replace(/<script(?![^>]*application\/json)[^>]*>[\s\S]*?<\/script>/gi, '')
  .replaceAll('LowTrack', 'Analisa ROI')
  .replaceAll('lowtrack', 'analisa roi')
  .replaceAll('images/landing/', '/landing/')
  .replaceAll('images/celular.png', '/landing/celular.png')
  .replace(/<img src="images\/logo-(?:lowtrack|analisa roi)-dark\.png" alt="Analisa ROI" width="400" height="100">/g,
    '<img src="/brand/analisa-roi-mark.svg" alt="" width="34" height="34"><b>ANALISA ROI</b>')
  .replace('<div class="shot__frame"><img src="/landing/painel-q-636164f966.webp"',
    '<div class="shot__frame"><img src="/landing/painel-analisa-roi.png"')
  .replace('width="2000" height="857" fetchpriority="high"></div>',
    'width="1915" height="821" fetchpriority="high"></div>')
  .replace('src="/landing/celular.png" alt="App da Analisa ROI no celular com gasto, lucro, CPA, vendas e ROAS de cada campanha" width="1080" height="1920" loading="lazy" decoding="async">',
    'src="/landing/celular-campanhas-analisa-roi.png" alt="Tela de campanhas da Analisa ROI em um celular" width="941" height="1672" loading="lazy" decoding="async">')
  .replace(/<p class="ap__nt"[\s\S]*?<\/p>/,
    '<p class="ap__nt is-off" id="apNt" aria-hidden="true"><img src="/brand/analisa-roi-mark.svg" alt="" width="34" height="34"><b>Venda aprovada!</b><time>agora</time><span class="ap__ntb">R$ 12,90 · Campanha #1</span></p>')
  .replaceAll('href="#app"', 'href="#mobile-app"')
  .replace('<section class="sec" id="app" aria-labelledby="app-t">', '<section class="sec" id="mobile-app" aria-labelledby="app-t">')
  .replace(/href=""(?= class="logo")/g, 'href="#/"')
  .replace(/href="login"/g, 'href="#/cadastro"')
  .replace(/href="app"/g, 'href="#/app/dashboard"')
  .replace(/href="terms"/g, 'href="#/termos"')
  .replace(/href="privacy"/g, 'href="#/privacidade"')
  .replace(/href="docs\/webhook"/g, 'href="#/app/integracoes"')
  .replace(/href="https:\/\/apps\.apple\.com[^"]*"/g, 'href="#/app/integracoes"')
  .replace(/href="app"/g, 'href="#/app/integracoes"')
  .replace(/Testar 7 dias grátis/gi, 'Explorar demonstração')
  .replace(/Mais de 3 mil gestores e produtores usam a Analisa ROI/gi, 'Prévia local · dados demonstrativos')
  .replace(/Seu tracking, sem taxa por venda\./, 'Sua operação, com mais clareza.')
  .replace(/Vendas completas na Meta deixam seu CPA mais barato e o ROI maior\. E o painel mostra o lucro de cada anúncio\./,
    'Acompanhe campanhas, vendas e resultado estimado em uma única leitura. Esta prévia usa dados locais e não se conecta a contas externas.')
  .replace(/Seu lucro <span class="soft">no bolso\.<\/span>/, 'Sua operação <span class="soft">em movimento.</span>')
  .replace(/Cada venda avisa no celular\. Gasto, lucro e ROAS de cada campanha, sem abrir o Gerenciador\./,
    'Veja como os indicadores da demonstração podem ser consultados no celular. Os dados e avisos são ilustrativos.')
  .replace(/Baixar na App Store/g, 'Abrir prévia mobile')
  .replace(/Baixar para Android/g, 'Ver demonstração')
  .replace(/R\$ 0 de taxa por venda/g, 'Sem cobrança nesta demonstração')
  .replace(/Você paga a mensalidade e vende quanto quiser\. No low ticket, centavo por venda vira milhares no fim do mês\./,
    'Compare os valores de referência dos planos com um volume demonstrativo de vendas. Nenhuma contratação ou cobrança é iniciada.')
  .replace(/Comparado ao utmf\*\*\* e trackf\*\*\*, fica com você por mês/g, 'Estimativa ilustrativa do valor mensal do plano/g')
  .replace(/Taxa por venda, todo mês/g, 'Custo demonstrativo por venda/g')
  .replace(/LowTrack Pro, todo mês/g, 'Plano Pro de referência/g')
  .replace(/Em um ano/g, 'Em doze meses/g')
  .replace(/R\$ 0 de taxa por venda/g, 'Sem cobrança nesta demonstração')
  .replace(/Cada venda sai do nosso servidor direto pra Meta, com os dados do comprador criptografados\. A Meta entende quem compra, e o seu anúncio fica mais barato\./,
    'A seção apresenta o fluxo previsto para eventos de venda. A integração com a Meta ainda não está ativa nesta demonstração.')
  .replace(/Nota 9\.3 no seu pixel\./, 'Acompanhe a qualidade dos eventos.')
  .replace(/Bateu a meta, ganhou placa\./, 'Acompanhe cada etapa da sua jornada.')
  .replace(/De R\$ 10 mil a R\$ 1 milhão em vendas\. Peça a sua e receba em casa\./,
    'Metas ilustrativas de faturamento. As placas exibidas são parte da demonstração e não representam benefícios físicos disponíveis.')
  .replace(/Mais escolhido/g, 'Plano de referência')
  .replace(/Testar 7 dias grátis/g, 'Explorar demonstração');

markup = markup.replace(/<figure class="pz__card">/g,
  '<figure class="pz__card rebrand-plaque"><span class="rebrand-plaque-mark"><img src="/brand/analisa-roi-mark.svg" alt=""><b>ANALISA ROI</b></span>');

// Keep the reference UI styles isolated from the application workspace.
function scopeCss(css) {
  let out = '';
  let i = 0;
  while (i < css.length) {
    let j = i;
    let quote = '';
    let parens = 0;
    while (j < css.length) {
      const c = css[j];
      if (quote) { if (c === '\\') j++; else if (c === quote) quote = ''; }
      else if (c === '"' || c === "'") quote = c;
      else if (c === '(') parens++;
      else if (c === ')') parens--;
      else if (!parens && (c === '{' || c === ';')) break;
      j++;
    }
    if (j >= css.length) { out += css.slice(i); break; }
    const head = css.slice(i, j).trim();
    if (css[j] === ';') { out += css.slice(i, j + 1); i = j + 1; continue; }
    let depth = 1, k = j + 1, innerQuote = '';
    while (k < css.length && depth) {
      const c = css[k];
      if (innerQuote) { if (c === '\\') k++; else if (c === innerQuote) innerQuote = ''; }
      else if (c === '"' || c === "'") innerQuote = c;
      else if (c === '{') depth++;
      else if (c === '}') depth--;
      k++;
    }
    const body = css.slice(j + 1, k - 1);
    if (/^@(media|supports|container|layer|document)\b/i.test(head)) out += `${head}{${scopeCss(body)}}`;
    else if (/^@(?:-\w+-)?keyframes\b/i.test(head) || /^@font-face\b/i.test(head)) out += `${head}{${body}}`;
    else if (head.startsWith('@')) out += `${head}{${body}}`;
    else {
      const scoped = head.split(',').map(selector => {
        const s = selector.trim();
        if (!s) return s;
        if (s === ':root' || s === 'html' || s === 'body.lt') return '.landing-reference';
        if (s.startsWith('html.') || s.startsWith('body.')) return '.landing-reference' + s.slice(s.indexOf('.'));
        return `.landing-reference ${s}`;
      }).join(',');
      out += `${scoped}{${body}}`;
    }
    i = k;
  }
  return out;
}

const outDir = path.join(root, 'public', 'landing');
fs.mkdirSync(outDir, { recursive: true });
for (const name of ['celular.png', 'landing/painel-q-636164f966.webp', 'landing/placa-10k.webp', 'landing/placa-100k.webp', 'landing/placa-500k.webp', 'landing/placa-1m.webp']) {
  const src = path.join(root, '.lowtrack-reference', 'images', name);
  const dest = path.join(outDir, path.basename(name));
  fs.copyFileSync(src, dest);
}
fs.cpSync(path.join(root, '.lowtrack-reference', '_external', 'fonts.gstatic.com'), path.join(outDir, 'fonts.gstatic.com'), { recursive: true });
fs.writeFileSync(path.join(outDir, 'fonts.css'), fontCss, 'utf8');

const brandOverrides = `\n/* Reset shared dashboard utility classes that collide with the imported page. */
.landing-reference .top{display:block!important;width:auto!important;min-width:0!important}
.landing-reference [data-reveal]{opacity:1!important;visibility:visible!important;transform:none!important}.landing-reference .logo{gap:8px}.landing-reference .logo img{width:34px!important;height:34px!important}.landing-reference .logo b{font-size:17px;letter-spacing:-.04em;color:#0b1b3a;white-space:nowrap}.landing-reference .shot__frame{position:relative}.landing-reference .rebrand-screen{position:absolute;left:2.5%;top:3.2%;display:flex;align-items:center;gap:6px;padding:3px 8px;border-radius:8px;background:#f7f9fd;color:#0b1b3a;font-size:12px;font-weight:700}.landing-reference .rebrand-screen img{width:19px;height:19px}.landing-reference .ap__ph{isolation:isolate}.landing-reference .rebrand-phone{position:absolute;left:17.5%;top:10.7%;width:28%;height:3%;display:flex;align-items:center;gap:4px;padding:2px 5px;border-radius:4px;background:#071020;color:#eaf2ff;font-size:clamp(5px,1.25vw,10px);font-weight:700}.landing-reference .rebrand-phone img{width:14px;height:14px}.landing-reference .rebrand-plaque{overflow:hidden}.landing-reference .rebrand-plaque-mark{position:absolute;bottom:11%;left:50%;transform:translateX(-50%);min-width:35%;display:flex;align-items:center;justify-content:center;gap:5px;padding:3px 8px;border-radius:6px;background:#08172a;color:#fff;font-size:9px;white-space:nowrap}.landing-reference .rebrand-plaque-mark img{width:16px;height:16px}.landing-reference .demo-proof{font-size:12px;color:#53657d}\n`;
// Strip source comments before parsing selectors. A leading comment was previously
// carried into the first selector, leaving `.top` unscoped and colliding with the
// dashboard's `.top` toolbar (which expands the landing hero off-screen).
const cleanStyle = style.replace(/\/\*[\s\S]*?\*\//g, '');
const animationOverrides = '\n.landing-reference .ap__ph.is-buzz{animation:buzz .42s linear}\n';
fs.writeFileSync(path.join(root, 'public', 'landing-copy.css'), scopeCss(cleanStyle) + brandOverrides + animationOverrides, 'utf8');
fs.writeFileSync(path.join(root, 'public', 'landing-template.js'),
  `window.ANALISA_LANDING_HTML=${JSON.stringify(markup)};\nwindow.initAnalisaLanding=function(){\nvar mount=document.querySelector('.landing-reference');\nif(!mount||mount.dataset.analisaLandingInitialized==='true')return;\nmount.dataset.analisaLandingInitialized='true';\nwindow.__analisaLandingInitialized=true;\n${initBody}\n};\n`, 'utf8');
