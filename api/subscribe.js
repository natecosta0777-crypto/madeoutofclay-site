// Vercel serverless function — subscribes an email to Beehiiv from our own site,
// so the whole signup stays on madeoutofclayprod.com with our branding (no Beehiiv page).
// Env vars (set in Vercel, server-side only): BEEHIIV_API_KEY, BEEHIIV_PUB_ID.
// Branded HTML fallback — shown when a plain browser navigates here (JS off/stale),
// so the visitor never sees raw JSON. When our own fetch() calls in (Accept: application/json)
// we return JSON instead and the page shows inline success without leaving.
function wantsJson(req) {
  return String(req.headers['accept'] || '').indexOf('application/json') !== -1;
}
function page(title, heading, msg, celebrate) {
  var confetti = celebrate ? ('<canvas id="cf" style="position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9"></canvas>' +
    '<script>(function(){if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;var c=document.getElementById("cf");c.width=innerWidth;c.height=innerHeight;var x=c.getContext("2d"),C=["#E8B84B","#C9744D","#8FAE8B","#5E7FA3","#7E5A78","#fff"],P=[];for(var i=0;i<150;i++)P.push({x:c.width/2+(Math.random()-.5)*c.width*.5,y:c.height*.35,r:6+Math.random()*8,co:C[i%C.length],vx:(Math.random()-.5)*12,vy:-6-Math.random()*8,ro:Math.random()*6.28,vr:(Math.random()-.5)*.4});var s=Date.now();(function f(){var t=Date.now()-s;x.clearRect(0,0,c.width,c.height);for(var i=0;i<P.length;i++){var p=P[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.28;p.vx*=.99;p.ro+=p.vr;x.save();x.translate(p.x,p.y);x.rotate(p.ro);x.fillStyle=p.co;x.globalAlpha=Math.max(0,1-t/2800);x.fillRect(-p.r/2,-p.r/2,p.r,p.r*.6);x.restore();}if(t<2800)requestAnimationFrame(f);else c.remove();})();})();</script>') : '';
  return '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + title + ' — Made Out of Clay</title>' + confetti +
    '<div style="font-family:Iowan Old Style,Palatino,Georgia,serif;background:#fdf8f1;color:#2c2420;min-height:100vh;' +
    'display:flex;align-items:center;justify-content:center;text-align:center;padding:24px">' +
    '<div style="max-width:460px"><div style="font-size:2.6rem;margin-bottom:6px">📚</div>' +
    '<h1 style="font-size:1.8rem;margin:0 0 10px">' + heading + '</h1>' +
    '<p style="color:#5e544c;font-size:1.05rem;margin:0 0 22px">' + msg + '</p>' +
    '<a href="/" style="display:inline-block;background:#c2562e;color:#fff;font-weight:700;text-decoration:none;' +
    'padding:13px 26px;border-radius:999px">← Back to Made Out of Clay</a></div></div>';
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const body = req.body || {};
  const json = wantsJson(req);
  // Honeypot: bots fill this; humans never see it. Silently accept so the bot thinks it worked.
  if (body._gotcha) {
    return json ? res.status(200).json({ ok: true })
                : res.status(200).send(page('Subscribed', "You're on the list! 🎉", 'Thanks for joining the family list.', true));
  }

  const email = String(body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json ? res.status(400).json({ ok: false, error: 'bad_email' })
                : res.status(400).send(page('Check your email', 'Hmm, that email looks off', 'Please head back and enter a valid email address.'));
  }

  const KEY = process.env.BEEHIIV_API_KEY;
  const PUB = process.env.BEEHIIV_PUB_ID;
  if (!KEY || !PUB) {
    return json ? res.status(500).json({ ok: false, error: 'not_configured' })
                : res.status(500).send(page('One moment', 'Sign-ups are being set up', 'Please check back in a little while.'));
  }

  try {
    const r = await fetch(`https://api.beehiiv.com/v2/publications/${PUB}/subscriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        reactivate_existing: true,
        send_welcome_email: true,
        utm_source: 'madeoutofclayprod.com',
        referring_site: 'madeoutofclayprod.com'
      })
    });
    if (r.ok) {
      return json ? res.status(200).json({ ok: true })
                  : res.status(200).send(page('Subscribed', "You're on the list! 🎉", 'Thanks for joining the family list — new books and free printables are on the way.', true));
    }
    const detail = (await r.text()).slice(0, 300);
    return json ? res.status(502).json({ ok: false, error: `beehiiv_${r.status}`, detail })
                : res.status(502).send(page('Try again', 'Something hiccuped', 'We could not add you just now — please try again in a moment.'));
  } catch (e) {
    return json ? res.status(500).json({ ok: false, error: 'exception' })
                : res.status(500).send(page('Try again', 'Something hiccuped', 'We could not add you just now — please try again in a moment.'));
  }
};
