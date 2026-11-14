import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  buildIndiaPhone,
  fetchPanditMe,
  getErrorMessage,
  logoutSession,
  requestOtp,
  verifyOtp,
} from '../lib/api';
import {
  PRIVACY_POLICY_PATH,
  TERMS_PATH,
} from '../lib/legal';
import { usePanditStore } from '../store/usePanditStore';
import styles from './Login.module.css';

const RESEND_SECONDS = 30;
const SUPPORT_EMAIL = 'admininfo@pandittalk.com';

function isNotRegisteredPanditError(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false;
  if (err.response?.status !== 403) return false;
  const msg = getErrorMessage(err).toLowerCase();
  return (
    msg.includes('not registered') ||
    msg.includes('pandittalk expert') ||
    msg.includes('dashboard access')
  );
}

export function Login() {
  const navigate = useNavigate();
  const accessToken = usePanditStore((state) => state.accessToken);
  const authHydrated = usePanditStore((state) => state.authHydrated);
  const setAuth = usePanditStore((state) => state.setAuth);
  const setPanditInfo = usePanditStore((state) => state.setPanditInfo);
  const clearLocalAuth = usePanditStore((state) => state.clearLocalAuth);

  const [phoneDigits, setPhoneDigits] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [notRegistered, setNotRegistered] = useState(false);

  useEffect(() => {
    if (authHydrated && accessToken && !notRegistered) {
      navigate('/dashboard', { replace: true });
    }
  }, [accessToken, authHydrated, navigate, notRegistered]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendIn]);

  if (!authHydrated) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.brandPanel}>
            <p className={styles.brandMark}>PanditTalk</p>
            <p className={styles.brandLine}>
              Restoring your workspace with care…
            </p>
            <div className={styles.splashBars} aria-hidden>
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className={styles.formPanel}>
            <div className={styles.card}>
              <div className={styles.splashSkeleton}>
                <div />
                <div />
                <div />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const phoneE164 = buildIndiaPhone(phoneDigits);
  const phoneValid = phoneDigits.replace(/\D/g, '').length === 10;
  const otpValid = /^\d{4}$/.test(otp);

  async function handleSendOtp() {
    if (!phoneValid) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    if (!legalAccepted) {
      setError('Please accept the Terms & Conditions and Privacy Policy');
      return;
    }
    setLoading(true);
    setError(null);
    setNotRegistered(false);
    try {
      await requestOtp(phoneE164, 'dashboard');
      setOtpSent(true);
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      if (isNotRegisteredPanditError(err)) {
        setNotRegistered(true);
        setOtpSent(false);
        setError(null);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!otpValid) {
      setError('Enter the 4-digit OTP');
      return;
    }
    if (!legalAccepted) {
      setError('Please accept the Terms & Conditions and Privacy Policy');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await verifyOtp(phoneE164, otp, true, 'dashboard');
      const user = response.user[0];
      if (!user) {
        setError('Invalid login response');
        return;
      }
      setAuth(response.accessToken, user.id);

      try {
        const pandit = await fetchPanditMe();
        setPanditInfo(pandit.id, pandit.name, pandit.isOnline);
        navigate('/dashboard', { replace: true });
      } catch {
        await logoutSession().catch(() => clearLocalAuth());
        setNotRegistered(true);
        setOtpSent(false);
        setOtp('');
        setError(null);
      }
    } catch (err) {
      if (isNotRegisteredPanditError(err)) {
        setNotRegistered(true);
        setOtpSent(false);
        setOtp('');
        setError(null);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }

  function handleChangeNumber() {
    setOtpSent(false);
    setOtp('');
    setResendIn(0);
    setError(null);
    setNotRegistered(false);
  }

  function handleTryAgain() {
    setNotRegistered(false);
    setError(null);
    setOtpSent(false);
    setOtp('');
    setResendIn(0);
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.brandPanel}>
          <p className={styles.brandMark}>PanditTalk</p>
          <p className={styles.brandLine}>
            A calm workspace for sessions, availability, and the guidance you
            publish.
          </p>
          <p className={styles.brandTrust}>For approved PanditTalk experts</p>
        </div>

        <div className={styles.formPanel}>
          <div className={styles.card}>
            {notRegistered ? (
              <div className={styles.denied}>
                <p className={styles.deniedEyebrow}>Access restricted</p>
                <h1 className={styles.title}>Not a registered pandit</h1>
                <p className={styles.deniedBody}>
                  <strong>+91 {phoneDigits || '••••••••••'}</strong> is not linked
                  to a PanditTalk expert account. This dashboard is only for
                  approved pandits.
                </p>
                <p className={styles.deniedBody}>
                  If you are an expert waiting for access, contact the PanditTalk
                  admin team and ask them to register your number.
                </p>
                <a
                  className={`btn btnPrimary ${styles.button}`}
                  href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                    'Pandit dashboard access request',
                  )}&body=${encodeURIComponent(
                    `Hello PanditTalk team,\n\nPlease register my number +91 ${phoneDigits} for the pandit dashboard.\n\nThank you.`,
                  )}`}
                >
                  Contact admin
                </a>
                <p className={styles.deniedMeta}>
                  Or email{' '}
                  <a className={styles.consentLink} href={`mailto:${SUPPORT_EMAIL}`}>
                    {SUPPORT_EMAIL}
                  </a>
                </p>
                <div className={styles.deniedActions}>
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={handleTryAgain}
                  >
                    Try a different number
                  </button>
                  <Link to="/contact" className={styles.linkBtn}>
                    Contact page
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <h1 className={styles.title}>Sign in</h1>
                <p className={styles.subtitle}>
                  Use your registered expert mobile number and OTP
                </p>

                <label className={styles.label} htmlFor="phone">
                  Mobile number
                </label>
                <div className={styles.phoneRow}>
                  <span className={styles.prefix}>+91</span>
                  <input
                    id="phone"
                    className={styles.input}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="9876543210"
                    maxLength={10}
                    value={phoneDigits}
                    onChange={(e) =>
                      setPhoneDigits(
                        e.target.value.replace(/\D/g, '').slice(0, 10),
                      )
                    }
                    disabled={loading || otpSent}
                  />
                </div>

                <label className={styles.consentRow}>
                  <input
                    type="checkbox"
                    className={styles.consentCheckbox}
                    checked={legalAccepted}
                    onChange={(e) => setLegalAccepted(e.target.checked)}
                    disabled={loading}
                  />
                  <span className={styles.consentText}>
                    I am 18+ and agree to the{' '}
                    <Link
                      to={TERMS_PATH}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.consentLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Terms &amp; Conditions
                    </Link>{' '}
                    and{' '}
                    <Link
                      to={PRIVACY_POLICY_PATH}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.consentLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </label>

                {!otpSent ? (
                  <button
                    type="button"
                    className={`btn btnPrimary ${styles.button}`}
                    onClick={() => void handleSendOtp()}
                    disabled={loading || !phoneValid || !legalAccepted}
                  >
                    {loading ? 'Checking…' : 'Send OTP'}
                  </button>
                ) : (
                  <div className={styles.otpSection}>
                    <div className={styles.otpMeta}>
                      <span>Code sent to +91 {phoneDigits}</span>
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={handleChangeNumber}
                        disabled={loading}
                      >
                        Change number
                      </button>
                    </div>
                    <label className={styles.label} htmlFor="otp">
                      OTP
                    </label>
                    <input
                      id="otp"
                      className={styles.input}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="4-digit code"
                      maxLength={4}
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))
                      }
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className={`btn btnPrimary ${styles.button}`}
                      onClick={() => void handleVerify()}
                      disabled={loading || !otpValid || !legalAccepted}
                    >
                      {loading ? 'Verifying…' : 'Verify & continue'}
                    </button>
                    <div
                      className={styles.otpMeta}
                      style={{ marginTop: '0.85rem' }}
                    >
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => void handleSendOtp()}
                        disabled={loading || resendIn > 0}
                      >
                        {resendIn > 0
                          ? `Resend in ${resendIn}s`
                          : 'Resend OTP'}
                      </button>
                    </div>
                  </div>
                )}

                {error ? <p className={styles.error}>{error}</p> : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
