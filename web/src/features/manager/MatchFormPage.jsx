import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { saveMatch } from '../../services/api';
import { GROUPS, SPORTS, sportsInGroup } from '../../utils/sports';

const EMPTY = { sport: 'football', stadiumId: '', homeTeam: '', awayTeam: '', kickoff: '', prices: {} };
const toLocalInput = (ms) => new Date(ms - new Date(ms).getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export default function MatchFormPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [stadiums, setStadiums] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getDocs(collection(db, 'stadiums')).then((s) => setStadiums(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, []);

  useEffect(() => {
    if (!form.stadiumId) { setCategories([]); return; }
    getDocs(collection(db, 'stadiums', form.stadiumId, 'sections')).then((s) =>
      setCategories([...new Set(s.docs.map((d) => d.data().category))]));
  }, [form.stadiumId]);

  useEffect(() => {
    if (!matchId) return;
    (async () => {
      const [m, p] = await Promise.all([getDoc(doc(db, 'matches', matchId)), getDocs(collection(db, 'matches', matchId, 'prices'))]);
      if (!m.exists()) { setError('Match not found.'); return; }
      const prices = {};
      p.forEach((d) => { prices[d.id] = String(d.data().amountMinor / 100); });
      const data = m.data();
      setForm({ sport: data.sport ?? 'football', stadiumId: data.stadiumId, homeTeam: data.homeTeam,
        awayTeam: data.awayTeam, kickoff: toLocalInput(data.kickoff.toMillis()), prices });
    })();
  }, [matchId]);

  const sides = SPORTS[form.sport]?.sides ?? ['Home team', 'Away team'];
  const venues = stadiums.filter((s) => !s.sport || s.sport === form.sport);
  const setField = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const setPrice = (c) => (e) => setForm({ ...form, prices: { ...form.prices, [c]: e.target.value } });
  const changeSport = (e) => setForm({ ...form, sport: e.target.value, stadiumId: '', prices: {} });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const prices = {};
      categories.forEach((c) => { prices[c] = Math.round(Number(form.prices[c]) * 100); });
      await saveMatch({ matchId, input: {
        sport: form.sport, stadiumId: form.stadiumId, homeTeam: form.homeTeam, awayTeam: form.awayTeam,
        kickoffMs: new Date(form.kickoff).getTime(), prices,
      } });
      navigate('/manager/matches');
    } catch (err) {
      setError(err.message || 'Could not save the match.');
      setBusy(false);
    }
  }

  return (
    <section>
      <h2>{matchId ? 'Edit draft match' : 'New match'}</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="sport">Sport</label>
        <select id="sport" value={form.sport} onChange={changeSport} disabled={Boolean(matchId)}>
          {GROUPS.map((g) => (
            <optgroup key={g} label={g}>
              {sportsInGroup(g).map((id) => <option key={id} value={id}>{SPORTS[id].label}</option>)}
            </optgroup>
          ))}
        </select>
        <label htmlFor="stadium">Venue</label>
        <select id="stadium" value={form.stadiumId} onChange={setField('stadiumId')} required>
          <option value="">Select…</option>
          {venues.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <label htmlFor="home">{sides[0]}</label>
        <input id="home" value={form.homeTeam} onChange={setField('homeTeam')} maxLength={60} required />
        <label htmlFor="away">{sides[1]}</label>
        <input id="away" value={form.awayTeam} onChange={setField('awayTeam')} maxLength={60} required />
        <label htmlFor="kickoff">Start time</label>
        <input id="kickoff" type="datetime-local" value={form.kickoff} onChange={setField('kickoff')} required />
        {categories.map((c) => (
          <div key={c}>
            <label htmlFor={`price-${c}`}>{c} price (₦)</label>
            <input id={`price-${c}`} type="number" min="1" step="1" value={form.prices[c] ?? ''} onChange={setPrice(c)} required />
          </div>
        ))}
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={busy || !form.stadiumId}>{busy ? 'Saving…' : 'Save draft'}</button>
      </form>
    </section>
  );
}
