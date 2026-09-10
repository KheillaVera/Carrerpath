import { useEffect, useMemo, useState } from 'react';
import { Award, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { SkeletonCards } from '../../components/Skeleton';
import ErrorAlert from '../../components/ErrorAlert';

const LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'elementary', label: 'Elementary' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

export default function SkillsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();
  const [mySkills, setMySkills] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('intermediate');
  const [pendingSkill, setPendingSkill] = useState(null);
  const [busy, setBusy] = useState(false);

  const owned = useMemo(() => new Set(mySkills.map((s) => s.id)), [mySkills]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [mine, cats] = await Promise.all([
          api.get('/profile/skills'),
          api.get('/skills/categories'),
        ]);
        if (cancelled) return;
        setMySkills(mine.data.skills);
        setCategories(cats.data.categories);
      } catch (err) {
        setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/skills', { params: { q: q || undefined, category: category || undefined } });
        if (!cancelled) setCatalogue(data.skills);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [q, category]);

  const addSkill = async (skill, selfLevel) => {
    setError(null);
    setBusy(true);
    try {
      const { data } = await api.post('/profile/skills', { skillId: skill.id, selfLevel });
      toast.success('Skill added', `${skill.name} · ${selfLevel}`);
      setMySkills(data.skills);
      setPendingSkill(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeSkill = async (skillId) => {
    setError(null);
    try {
      const { data } = await api.delete(`/profile/skills/${skillId}`);
      toast.info('Skill removed');
      setMySkills(data.skills);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <SkeletonCards count={2} columns={1} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skills"
        description="Add the skills you actually have. These drive job matches and skill-gap analysis."
      />
      <ErrorAlert message={error} />

      <section className="card card-body">
        <h2 className="font-semibold mb-3">Your skills</h2>
        {mySkills.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No skills added yet"
            message="Search the catalogue below and add the ones that match what you can do."
          />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {mySkills.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-md border border-line px-3 py-2">
                <div>
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-muted">
                    {s.categoryName || 'Uncategorised'} · <span className="capitalize">{s.selfLevel}</span>
                  </div>
                </div>
                <button className="btn-ghost p-1 text-muted hover:text-danger" onClick={() => removeSkill(s.id)} aria-label={`Remove ${s.name}`}>
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card card-body">
        <h2 className="font-semibold mb-3">Add from catalogue</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_200px_180px] mb-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden />
            <input
              className="input pl-9"
              placeholder="Search skills…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search skills"
            />
          </div>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
          <select className="input" value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Skill level to record">
            {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>

        {catalogue.length === 0 ? (
          <EmptyState title="No skills match your filters" message="Try a different search or category." />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {catalogue.map((s) => {
              const already = owned.has(s.id);
              return (
                <li key={s.id} className="flex items-center justify-between rounded-md border border-line px-3 py-2">
                  <div>
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-muted">{s.categoryName || 'Uncategorised'}</div>
                  </div>
                  <button
                    className={already ? 'btn-secondary' : 'btn-primary'}
                    disabled={already || busy || pendingSkill === s.id}
                    onClick={() => { setPendingSkill(s.id); addSkill(s, level); }}
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    {already ? 'Added' : 'Add'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
