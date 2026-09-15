"""Local Chromium audit; does not publish or change the site.

Requires Python Playwright and installed Chrome. Run with the preview server:
python tests/performance_browser.py --label before
"""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--label', default='after')
parser.add_argument('--url', default='http://127.0.0.1:8765')
args = parser.parse_args()
out = Path('.performance-review')
out.mkdir(exist_ok=True)
report = {}
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe', headless=True)
    for name, size, mobile in [('desktop', {'width':1365,'height':900},False), ('mobile',{'width':393,'height':852},True)]:
        context = browser.new_context(viewport=size, is_mobile=mobile, has_touch=mobile, device_scale_factor=2 if mobile else 1)
        page = context.new_page()
        errors, failed = [], []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('requestfailed', lambda r: failed.append([r.url, r.failure]))
        page.add_init_script('''window.__audit={frames:[],longTasks:[],draws:{}};
          new PerformanceObserver(list=>window.__audit.longTasks.push(...list.getEntries().map(e=>e.duration))).observe({type:'longtask',buffered:true});
          const old=CanvasRenderingContext2D.prototype.clearRect;
          CanvasRenderingContext2D.prototype.clearRect=function(...args){const id=this.canvas.id;window.__audit.draws[id]=(window.__audit.draws[id]||0)+1;return old.apply(this,args)};
        ''')
        page.goto(args.url, wait_until='networkidle', timeout=60000)
        page.wait_for_timeout(4000)
        metrics = []
        for selector in ['#hero','#portal-app','#sneaker-app','#solar-app','#contact']:
            if not page.locator(selector).count(): continue
            page.locator(selector).scroll_into_view_if_needed()
            page.wait_for_timeout(1200)
            page.evaluate('window.__audit.draws={};window.__audit.longTasks=[]')
            sample=page.evaluate('''() => new Promise(resolve=>{
              const times=[]; let start=performance.now(),last=start;
              function tick(now){times.push(now-last);last=now;if(now-start<2000){requestAnimationFrame(tick);return}
                times.shift();times.sort((a,b)=>a-b);resolve({frames:times.length,p95:times[Math.floor(times.length*.95)],longTasks:window.__audit.longTasks,draws:window.__audit.draws,overflow:document.documentElement.scrollWidth-innerWidth})}
              requestAnimationFrame(tick);
            })''')
            metrics.append({'section':selector,**sample})
            if selector in ['#hero','#portal-app','#solar-app']:
                page.screenshot(path=str(out/f'{args.label}-{name}-{selector[1:]}.png'))
        report[name]={'errors':errors,'failedRequests':failed,'metrics':metrics}
        context.close()
    browser.close()
(out/f'{args.label}.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
