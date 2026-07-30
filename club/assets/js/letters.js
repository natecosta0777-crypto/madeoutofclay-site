/* ============================================================
   Weekly Book Club letters — the content library.
   One entry per week. The clubhouse shows the "current" week;
   the archive page lists them all. A weekly cron/worker sends
   the current week's letter to members (see _worker.js /api/cron).
   To add a week: append an object. `week` should increase by 1.
   ============================================================ */
window.MOOC_LETTERS = [
  {
    week: 1,
    from: 'Maya',
    face: 'assets/characters/book/maya.webp',
    book: 'Maya Goes First',
    series: 'Brave Like Me',
    readHref: 'reader.html',
    subject: '⭐ This week: “Maya Goes First”',
    readAloud: 'This week I had butterflies in my tummy — but I raised my hand and went FIRST anyway. Brave isn’t “not scared.” Brave is doing the thing even while your tummy flips. What’s something YOU were brave enough to try?',
    note: 'Inside the clubhouse you’ll find the story to read together and a printable brave-badge to color. (Narrated read-alongs are coming soon.) Two minutes at bedtime is plenty.'
  },
  {
    week: 2,
    from: 'Scooter',
    face: 'assets/characters/book/scooter.webp',
    book: 'Scooter Can’t Wait for Spring',
    series: 'At Sunny’s Table',
    readHref: 'clubhouse.html',
    subject: '🦥 This week: “Scooter Can’t Wait for Spring”',
    readAloud: 'This week Scooter learned that waiting is hard — but good things are worth waiting for. While he waited for spring, he found cozy things to love about right now. What’s something YOU’RE excited to wait for?',
    note: 'There’s a cozy story to read together and a “count-down to something good” printable this week. (Audio narration coming soon.)'
  },
  {
    week: 3,
    from: 'Nia',
    face: 'assets/characters/book/nia.webp',
    book: 'The Day Nia Spoke Up',
    series: 'Brave Like Me',
    readHref: 'clubhouse.html',
    subject: '✋ This week: “The Day Nia Spoke Up”',
    readAloud: 'This week Nia’s voice shook — but she shared her big idea anyway, and everyone heard it. Your voice matters, even when it wobbles. What’s something YOU would like to say out loud?',
    note: 'This week’s printable is a “my big idea” page — a place for your child to draw or dictate something they want to share.'
  },
  {
    week: 4,
    from: 'Caleb',
    face: 'assets/characters/book/caleb.webp',
    book: 'Caleb’s Homeland',
    series: 'The Kingdom of Judea',
    readHref: 'clubhouse.html',
    subject: '🦁 This week: “Caleb’s Homeland”',
    readAloud: 'This week Caleb walked the long way home to keep his whole pride safe. Home isn’t just a place — it’s the family you walk with. Who are the people who keep YOU safe?',
    note: 'The printable this week is a little “my pride” family drawing — who’s in your child’s circle.'
  }
];
