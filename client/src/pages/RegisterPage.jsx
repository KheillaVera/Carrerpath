import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AlertCircle, Building2, Check, Eye, EyeOff, GraduationCap, Loader2, Users } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout';
import ErrorAlert from '../components/ErrorAlert';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'job_seeker', label: 'Job seeker', hint: 'Student, graduate or skilled worker', icon: GraduationCap },
  { value: 'employer', label: 'Employer', hint: 'Hiring for a company', icon: Building2 },
  { value: 'training_provider', label: 'Training provider', hint: 'Offering courses', icon: GraduationCap },
  { value: 'mentor', label: 'Mentor', hint: 'Guiding job seekers', icon: Users },
];

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { role: 'job_seeker' },
  });
  const [formError, setFormError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const selectedRole = watch('role');
  const password = watch('password') || '';

  const rules = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'a letter', met: /[A-Za-z]/.test(password) },
    { label: 'a number', met: /[0-9]/.test(password) },
  ];

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      await signUp(values);
      navigate('/app', { replace: true });
    } catch (err) {
      if (err.details?.length) setFormError(err.details.map((d) => d.message).join(' '));
      else setFormError(err.message || 'Could not create your account.');
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      description="Build a profile from what you can actually do — it takes a few minutes."
      footer={<>Already have an account? <Link to="/login" className="link">Log in</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <fieldset>
          <legend className="label">I am a…</legend>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((role) => {
              const active = selectedRole === role.value;
              return (
                <label
                  key={role.value}
                  className={`relative flex cursor-pointer flex-col gap-0.5 rounded-md border p-3 transition-all duration-120 ease-out ${
                    active
                      ? 'border-accent/50 bg-accent-soft'
                      : 'border-line bg-panel hover:border-line-strong hover:bg-elevated'
                  }`}
                >
                  <input type="radio" value={role.value} className="sr-only" {...register('role')} />
                  <span className={`text-sm font-medium ${active ? 'text-accent' : 'text-ink'}`}>
                    {role.label}
                  </span>
                  <span className="text-2xs text-muted">{role.hint}</span>
                  {active && <Check className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-accent" aria-hidden />}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label className="label" htmlFor="fullName">Full name</label>
          <input
            id="fullName" className="input" placeholder="Your name" autoComplete="name"
            {...register('fullName', {
              required: 'Full name is required.',
              minLength: { value: 2, message: 'At least 2 characters.' },
            })}
            aria-invalid={!!errors.fullName}
          />
          {errors.fullName && (
            <p className="field-error"><AlertCircle className="h-3 w-3" aria-hidden /> {errors.fullName.message}</p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email" type="email" autoComplete="email" className="input" placeholder="you@example.rw"
            {...register('email', { required: 'Email is required.' })}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="field-error"><AlertCircle className="h-3 w-3" aria-hidden /> {errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="input pr-10"
              {...register('password', {
                required: 'Password is required.',
                minLength: { value: 8, message: 'At least 8 characters.' },
                validate: (v) => (/[A-Za-z]/.test(v) && /[0-9]/.test(v)) || 'Include a letter and a number.',
              })}
              aria-invalid={!!errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1.5 text-faint transition-colors hover:text-ink"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            </button>
          </div>
          {/* Live requirement feedback beats an error after submission. */}
          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1" aria-live="polite">
            {rules.map((rule) => (
              <li
                key={rule.label}
                className={`inline-flex items-center gap-1 text-2xs ${rule.met ? 'text-success' : 'text-faint'}`}
              >
                <Check className={`h-3 w-3 ${rule.met ? 'opacity-100' : 'opacity-40'}`} aria-hidden />
                {rule.label}
              </li>
            ))}
          </ul>
          {errors.password && (
            <p className="field-error"><AlertCircle className="h-3 w-3" aria-hidden /> {errors.password.message}</p>
          )}
        </div>

        <ErrorAlert message={formError} />

        <button type="submit" className="btn-primary btn-lg w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
