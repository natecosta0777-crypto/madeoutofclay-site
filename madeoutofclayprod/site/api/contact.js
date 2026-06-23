module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, type, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Mail service not configured.' });
  }

  const body = JSON.stringify({
    from: 'Made Out of Clay Contact <contact@madeoutofclayprod.com>',
    to: ['hello@madeoutofclayprod.com'],
    reply_to: email,
    subject: `[Contact] ${type || 'General'} — ${name}`,
    html: `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      <p><strong>Type:</strong> ${type || 'General Question'}</p>
      <hr />
      <p>${message.replace(/\n/g, '<br />')}</p>
    `,
  });

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to send message. Please email us directly.' });
  }

  return res.status(200).json({ ok: true });
};
