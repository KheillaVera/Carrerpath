import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout';
import ErrorAlert from '../components/ErrorAlert';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [formError, setFormError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      await signIn(values);
      const redirect = location.state?.from || '/app';
      navigate(redirect, { replace: true });
    } catch (err) {
      setFormError(err.message || 'Could not log in.');
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      description="Log in to continue building your profile and tracking your applications."
      footer={<>New here? <Link to="/register" className="link">Create an account</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email" type="email" autoComplete="email" className="input" placeholder="you@example.rw"
            {...register('email', { required: 'Email is required.' })}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p className="field-error" id="email-error">
              <AlertCircle className="h-3 w-3" aria-hidden /> {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="input pr-10"
              {...register('password', { required: 'Password is required.' })}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
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
          {errors.password && (
            <p className="field-error" id="password-error">
              <AlertCircle className="h-3 w-3" aria-hidden /> {errors.password.message}
            </p>
          )}
        </div>

        <ErrorAlert message={formError} />

        <button type="submit" className="btn-primary btn-lg w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <div className="mt-6 rounded-md border border-line bg-elevated/60 px-3.5 py-3">
        <div className="section-label">Demonstration accounts</div>
        <dl className="mt-2 space-y-1 text-xs text-muted">
          {[
            ['Job seeker', 'seeker@demo.rw'],
            ['Employer', 'employer@demo.rw'],
            ['Administrator', 'admin@demo.rw'],
          ].map(([role, email]) => (
            <div key={email} className="flex items-center justify-between gap-3">
              <dt>{role}</dt>
              <dd className="font-mono text-2xs text-ink-soft">{email}</dd>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 border-t border-line pt-1.5">
            <dt>Password</dt>
            <dd className="font-mono text-2xs text-ink-soft">Demo1234</dd>
          </div>
        </dl>
      </div>
    </AuthLayout>
  );
}
