import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Save } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import { useToast } from '../../components/Toast';
import { SkeletonForm } from '../../components/Skeleton';
import ErrorAlert from '../../components/ErrorAlert';
import { urlRule } from '../../services/validation';

const WORK_MODES = [
  { value: 'any', label: 'Any' },
  { value: 'onsite', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];
const EMPLOYMENT_TYPES = [
  { value: 'any', label: 'Any' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'internship', label: 'Internship' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
];

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();
  const [isSeeker, setIsSeeker] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/profile');
        if (cancelled) return;
        setIsSeeker(!!data.jobSeeker);
        reset({
          fullName: data.user.fullName || '',
          phone: data.user.phone || '',
          jobSeeker: {
            headline: data.jobSeeker?.headline || '',
            bio: data.jobSeeker?.bio || '',
            location: data.jobSeeker?.location || '',
            careerInterests: data.jobSeeker?.careerInterests || '',
            preferredWorkMode: data.jobSeeker?.preferredWorkMode || 'any',
            preferredEmploymentType: data.jobSeeker?.preferredEmploymentType || 'any',
            githubUrl: data.jobSeeker?.githubUrl || '',
            linkedinUrl: data.jobSeeker?.linkedinUrl || '',
            portfolioUrl: data.jobSeeker?.portfolioUrl || '',
          },
        });
      } catch (err) {
        setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reset]);

  const onSubmit = async (values) => {
    setError(null);
    try {
      await api.patch('/profile', values);
      toast.success('Profile saved', 'Employers see these details on your applications.');
    } catch (err) {
      setError(err.details?.[0]?.message || err.message);
    }
  };

  if (loading) return <SkeletonForm fields={6} />;

  return (
    <div>
      <PageHeader
        title="Your profile"
        description="This is what employers see. The more complete it is, the better we can match you to opportunities."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <section className="card card-body">
          <h2 className="font-semibold mb-4">Account</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="fullName">Full name</label>
              <input id="fullName" className="input" {...register('fullName', { required: 'Full name is required.' })} />
              {errors.fullName && <p className="field-error">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="label" htmlFor="phone">Phone (optional)</label>
              <input id="phone" className="input" {...register('phone')} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input bg-surface" value={authUser?.email || ''} readOnly />
              <p className="mt-1 text-xs text-muted">Email cannot be changed in this phase.</p>
            </div>
          </div>
        </section>

        {isSeeker && (
          <section className="card card-body">
            <h2 className="font-semibold mb-4">Job seeker details</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="label" htmlFor="headline">Headline</label>
                <input id="headline" className="input" placeholder="e.g. Frontend Developer · React + Node.js"
                  {...register('jobSeeker.headline')} />
              </div>
              <div className="md:col-span-2">
                <label className="label" htmlFor="bio">Short bio</label>
                <textarea id="bio" rows={4} className="input" placeholder="A short summary of who you are and what you can do."
                  {...register('jobSeeker.bio')} />
              </div>
              <div>
                <label className="label" htmlFor="location">Location</label>
                <input id="location" className="input" placeholder="Kigali, Rwanda"
                  {...register('jobSeeker.location')} />
              </div>
              <div>
                <label className="label" htmlFor="careerInterests">Career interests</label>
                <input id="careerInterests" className="input" placeholder="Frontend, mobile, data"
                  {...register('jobSeeker.careerInterests')} />
              </div>
              <div>
                <label className="label" htmlFor="preferredWorkMode">Preferred work mode</label>
                <select id="preferredWorkMode" className="input" {...register('jobSeeker.preferredWorkMode')}>
                  {WORK_MODES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="preferredEmploymentType">Preferred employment type</label>
                <select id="preferredEmploymentType" className="input" {...register('jobSeeker.preferredEmploymentType')}>
                  {EMPLOYMENT_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="githubUrl">GitHub URL</label>
                <input id="githubUrl" className="input" placeholder="https://github.com/…"
                  {...register('jobSeeker.githubUrl', urlRule)} />
                {errors.jobSeeker?.githubUrl && <p className="field-error">{errors.jobSeeker.githubUrl.message}</p>}
              </div>
              <div>
                <label className="label" htmlFor="linkedinUrl">LinkedIn URL</label>
                <input id="linkedinUrl" className="input" placeholder="https://linkedin.com/in/…"
                  {...register('jobSeeker.linkedinUrl', urlRule)} />
                {errors.jobSeeker?.linkedinUrl && <p className="field-error">{errors.jobSeeker.linkedinUrl.message}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="label" htmlFor="portfolioUrl">Portfolio URL</label>
                <input id="portfolioUrl" className="input" placeholder="https://…"
                  {...register('jobSeeker.portfolioUrl', urlRule)} />
                {errors.jobSeeker?.portfolioUrl && <p className="field-error">{errors.jobSeeker.portfolioUrl.message}</p>}
              </div>
            </div>
          </section>
        )}

        <ErrorAlert message={error} />

        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
