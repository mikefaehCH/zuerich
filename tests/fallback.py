"""390px regression and screenshots for the same SZU notice with/without page JS."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from check import serve

with sync_playwright() as p:
    browser = p.chromium.launch()
    url = serve()
    expected = None
    out = Path('test-results')
    out.mkdir(exist_ok=True)
    for enabled in [True, False]:
        context = browser.new_context(viewport={'width': 390, 'height': 844}, java_script_enabled=enabled)
        page = context.new_page()
        page.goto(url)
        if enabled:
            page.wait_for_selector('html.ready')
            expected = page.evaluate('SZU_NOTE')
        else:
            note = page.locator('.noscript-note')
            assert note.inner_text() == 'Para consultar los lugares, los horarios y vuestro plan, activad JavaScript en el navegador.'
            assert note.evaluate('(e)=>getComputedStyle(e).padding') == '12px 16px'
        page.screenshot(path=str(out / ('zuerich-js-top.png' if enabled else 'zuerich-no-js-top.png')))
        page.locator('#info details').first.locator('summary').click()
        assert page.locator('#szuNote').inner_text() == expected
        assert page.locator('#szuNote').is_visible()
        assert page.evaluate('document.documentElement.scrollWidth') == 390
        # Capture the expanded transport notice at the same mobile size.
        page.screenshot(path=str(out / ('zuerich-js.png' if enabled else 'zuerich-no-js.png')))
        context.close()
    browser.close()
print('PASS: SZU fallback parity, vosotros, spacing, no overflow; both 390x844 screenshots saved')
