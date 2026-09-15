"""Exercise the current portfolio, including real mobile scroll gestures."""
import json
import argparse
from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path('.performance-review')
out.mkdir(exist_ok=True)
results = []
parser = argparse.ArgumentParser()
parser.add_argument('--mobile-only', action='store_true')
args = parser.parse_args()
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe', headless=True)
    for mobile in ([True] if args.mobile_only else [False, True]):
        context = browser.new_context(viewport={'width':393,'height':852} if mobile else {'width':1365,'height':900}, is_mobile=mobile, has_touch=mobile)
        page = context.new_page()
        errors, bad = [], []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda response: bad.append([response.status,response.url]) if response.status >= 400 else None)
        page.goto('http://127.0.0.1:8765', wait_until='networkidle')
        page.wait_for_timeout(4000)
        assert page.locator('#preloader').evaluate('(e)=>getComputedStyle(e).visibility') == 'hidden'
        assert page.locator('#solar-planet-dock button').count() == 0, 'Solar scene eagerly initialized'
        counts = []
        for language in ['ru','en','uz','ru','en','uz']:
            page.locator(f'.lang-btn[data-lang="{language}"]').first.click()
            page.wait_for_timeout(200)
            assert page.locator('html').get_attribute('lang') == language
            assert page.locator('.statement-word').count() > 5
            assert page.locator('.closing-word').count() > 5
            counts.append(page.evaluate('ScrollTrigger.getAll().length'))
        assert counts[:3] == counts[3:], f'Translation animations leaked: {counts}'
        print('PASS language lifecycle', mobile, flush=True)
        page.locator('#portal-app').scroll_into_view_if_needed()
        for index in range(6):
            page.locator(f'.portal-tab').nth(index).click()
            page.wait_for_timeout(950)
            assert 'active' in page.locator('.portal-tab').nth(index).get_attribute('class')
            assert page.locator('#portal-place-title').inner_text().strip()
        print('PASS six destinations', mobile, flush=True)
        page.locator('#sneaker-app').scroll_into_view_if_needed()
        for index in range(6):
            page.locator('.snk-model-tab').nth(index).click()
            page.wait_for_timeout(400)
            assert page.locator('#snk-product-title').inner_text().strip()
            for angle in ['0','45','90','180','270','top']:
                page.locator(f'.snk-angle-pill[data-angle="{angle}"]').click()
                page.wait_for_timeout(120)
                assert page.locator('.snk-photo-render').evaluate('(e)=>e.complete && e.naturalWidth>0')
        print('PASS six products and 36 angles', mobile, flush=True)
        page.locator('#solar-app').scroll_into_view_if_needed()
        page.wait_for_function('document.querySelectorAll("#solar-planet-dock button").length === 10')
        for index in [3,7,0]:
            page.locator('#solar-planet-dock button').nth(index).click()
            page.wait_for_timeout(1200)
            assert page.locator('#tel-name').inner_text().strip()
        page.locator('.solar-speed-btn[data-speed="0"]').click()
        assert 'active' in page.locator('.solar-speed-btn[data-speed="0"]').get_attribute('class')
        page.locator('#solar-overview-btn').click()
        page.wait_for_timeout(1800)
        page.screenshot(path=str(out/f'final-{"mobile" if mobile else "desktop"}-solar.png'))
        # A real scroll over each interactive canvas must move the page.
        cdp = context.new_cdp_session(page)
        for selector in ['#orb-canvas','#snk-tilt-card','#solar-canvas']:
            page.locator(selector).scroll_into_view_if_needed()
            page.wait_for_timeout(600)
            box = page.locator(selector).bounding_box()
            x = min(max(box['x']+box['width']/2,20),page.viewport_size['width']-20)
            y = min(max(box['y']+box['height']/2,100),page.viewport_size['height']-150)
            before = page.evaluate('scrollY')
            if mobile:
                # Chrome's synthetic scroll gesture can be a no-op in headless
                # touch emulation. Dispatch the actual input event sequence.
                y = max(y, 400)
                cdp.send('Input.dispatchTouchEvent', {'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
                for distance in range(20,281,20):
                    cdp.send('Input.dispatchTouchEvent', {'type':'touchMove','touchPoints':[{'x':x,'y':y-distance}]})
                    page.wait_for_timeout(20)
                cdp.send('Input.dispatchTouchEvent', {'type':'touchEnd','touchPoints':[]})
            else:
                page.mouse.move(x,y)
                page.mouse.wheel(0,260)
            page.wait_for_timeout(1300)
            assert page.evaluate('scrollY') > before+20, f'Scroll trapped on {selector}'
        print('PASS canvas scroll gestures', mobile, flush=True)
        for width in ([360,393,430,768] if mobile else [1024,1365]):
            page.set_viewport_size({'width':width,'height':852})
            page.wait_for_timeout(350)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Overflow at {width}'
        assert not errors, errors
        assert not bad, bad
        results.append({'device':'mobile' if mobile else 'desktop','status':'PASS','languageTriggerCounts':counts,'errors':errors,'httpErrors':bad})
        context.close()
    # Storage denied and reduced motion should not break initialization.
    context = browser.new_context(reduced_motion='reduce',viewport={'width':393,'height':852})
    page = context.new_page()
    page.add_init_script("Storage.prototype.getItem=Storage.prototype.setItem=()=>{throw new DOMException('Blocked','SecurityError')}")
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto('http://127.0.0.1:8765',wait_until='networkidle')
    page.wait_for_timeout(4000)
    assert page.locator('html').get_attribute('lang') == 'uz'
    assert not errors,errors
    results.append({'device':'reduced-motion-storage-denied','status':'PASS'})
    browser.close()
(out/'smoke.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
print(json.dumps(results,indent=2))
