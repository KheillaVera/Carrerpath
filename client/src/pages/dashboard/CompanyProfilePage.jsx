import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import {
  Building2, ExternalLink, Loader2, Save, ShieldAlert, ShieldCheck, ShieldX,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import PageHeader from '../../components/PageHeader';
import ErrorAlert from '../../components/ErrorAlert';
import Avatar from '../../components/Avatar';
import { SkeletonForm } from '../../components/Skeleton';
import { urlRule, emailRule, phoneRule } from '../../services/validation';

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

const VERIFICATION = {
  pending: {
    icon: ShieldAlert,
    className: 'alert-warn',
    title: 'Verification pending',
    message: 'An administrator has not reviewed this company yet. You can still post opportunities — they are labelled as coming from an unverified employer.',
  },
  verified: {
    icon: ShieldCheck,
    className: 'alert-success',
    title: 'Verified company',
    message: 'Candidates see a verified badge on your postings and on your public page.',
  },
  rejected: {
    icon: ShieldX,
    className: 'alert-danger',
    title: 'Verification rejected',
    message: 'An administrator could not verify this company. Update your details and contact support to be reviewed again.',
  },
};

function VerificationBanner({ company }) {
  const state = VERIFICATION[company.verificationStatus] || VERIFICATION.pending;
  const Icon = state.icon;
  return (
    <div className={state.className}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>
        <div className="font-medium">{state.title}</div>
        <div className="mt-0.5">{state.message}</div>
        {company.verificationNote && (
          <div className="mt-1.5 italic">Administrator note: {company.verificationNote}</div>
        )}
      </div>
    </div>
  );
}

function FormSection({ title, hint, children }) {
  return (
    <section className="border-t border-line px-5 py-6 first:border-t-0">
      <div className="grid gap-5 lg:grid-cols-[14rem_1fr]">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {hint && <p className="mt-1 text-xs text-muted text-pretty">{hint}</p>}
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}

export default function CompanyProfilePage() {
  const toast = useToast();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting, isDirty } } = useForm({
    defaultValues: {
      name: '', tagline: '', description: '', industry: '', companySize: '',
      foundedYear: '', websiteUrl: '', location: '', district: '',
      contactEmail: '', contactPhone: '',
    },
  });
  const watchedName = watch('name');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/companies/mine');
        if (cancelled) return;
        setCompany(data.company);
        if (data.company) {
          reset({
            name: data.company.name || '',
            tagline: data.company.tagline || '',
            description: data.company.description || '',
            industry: data.company.industry || '',
            companySize: data.company.companySize || '',
            foundedYear: data.company.foundedYear || '',
            websiteUrl: data.company.websiteUrl || '',
            location: data.company.location || '',
            district: data.company.district || '',
            contactEmail: data.company.contactEmail || '',
            contactPhone: data.company.contactPhone || '',
          });
        }
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
    const payload = { ...values };
    // Empty optional numbers must not be sent as '' — the API validates them as integers.
    if (!payload.foundedYear) delete payload.foundedYear;
    if (!payload.companySize) delete payload.companySize;

    try {
      const { data } = company
        ? await api.patch(`/companies/${company.id}`, payload)
        : await api.post('/companies', payload);
      setCompany(data.company);
      reset(values, { keepValues: true });
      toast.success(company ? 'Company profile updated' : 'Company profile created',
        company ? null : 'You can now post opportunities.');
    } catch (err) {
      setError(err.details?.[0]?.message || err.message);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Company profile" description="Candidates see this on every opportunity you post." />
        <SkeletonForm fields={5} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Company profile"
        description="Candidates see this profile on every opportunity you post. A complete profile earns more applications."
        actions={company && (
          <Link to={`/companies/${company.slug}`} target="_blank" className="btn-secondary">
            <ExternalLink className="h-4 w-4" aria-hidden /> View public page
          </Link>
        )}
      />

      <div className="space-y-5">
        {company ? (
          <VerificationBanner company={company} />
        ) : (
          <div className="alert-warn">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div>
              <div className="font-medium">No company profile yet</div>
              <div className="mt-0.5">Create your company profile before posting opportunities.</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="card">
            {/* Identity preview keeps the abstract form fields tied to something real. */}
            <div className="flex items-center gap-4 border-b border-line px-5 py-5">
              <Avatar name={watchedName || 'New company'} size="lg" />
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-ink">
                  {watchedName || 'Your company name'}
                </div>
                <div className="mt-0.5 truncate text-xs text-muted">
                  {company ? `pathaura.rw/companies/${company.slug}` : 'A public page is created when you save.'}
                </div>
              </div>
            </div>

            <FormSection title="Identity" hint="The name candidates search for, and one line about what you do.">
              <div className="space-y-4">
                <div>
                  <label className="label" htmlFor="name">Company name</label>
                  <input id="name" className="input" {...register('name', { required: 'Company name is required.' })}
                         aria-invalid={!!errors.name} />
                  {errors.name && <p className="field-error">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="label" htmlFor="tagline">Tagline</label>
                  <input id="tagline" className="input" placeholder="What your company does, in one line" {...register('tagline')} />
                </div>
                <div>
                  <label className="label" htmlFor="description">About the company</label>
                  <textarea id="description" rows={5} className="input" {...register('description')} />
                  <p className="hint">Shown on your public company page above your open roles.</p>
                </div>
              </div>
            </FormSection>

            <FormSection title="Details" hint="Helps candidates judge whether you are the kind of place they want to work.">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="industry">Industry</label>
                  <input id="industry" className="input" placeholder="Software" {...register('industry')} />
                </div>
                <div>
                  <label className="label" htmlFor="companySize">Company size</label>
                  <select id="companySize" className="input" {...register('companySize')}>
                    <option value="">Not specified</option>
                    {COMPANY_SIZES.map((size) => <option key={size} value={size}>{size} employees</option>)}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="foundedYear">Founded</label>
                  <input id="foundedYear" type="number" className="input" placeholder="2019" {...register('foundedYear')} />
                </div>
                <div>
                  <label className="label" htmlFor="websiteUrl">Website</label>
                  <input id="websiteUrl" className="input" placeholder="https://…" {...register('websiteUrl', urlRule)} />
                  {errors.websiteUrl && <p className="field-error">{errors.websiteUrl.message}</p>}
                </div>
                <div>
                  <label className="label" htmlFor="location">Location</label>
                  <input id="location" className="input" placeholder="Kigali" {...register('location')} />
                </div>
                <div>
                  <label className="label" htmlFor="district">District</label>
                  <input id="district" className="input" placeholder="Gasabo" {...register('district')} />
                </div>
              </div>
            </FormSection>

            <FormSection title="Contact" hint="Where candidates can reach you outside the platform.">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="contactEmail">Contact email</label>
                  <input id="contactEmail" className="input" placeholder="jobs@company.rw" {...register('contactEmail', emailRule)} />
                  {errors.contactEmail && <p className="field-error">{errors.contactEmail.message}</p>}
                </div>
                <div>
                  <label className="label" htmlFor="contactPhone">Contact phone</label>
                  <input id="contactPhone" className="input" {...register('contactPhone', phoneRule)} />
                  {errors.contactPhone && <p className="field-error">{errors.contactPhone.message}</p>}
                </div>
              </div>
            </FormSection>
          </div>

          <ErrorAlert message={error} className="mt-4" />

          {/* Sticky action bar so Save is reachable from anywhere in a long form. */}
          <div className="sticky bottom-0 z-10 mt-4 flex items-center justify-between gap-3 rounded-lg border border-line bg-panel/90 px-4 py-3 backdrop-blur">
            <span className="text-xs text-muted">
              {isDirty ? 'You have unsaved changes.' : company ? 'All changes saved.' : 'Not created yet.'}
            </span>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
              {company ? 'Save changes' : 'Create company profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
