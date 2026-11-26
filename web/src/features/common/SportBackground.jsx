// Decorative moving sport background, shown only on the checkout, payment and My tickets pages.

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SPORT_IDS, sportEmoji } from '../../utils/sports';

// Pages that get the background.
const PATHS = ['/checkout', '/mock-pay', '/my-tickets', '/scanner', '/admin', '/manager'];
// Staff pages also get a soft panel behind the content so tables stay readable.
const STAFF_PATHS = ['/scanner', '/admin', '/manager'];
// Position (l, t), size (s), delay (d) and duration (du) of each floating icon.
const ICONS = [
  { l: '5%', t: '14%', s: '3.4rem', d: '0s', du: '11s' },
  { l: '17%', t: '72%', s: '2.8rem', d: '1.4s', du: '13s' },
  { l: '29%', t: '30%', s: '2.2rem', d: '3s', du: '9s' },
  { l: '41%', t: '84%', s: '3.6rem', d: '0.8s', du: '12s' },
  { l: '54%', t: '10%', s: '3rem', d: '2.2s', du: '10s' },
  { l: '66%', t: '62%', s: '2.4rem', d: '4s', du: '14s' },
  { l: '77%', t: '20%', s: '3.8rem', d: '1s', du: '12s' },
  { l: '87%', t: '78%', s: '3rem', d: '2.6s', du: '11s' },
  { l: '93%', t: '40%', s: '2.4rem', d: '3.4s', du: '15s' },
  { l: '10%', t: '46%', s: '2.6rem', d: '0.4s', du: '16s' },
];

export default function SportBackground() {
  const { pathname } = useLocation();
  const on = PATHS.some((p) => pathname.startsWith(p));
  const tickets = pathname.startsWith('/my-tickets');
  const staff = STAFF_PATHS.some((p) => pathname.startsWith(p));

  // Adds CSS classes to the page body so the stylesheet can colour the page to match.
  useEffect(() => {
    document.body.classList.toggle('has-sport-bg', on);
    document.body.classList.toggle('page-tickets', tickets);
    document.body.classList.toggle('page-staff', staff);
    return () => document.body.classList.remove('has-sport-bg', 'page-tickets', 'page-staff');
  }, [on, tickets, staff]);

  if (!on) return null;
  return (
    <div className="sport-bg" aria-hidden="true">
      <i className="sb-blob sb-blob-a" />
      <i className="sb-blob sb-blob-b" />
      {ICONS.map((f, i) => (
        <span key={i} className="sb-icon"
          style={{ '--l': f.l, '--t': f.t, '--s': f.s, '--d': f.d, '--du': f.du }}>
          {sportEmoji(SPORT_IDS[i % SPORT_IDS.length])}
        </span>
      ))}
    </div>
  );
}
