#!/usr/bin/env python3
"""Zúrich en Navidad – one command after every change:  python3 tests/check.py

1. Data validation (data.js): ids, categories, coordinates, URLs, images, dates, references.
2. Browser smoke + regression tests (Playwright/Chromium): layout on 5 viewports, filters,
   favourites, cards, map, Mi plan (add/drag/keys/remove/persist), sharing, deep links, edge cases.
Exit code 0 = all good. Needs: python3 + playwright (Chromium). No network required
(map tiles and weather may fail offline; that is tolerated).
"""
import collections, functools, http.server, json, os, re, socket, sys, threading, urllib.parse as up

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = []
def ok(name, cond, info=""):
    R.append((bool(cond), name, info))

# ---------- local server (fonts/SW need http, not file://) ----------
def serve():
    s = socket.socket(); s.bind(("127.0.0.1", 0)); port = s.getsockname()[1]; s.close()
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    h = functools.partial(Quiet, directory=ROOT)
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", port), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return f"http://127.0.0.1:{port}/index.html"

VALIDATE = r"""(() => {
  const E = [], ids = PLACES.map(p => p.id), iids = IDEAS.map(i => i.id);
  const dup = a => a.filter((x, i) => a.indexOf(x) !== i);
  if (dup(ids).length) E.push('duplicate place ids: ' + dup(ids));
  if (dup(iids).length) E.push('duplicate idea ids: ' + dup(iids));
  const req = ['id','name','cat','prio','desc','ll','q','dur','ov','hours','price','status'];
  const url = u => !u || /^https?:\/\/[^\s"'<>]+$/.test(u);
  const iso = s => /^\d{4}-\d{2}-\d{2}$/.test(s);
  PLACES.forEach(p => {
    req.forEach(k => { if (p[k] === undefined || p[k] === '') E.push(p.id + ': missing ' + k); });
    if (!/^[a-z0-9-]+$/.test(p.id)) E.push(p.id + ': id must be [a-z0-9-]');
    if (!CATS[p.cat]) E.push(p.id + ': unknown cat ' + p.cat);
    if (!['top','muy','si'].includes(p.prio)) E.push(p.id + ': bad prio');
    if (!['ok','sec','pend'].includes(p.status)) E.push(p.id + ': bad status');
    if (!(Array.isArray(p.ll) && p.ll[0] > 45.8 && p.ll[0] < 47.9 && p.ll[1] > 5.9 && p.ll[1] < 10.6)) E.push(p.id + ': ll outside Switzerland');
    ['web','src','gmap'].forEach(k => { if (!url(p[k])) E.push(p.id + ': bad URL in ' + k); });
    if (p.close && (p.close.length !== 7 || p.close.some(x => x !== null && typeof x !== 'number'))) E.push(p.id + ': close must be 7 numbers/null');
    if (p.open && (!iso(p.open[0]) || !iso(p.open[1]) || !Array.isArray(p.closed))) E.push(p.id + ': open needs 2 ISO dates + closed[]');
    if (p.cat === 'navidad' && !p.open && p.status !== 'pend') E.push(p.id + ': Christmas item without open dates must be status pend');
    if (p.tags && p.tags.some(t => !['cafe','brunch','almuerzo','cena','bar'].includes(t))) E.push(p.id + ': unknown tag');
    if (p.img && !/^img\/[a-z0-9-]+$/.test(p.img)) E.push(p.id + ': img must be img/name');
    if (p.img && !(p.imgCap && PHOTOS[p.img])) E.push(p.id + ': img needs imgCap + a PHOTOS entry (author + source)');
    if (/POC/.test(JSON.stringify(p))) E.push(p.id + ': visible text must not say POC');
  });
  IDEAS.forEach(i => i.stops.forEach(s => { if (!PLACES.some(p => p.id === s)) E.push('idea ' + i.id + ': unknown stop ' + s); }));
  CONFIG.favFirst.forEach(id => { const p = PLACES.find(x => x.id === id); if (!p || !p.poc || !p.img) E.push('CONFIG.favFirst: ' + id + ' missing, not a favourite or without photo'); });
  CONFIG.momentos.forEach(m => { if (m.img && !PHOTOS[m.img]) E.push('CONFIG.momentos: ' + m.id + ' photo without PHOTOS entry'); });
  Object.entries(PHOTOS).forEach(([n, f]) => { if (!(f.by && f.what && /^https:\/\/unsplash\.com\/photos\//.test(f.src))) E.push('PHOTOS ' + n + ': needs by, what and an unsplash.com/photos/ link'); });
  if (/cortes[ií]a de Mike/i.test(JSON.stringify(PLACES))) E.push('credit «cortesía de Mike» is not a valid source');
  CONFIG.topIdeas.forEach(id => { if (!iids.includes(id)) E.push('CONFIG.topIdeas: unknown ' + id); });
  return { errors: E, images: PLACES.filter(p => p.img).map(p => p.img) };
})()"""

CLS = """new Promise(r=>{let s=0;new PerformanceObserver(l=>{for(const e of l.getEntries()) if(!e.hadRecentInput) s+=e.value}).observe({type:'layout-shift',buffered:true});setTimeout(()=>r(s),800)})"""

def main():
    from playwright.sync_api import sync_playwright
    U = serve()
    plan = lambda m: m.evaluate("JSON.parse(localStorage.getItem('zh-plan3'))")
    with sync_playwright() as p:
        b = p.chromium.launch()

        # ---------- 1. data ----------
        m = b.new_page(); m.goto(U); m.wait_for_timeout(500)
        v = m.evaluate(VALIDATE)
        ok("data.js valid", not v["errors"], "; ".join(v["errors"][:8]))
        missing = [f"{i}-{w}.webp" for i in v["images"] for w in (400, 800) if not os.path.exists(os.path.join(ROOT, f"{i}-{w}.webp"))]
        html = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
        missing += [f for f in re.findall(r'(?:src|href|srcset)="((?:img|vendor)/[^" ]+)', html) if not os.path.exists(os.path.join(ROOT, f))]
        sw = open(os.path.join(ROOT, "sw.js"), encoding="utf-8").read()
        missing += [f for f in re.findall(r"'\./([^']+)'", sw) if not os.path.exists(os.path.join(ROOT, f))]
        ok("all referenced files exist (images, vendor, sw CORE)", not missing, missing[:6])
        photos = m.evaluate("Object.keys(PHOTOS)")
        orphans = sorted({re.sub(r"-(400|800|m|d)\.webp$", "", f) for f in os.listdir(os.path.join(ROOT, "img")) if f.endswith(".webp")} - {p[4:] for p in photos})
        ok("every photo in img/ has author + source in PHOTOS", not orphans, orphans)
        m.close()

        # ---------- 2. layout per viewport ----------
        for w, h in ((375, 812), (390, 844), (430, 932), (768, 1024), (1440, 900)):
            c = b.new_context(viewport={"width": w, "height": h}, reduced_motion="reduce"); m = c.new_page(); e = []
            m.on("pageerror", lambda x: e.append(str(x)))
            m.on("console", lambda x: x.type == "error" and "Content Security Policy" in x.text and e.append(x.text))
            m.goto(U); m.wait_for_timeout(1300)
            hero = m.evaluate("document.getElementById('inicio').offsetHeight")
            ok(f"{w}px no horizontal overflow", m.evaluate("document.documentElement.scrollWidth <= innerWidth"))
            ok(f"{w}px hero height", (300 <= hero <= 340) if w < 700 else (430 <= hero <= 520), hero)
            ok(f"{w}px first recommendation on first screen", m.evaluate("document.querySelector('.mo').getBoundingClientRect().top") < h - 80)
            ok(f"{w}px no layout shift", m.evaluate(CLS) < 0.05, round(m.evaluate(CLS), 3))
            m.evaluate("window.scrollTo(0, document.getElementById('plist').getBoundingClientRect().top + scrollY + 300)"); m.wait_for_timeout(200)
            ok(f"{w}px nav + filters stay on top while scrolling", m.evaluate("Math.round(document.querySelector('nav.top').getBoundingClientRect().top)") == 0 and m.evaluate("Math.round(document.querySelector('.tabs').getBoundingClientRect().top)") == 46)
            ok(f"{w}px no JS / CSP errors", not e, e[:2])
            c.close()

        # ---------- 3. functions (390 px) ----------
        c = b.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce"); m = c.new_page(); e = []
        m.on("pageerror", lambda x: e.append(str(x)))
        m.goto(U); m.evaluate("localStorage.clear(); localStorage.setItem('zh-plan', JSON.stringify([{t:'p',id:'kunsthaus',d:7},{t:'i',id:'west',d:0},{t:'p',id:'nude',d:0}]))"); m.reload(); m.wait_for_timeout(900)
        ok("old plan format migrates in order", plan(m) == ['kunsthaus', 'gerold', 'viadukt', 'spheres', 'nude'], plan(m))
        m.evaluate("localStorage.clear()"); m.reload(); m.wait_for_timeout(900)
        body = m.inner_text("body")
        ok("3 nav items, no countdown, no 'POC'", m.locator("nav.top a").count() == 3 and "faltan" not in body and "POC" not in body)
        ok("section order", m.evaluate("[...document.querySelectorAll('main > section')].map(s=>s.id)") == ['momentos', 'lomejor', 'lista', 'ideas', 'plan', 'info'])
        ok("'Favoritos de Mike' explained once, star gold", m.inner_text("main").lower().count("favoritos de mike") == 1 and m.evaluate("getComputedStyle(document.querySelector('.star')).color") == "rgb(196, 154, 72)")
        ok("all favourites on the front page (photo picks + list), each once", m.locator("#favGrid .pick").count() + m.locator("#favList .fl").count() == m.evaluate("PLACES.filter(p=>p.poc).length") and m.locator("#favGrid .pick").count() >= 3)
        ok("picks carry Mike's words", m.locator("#favGrid .pk-q").count() == m.locator("#favGrid .pick").count() and "«" not in m.evaluate("[...document.querySelectorAll('.pk-q')].map(q=>q.textContent).join('')")[:1])
        ok("no «TOP 10» label", "TOP 10" not in m.inner_text("main"))
        nfav = m.evaluate("PLACES.filter(p=>p.poc).length")
        m.click("[data-tab=favoritos]"); ok("Favoritos filter shows all favourites", m.inner_text("#count").startswith(str(nfav)))
        ok("4 moment tiles", m.locator("#momGrid .mo").count() == 4)
        m.click("[data-goto=m-manana]"); ok("tile 'Antes del trabajo' → early cafés", m.evaluate("visible().map(p=>p.id)") == m.evaluate("CONFIG.momentos[0].places") and m.locator("#tabs [aria-pressed=true]").inner_text() == "Antes del trabajo")
        m.click("[data-goto=m-mediodia]"); ok("tile 'A mediodía' → lunch sorted by office distance", m.evaluate("visible().every(p=>p.tags.includes('almuerzo'))") and m.evaluate("visible()[0].id") in ("leshalles","piu","collective","spheres","viadukt"), m.evaluate("visible()[0].id"))
        m.click("[data-goto=m-tarde]"); ok("tile 'Después del trabajo' → Christmas first", m.evaluate("visible()[0].cat") == "navidad")
        m.click("[data-goto=m-finde]"); ok("tile 'El fin de semana' → excursions/brunch/culture", m.evaluate("visible().some(p=>p.cat==='excursion') && visible().some(p=>(p.tags||[]).includes('brunch'))"))
        m.click("[data-tab=destacados]")
        m.evaluate("window.scrollTo(0,0)"); m.click("#favGrid .pk-img"); m.wait_for_timeout(300); ok("tapping a pick opens its card", m.evaluate("location.hash").startswith("#p-"))
        m.click("[data-tab=comer]"); ok("sub-filters only in Comer", m.is_visible("#subtabs"))
        for sub in ("cafe", "brunch", "almuerzo", "cena", "bar"):
            m.click(f"[data-sub={sub}]"); n = m.evaluate(f"PLACES.filter(p=>(p.tags||[]).includes('{sub}')).length")
            ok(f"filter {sub}", m.inner_text("#count").startswith(str(n)), m.inner_text("#count"))
            m.click(f"[data-sub={sub}]")
        m.click("[data-tab=todo]"); ok("no 'null'/'undefined'/'NaN' in visible text", not re.search(r"\b(null|undefined|NaN)\b", m.inner_text("main") + m.evaluate("[...document.querySelectorAll('.more')].map(x=>x.textContent).join(' ')")))
        ok("Todo = all places, grouped", m.inner_text("#count").startswith(str(m.evaluate("PLACES.length"))) and m.locator(".group-h").count() >= 5)
        m.click("#offBtn"); ok("'Oficina' sorts by distance to the office", "oficina" in m.inner_text("#count")); m.click("#offBtn")
        m.click("[data-tab=destacados]")
        ok("card face: Maps + Más información + add", all(n == 3 for n in m.evaluate("[...document.querySelectorAll('.pc')].map(c=>c.querySelectorAll('.pc-foot a,.pc-foot button').length)")))
        m.click("#p-lindenhof [data-more]"); ok("Más información opens (tip, address)", m.is_visible("#m-lindenhof") and "Consejo de Mike" in m.inner_text("#m-lindenhof") and "Dirección" in m.inner_text("#m-lindenhof"))
        m.focus("#p-lindenhof [data-more]"); m.keyboard.press("Enter"); ok("…and closes with the keyboard", not m.is_visible("#m-lindenhof"))
        ok("map not loaded before opening", m.evaluate("typeof L") == "undefined")
        m.click("#mapBtn"); m.wait_for_timeout(1500)
        ok("map loads on demand (+ office marker)", m.evaluate("typeof L") == "object" and m.locator(".leaflet-container").count() == 1 and m.locator(".of").count() == 1)
        m.click("#p-lindenhof [data-more]"); m.click("#p-lindenhof [data-showmap]"); m.wait_for_timeout(1200); ok("'Ver en el mapa' opens popup", m.locator(".leaflet-popup").count() == 1)
        for pid in ("illuminarium", "lindenhof", "niederdorf"): m.click(f"#p-{pid} .add")
        ok("plan: add", plan(m) == ['illuminarium', 'lindenhof', 'niederdorf'])
        ok("plan: buttons in sync (card + favourite tile)", m.get_attribute("#favGrid .add[data-plan=lindenhof]", "aria-pressed") == "true")
        m.click(f"#ideasTop [data-addidea={m.evaluate('CONFIG.topIdeas[0]')}]")
        stops = m.evaluate("ideaById[CONFIG.topIdeas[0]].stops"); exp = ['illuminarium', 'lindenhof', 'niederdorf'] + [s for s in stops if s not in ('illuminarium', 'lindenhof', 'niederdorf')]
        ok("plan: idea adds its stops", plan(m) == exp, plan(m))
        m.evaluate("document.getElementById('plan').scrollIntoView()"); m.wait_for_timeout(300)
        hb = m.locator("#planList .pl").nth(0).locator(".handle").bounding_box(); tg = m.locator("#planList .pl").nth(2).bounding_box()
        m.mouse.move(hb["x"] + hb["width"] / 2, hb["y"] + hb["height"] / 2); m.mouse.down(); m.mouse.move(hb["x"] + 10, tg["y"] + tg["height"] * .75, steps=8); m.mouse.up(); m.wait_for_timeout(200)
        ok("plan: drag to reorder", plan(m)[:3] == ['lindenhof', 'niederdorf', 'illuminarium'], plan(m)[:3])
        m.locator("#planList .pl").nth(0).locator(".handle").focus(); m.keyboard.press("ArrowDown")
        ok("plan: reorder with arrow keys", plan(m)[:2] == ['niederdorf', 'lindenhof'])
        href = m.get_attribute("#planActs a.pri", "href"); ok("plan: Google Maps route in order", "origin=Niederdorf" in href and "travelmode=walking" in href)
        wa = up.unquote(m.get_attribute("#planActs a[href^='https://wa.me']", "href")); ok("plan: WhatsApp text (Spanish, list, link)", "Nuestro plan para Zúrich" in wa and "1. Niederdorf" in wa and "#plan=" in wa)
        small = m.evaluate("""(()=>{const hid=[...document.querySelectorAll('.more[hidden],details:not([open])')];
          hid.forEach(e=>e.tagName==='DETAILS'?e.open=true:e.hidden=false);
          const out=[...document.querySelectorAll('a,button,summary,input,select')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);
            if(!r.width||s.visibility==='hidden'||(s.display==='inline'&&e.closest('p'))||e.classList.contains('skip'))return false;
            const credit=e.closest('.pk-cr,.credits,figcaption,.leaflet-control-attribution')||e.classList.contains('hero-credit');
            return credit?r.height<24:(r.width<43.5||r.height<43.5)}).map(e=>(e.className||e.tagName)+' '+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height));
          hid.forEach(e=>e.tagName==='DETAILS'?e.open=false:e.hidden=true);return out})()""")
        ok("touch targets >= 44 px (photo credits >= 24 px) at 390 px", not small, small[:4])
        link = m.evaluate("planLink()"); n = len(plan(m))
        m.click("#planList .pl >> nth=0 >> .rm"); ok("plan: remove", len(plan(m)) == n - 1)
        m.reload(); m.wait_for_timeout(800); ok("plan: survives reload", len(plan(m)) == n - 1)
        m.evaluate("state.plan = PLACES.map(p=>p.id); renderPlan()"); ok("plan: >10 stops → limit note", "como máximo" in m.inner_text("#planActs")); m.evaluate("state.plan=[]; renderPlan()")
        ids = m.evaluate("[...document.querySelectorAll('[id]')].map(e=>e.id)"); ok("no duplicate DOM ids", not [k for k, v in collections.Counter(ids).items() if v > 1])
        ok("internal anchors resolve", not m.evaluate("[...document.querySelectorAll('a[href^=\"#\"]')].map(a=>a.getAttribute('href')).filter(h=>h.length>1&&!document.getElementById(h.slice(1)))"))
        ok("links are https/tel/# only, external ones noopener", not m.evaluate("[...document.querySelectorAll('a[href]')].filter(a=>!/^(#|https:\\/\\/|tel:)/.test(a.getAttribute('href'))||(a.target==='_blank'&&!/noopener/.test(a.rel))).map(a=>a.href)"))
        ok("buttons labelled, images have alt", m.evaluate("[...document.querySelectorAll('button')].filter(b=>!((b.textContent||'').trim()||b.getAttribute('aria-label'))).length + [...document.querySelectorAll('img')].filter(i=>!i.hasAttribute('alt')).length") == 0)
        m.evaluate("document.querySelectorAll('img').forEach(i=>i.loading='eager')"); m.wait_for_timeout(1500)
        ok("all images load", not m.evaluate("[...document.querySelectorAll('img')].filter(i=>!(i.complete&&i.naturalWidth>0)).map(i=>i.src)"))
        ok("no JS errors during the session", not e, e[:2])
        m.keyboard.press("Home"); m.goto(U); m.wait_for_timeout(400); m.keyboard.press("Tab"); ok("skip link is first", m.evaluate("document.activeElement.className") == "skip")
        c.close()

        # ---------- 4. sharing, deep links, edge cases ----------
        def page(hash="", init=None):
            c = b.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce"); m = c.new_page(); e = []
            m.on("pageerror", lambda x: e.append(str(x)))
            if init: m.add_init_script(init)
            m.goto(U + hash); m.wait_for_timeout(1100); return c, m, e
        c, m, e = page(link[link.index('#'):]); ok("shared plan link shows banner", m.locator(".share-in").count() == 1)
        m.click("[data-inc=replace]"); ok("shared plan imported", m.inner_text("#planCnt").strip() == str(n)); c.close()
        c, m, e = page("#plan=kunsthaus.7~i-casco.7~lindenhof.0"); ok("old shared-link format works", "lugares" in m.inner_text("#shareIn")); c.close()
        for h, sel in (("#p-nude", "p-nude"), ("#idea-chocolate", "idea-chocolate"), ("#lugares", "lista"), ("#favoritos", "lomejor"), ("#navidad", "calFold"), ("#hoy", "descubrir")):
            c, m, e = page(h); t = m.evaluate(f"document.getElementById('{sel}').getBoundingClientRect().top")
            ok(f"deep link {h}", -10 <= t < 340, round(t)); c.close()
        for h in ("#123", '#a"b', "#p-%3Cimg%20src=x%20onerror=alert(1)%3E", "#%E0%A4%A", "#plan=%3Cscript%3E~lindenhof"):
            c, m, e = page(h); m.evaluate("window.scrollTo(0,0); location.hash='#lugares'"); m.wait_for_timeout(500)
            ok(f"odd link {h[:22]} → no error, navigation still works", not e and m.locator("img[src=x]").count() == 0 and abs(m.evaluate("document.getElementById('lista').getBoundingClientRect().top") - 46) < 5, e[:1]); c.close()
        c, m, e = page(init="Storage.prototype.getItem=function(){throw new Error('x')};Storage.prototype.setItem=function(){throw new Error('x')};")
        m.click("#p-illuminarium .add"); ok("works without localStorage", not e and m.locator("#planList .pl").count() == 1); c.close()
        for bad in ('{"x":1}', '"text"', '[1,null,{"a":2},"lindenhof","lindenhof","nope"]', 'not json'):
            c, m, e = page(init="localStorage.setItem('zh-plan3', %s)" % json.dumps(bad))
            ok(f"corrupt saved plan {bad[:14]}… is cleaned", not e and m.evaluate("state.plan") in ([], ['lindenhof']), m.evaluate("state.plan")); c.close()
        c = b.new_context(viewport={"width": 390, "height": 844}, color_scheme="dark"); m = c.new_page(); m.goto(U); m.wait_for_timeout(800)
        ok("dark mode renders", m.evaluate("getComputedStyle(document.body).backgroundColor") != "rgb(248, 246, 241)"); c.close()
        b.close()

if __name__ == "__main__":
    main()
    bad = [r for r in R if not r[0]]
    for good, name, info in R:
        if not good or "-v" in sys.argv: print(("OK   " if good else "FAIL ") + name + (f"  — {info}" if info not in ("", None) else ""))
    print(f"\n{len(R) - len(bad)}/{len(R)} checks passed" + ("" if not bad else f", {len(bad)} FAILED"))
    sys.exit(1 if bad else 0)
