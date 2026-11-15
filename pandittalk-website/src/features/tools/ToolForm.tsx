"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { LinkKeyboardGroup } from "@/components/site/LinkKeyboardGroup";
import { NotifyOpenForm } from "@/components/site/NotifyOpenForm";
import { api } from "@/lib/api/client";
import { todayIstIso } from "@/lib/time/ist";
import { birthPayload, signs, validateResult, type ToolKind } from "./schemas";
import { Reading } from "./Reading";

export function BirthFields({ prefix = "", title = "Birth details" }: { prefix?: string; title?: string }) {
  const [coordError, setCoordError] = useState("");
  const coordErrorRef = useRef<HTMLParagraphElement>(null);
  const helpId = prefix + "coordinates-help";
  const errorId = prefix + "coordinates-error";
  useEffect(() => {
    if (coordError) requestAnimationFrame(() => coordErrorRef.current?.focus());
  }, [coordError]);
  function clearOnEscape(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Escape' || !event.currentTarget.value) return;
    event.preventDefault();
    event.currentTarget.value = '';
  }
  return <fieldset className="panel stack">
    <legend>{title}</legend>
    <label className="field">{prefix ? "Name" : "First name"}<input name={prefix + (prefix ? "name" : "firstName")} autoComplete={prefix ? "off" : "given-name"} autoCapitalize="words" enterKeyHint="next" required maxLength={100} onKeyDown={clearOnEscape} /></label>
    {!prefix && <label className="field">Last name<input name="lastName" autoComplete="family-name" autoCapitalize="words" enterKeyHint="next" maxLength={100} required onKeyDown={clearOnEscape} /></label>}
    <label className="field">Birth date (IST calendar day)<input type="date" name={prefix + "dob"} max={todayIstIso()} required enterKeyHint="next" aria-describedby={prefix + "dob-help"} onKeyDown={clearOnEscape} /></label>
    <small id={prefix + "dob-help"}>Use the calendar day in Indian Standard Time. Press Escape to clear a focused field.</small>
    <label className="field">Birth time (Indian Standard Time)<input type="time" name={prefix + "timeOfBirth"} required enterKeyHint="next" aria-describedby={prefix + "tob-help"} onKeyDown={clearOnEscape} /></label>
    <small id={prefix + "tob-help"}>Enter the known birth time in IST. Do not guess — unknown time or births outside India cannot be fixed by this free tool. A Pandit can help when No Timer opens; prepare a draft meanwhile. Press Escape to clear.</small>
    <label className="field">Birth city, India<input name={prefix + "placeOfBirth"} required maxLength={255} placeholder="e.g. Delhi" autoComplete="address-level2" autoCapitalize="words" enterKeyHint="next" onKeyDown={clearOnEscape} /></label>
    <label className="field">Coordinates (optional)<input name={prefix + "coordinates"} maxLength={50} placeholder="28.6139, 77.2090" autoComplete="off" enterKeyHint="done" inputMode="decimal" aria-describedby={coordError ? `${helpId} ${errorId}` : helpId} aria-invalid={coordError ? true : undefined} onKeyDown={event => {
      if (event.key !== 'Escape') return;
      if (!event.currentTarget.value && !coordError) return;
      event.preventDefault();
      event.currentTarget.value = '';
      setCoordError('');
    }} onBlur={event => {
      const value = event.currentTarget.value.trim();
      if (!value) { setCoordError(""); return; }
      const parts = value.split(",").map(Number);
      if (parts.length !== 2 || !parts.every(Number.isFinite) || Math.abs(parts[0]) > 90 || Math.abs(parts[1]) > 180) setCoordError("Enter latitude, then longitude, within valid bounds.");
      else setCoordError("");
    }} /></label>
    <small id={helpId}>If known, enter latitude, then longitude, separated by a comma. Press Escape to clear.</small>
    {coordError && <p id={errorId} className="error" role="alert" aria-label="Coordinates field error" aria-atomic="true" tabIndex={-1} ref={coordErrorRef} onKeyDown={event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setCoordError('');
      requestAnimationFrame(() => {
        const field = document.querySelector<HTMLInputElement>(`input[name="${prefix}coordinates"]`);
        field?.focus();
      });
    }}>{coordError} Press Escape to clear and return to the coordinates field.</p>}
    <p className="expert-meta">Birth calculations currently support Indian Standard Time. Unknown time or births outside India cannot be fixed by this free tool — please do not guess. A Pandit can help when No Timer opens; prepare a draft meanwhile. <span className="sr-only" id={`${prefix}birth-next-hint`}>Arrow keys move between Explore Pandits, Prepare a draft and free tools. Escape blurs. Skip remains site-content.</span> <LinkKeyboardGroup as="span" aria-label="Birth details next steps" aria-describedby={`${prefix}birth-next-hint`}><Link className="text-link" href="/pandits">Explore Pandits</Link> · <Link className="text-link" href="/guidance/start">Prepare a draft</Link> · <Link className="text-link" href="/tools">Other free tools</Link></LinkKeyboardGroup>.</p>
  </fieldset>;
}

const titles = { kundli: "Your Kundli", compatibility: "Relationship compatibility", horoscope: "Daily horoscope", tarot: "Draw a tarot card", "palm-reading": "Palm reading" };

async function compressPalmDataUrl(dataUrl: string, maxBytes: number): Promise<string> {
  if (typeof createImageBitmap === 'undefined') {
    if (dataUrl.length * 0.75 > maxBytes) throw new Error('too large');
    return dataUrl;
  }
  const blob = await (await fetch(dataUrl)).blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  const maxEdge = 1200;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  let quality = 0.85;
  let out = canvas.toDataURL('image/jpeg', quality);
  while (out.length * 0.75 > maxBytes && quality > 0.4) {
    quality -= 0.1;
    out = canvas.toDataURL('image/jpeg', quality);
  }
  if (out.length * 0.75 > maxBytes) throw new Error('too large');
  return out;
}

export default function ToolForm({ kind }: { kind: ToolKind }) {
  const [result, setResult] = useState<Record<string, unknown>>();
  const [savedCopy, setSavedCopy] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [palms, setPalms] = useState<Record<string, string>>({});
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const [card, setCard] = useState(0);
  const [sign, setSign] = useState("");
  const [signHint, setSignHint] = useState("");
  const [printNote, setPrintNote] = useState("");
  const readers = useRef<Record<string, FileReader>>({});
  const palmInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const signHintRef = useRef<HTMLParagraphElement>(null);
  const printNoteRef = useRef<HTMLParagraphElement>(null);
  const readingImages = Object.values(imageLoading).some(Boolean);
  const palmMissing = kind === "palm-reading" && (!palms.left || !palms.right);
  const savedReadingKey = `pandittalk.reading.${kind}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(savedReadingKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { data?: unknown };
      if (!parsed.data || typeof parsed.data !== 'object') throw new Error('invalid saved reading');
      setResult(validateResult(kind, parsed.data));
      setSavedCopy(true);
      setSaveStatus('Saved reading restored from this browser.');
    } catch {
      try { localStorage.removeItem(savedReadingKey); } catch { /* ignore unavailable storage */ }
    }
  }, [kind, savedReadingKey]);

  useEffect(() => {
    if (kind !== "horoscope") return;
    const raw = new URLSearchParams(location.search).get("sign")?.toLowerCase().trim() || "";
    if (!raw) { setSignHint(""); return; }
    if (signs.includes(raw)) {
      setSign(raw);
      setSignHint("");
      return;
    }
    setSignHint(`“${raw}” is not a recognised zodiac sign. Choose one of the twelve signs below.`);
  }, [kind]);

  useEffect(() => {
    if (signHint) requestAnimationFrame(() => signHintRef.current?.focus());
  }, [signHint]);

  useEffect(() => {
    const activeReaders = readers.current;
    return () => Object.values(activeReaders).forEach(reader => { if (reader.readyState === FileReader.LOADING) reader.abort(); });
  }, []);

  function imageFile(side: string, event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    readers.current[side]?.abort();
    delete readers.current[side];
    setPalms(previous => { const next = { ...previous }; delete next[side]; return next; });
    setImageLoading(previous => ({ ...previous, [side]: false }));
    setError("");
    if (!file) return;
    const name = file.name.toLowerCase();
    if (name.endsWith('.heic') || name.endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif') {
      input.value = "";
      setError(`HEIC photos cannot be used for your ${side} palm. Any previous ${side} photo was cleared — export or save as JPEG, PNG or WebP first.`);
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      input.value = "";
      setError(`Choose a clear palm photo (JPEG, PNG or WebP) for your ${side} palm. Any previous ${side} photo was cleared.`);
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      input.value = "";
      setError(`That ${side} palm photo is too large. Any previous ${side} photo was cleared — please use a photo under 8 MB.`);
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    const reader = new FileReader();
    readers.current[side] = reader;
    setImageLoading(previous => ({ ...previous, [side]: true }));
    reader.onload = async () => {
      if (readers.current[side] !== reader) return;
      try {
        const dataUrl = await compressPalmDataUrl(String(reader.result), 300 * 1024);
        setPalms(previous => ({ ...previous, [side]: dataUrl }));
      } catch {
        input.value = "";
        setPalms(previous => { const next = { ...previous }; delete next[side]; return next; });
        setError(`We could not prepare your ${side} palm photo. Any previous ${side} photo was cleared — use a clear JPEG, PNG or WebP under 8 MB, or try a closer crop.`);
        requestAnimationFrame(() => errorRef.current?.focus());
      } finally {
        setImageLoading(previous => ({ ...previous, [side]: false }));
      }
    };
    reader.onerror = () => {
      if (readers.current[side] !== reader) return;
      input.value = "";
      setImageLoading(previous => ({ ...previous, [side]: false }));
      setError(`We could not read your ${side} palm photo. Any previous ${side} photo was cleared — please choose it again.`);
      requestAnimationFrame(() => errorRef.current?.focus());
    };
    reader.readAsDataURL(file);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || readingImages) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      let body: object = {};
      if (kind === "kundli") body = { ...birthPayload(form), firstName: String(form.get("firstName")).trim(), lastName: String(form.get("lastName")).trim(), detailed: false };
      if (kind === "compatibility") body = { person1: { ...birthPayload(form, "a"), name: String(form.get("aname")).trim() }, person2: { ...birthPayload(form, "b"), name: String(form.get("bname")).trim() }, detailed: false };
      if (kind === "horoscope") {
        const chosen = String(form.get("sign") || sign).toLowerCase().trim();
        if (!signs.includes(chosen)) throw new Error("Choose a zodiac sign before requesting a daily reading.");
        body = { sign: chosen, type: "daily" };
      }
      if (kind === "tarot") {
        if (card < 1 || card > 3) throw new Error("Select a card back before revealing your draw.");
        body = { focus: card };
      }
      if (kind === "palm-reading") {
        if (!palms.left || !palms.right) throw new Error("Select both palm images.");
        body = { leftPalmImage: palms.left.split(",")[1], rightPalmImage: palms.right.split(",")[1] };
      }
      setResult(validateResult(kind, await api("/tools/" + kind, { method: "POST", body: JSON.stringify(body) })));
      requestAnimationFrame(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        resultHeading.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        resultHeading.current?.focus({ preventScroll: true });
      });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Reading unavailable. Your details are still here; please try again.");
      requestAnimationFrame(() => {
        errorRef.current?.focus();
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        errorRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      });
    } finally { setBusy(false); }
  }

  function clearPalm(side: string) {
    readers.current[side]?.abort();
    delete readers.current[side];
    setPalms(previous => { const next = { ...previous }; delete next[side]; return next; });
    setImageLoading(previous => ({ ...previous, [side]: false }));
    const input = palmInputs.current[side];
    if (input) input.value = "";
    setError("");
    requestAnimationFrame(() => palmInputs.current[side]?.focus());
  }

  function saveReadingToDevice() {
    if (!result) return;
    try {
      localStorage.setItem(savedReadingKey, JSON.stringify({ data: result }));
      setSavedCopy(true);
      setSaveStatus('Saved on this browser. Only this device can access this copy until you remove it.');
    } catch {
      setSaveStatus('This browser could not save a copy. You can still print or save a PDF instead.');
    }
  }

  function removeSavedReading() {
    try { localStorage.removeItem(savedReadingKey); } catch { /* ignore unavailable storage */ }
    setSavedCopy(false);
    setSaveStatus('Saved copy removed from this browser.');
  }

  const formFields = <>
    <fieldset className="stack" disabled={busy || readingImages}>
      <legend className="sr-only">Prepare your reading</legend>
      {kind === "kundli" && <BirthFields />}
      {kind === "compatibility" && <>
        <div className="grid"><BirthFields prefix="a" title="First person" /><BirthFields prefix="b" title="Second person" /></div>
        <label className="check"><input required type="checkbox" name="permission" /><span>I have permission to use both people&apos;s birth details.</span></label>
      </>}
      {kind === "horoscope" && <>
        <p id="zodiac-sign-label" className="field" style={{ marginBottom: 0 }}>Zodiac sign</p>
        <input type="hidden" name="sign" value={sign} />
        {signHint && <p id="zodiac-sign-hint" className="error" role="alert" aria-label="Zodiac sign hint" aria-atomic="true" tabIndex={-1} ref={signHintRef} onKeyDown={event => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          setSignHint('');
          const first = document.querySelector<HTMLButtonElement>('.zodiac-sign-grid button[type="button"]');
          first?.focus();
        }}>{signHint} Press Escape to dismiss and choose a sign.</p>}
        <div
          className="actions zodiac-sign-grid"
          role="group"
          aria-labelledby="zodiac-sign-label"
          aria-describedby={signHint ? "zodiac-sign-hint zodiac-sign-keys zodiac-sign-help" : "zodiac-sign-keys zodiac-sign-help"}
          onKeyDown={event => {
            if (!(event.target instanceof HTMLButtonElement)) return;
            const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button[type="button"]'));
            const index = buttons.indexOf(event.target);
            if (index < 0) return;
            if (event.key === 'Escape' && sign) {
              event.preventDefault();
              setSign('');
              setSignHint('');
              const url = new URL(location.href);
              url.searchParams.delete('sign');
              history.replaceState(null, '', url.pathname + (url.search || ''));
              buttons[0]?.focus();
              return;
            }
            let next = index;
            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % buttons.length;
            else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + buttons.length) % buttons.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = buttons.length - 1;
            else return;
            event.preventDefault();
            const chosen = signs[next];
            if (chosen) {
              setSign(chosen);
              setSignHint('');
              const url = new URL(location.href);
              url.searchParams.set('sign', chosen);
              history.replaceState(null, '', url.pathname + url.search);
            }
            buttons[next]?.focus();
          }}
        >
          {signs.map(item => (
            <button
              type="button"
              key={item}
              className={sign === item ? "button" : "button secondary"}
              aria-pressed={sign === item}
              onClick={() => {
                setSign(item);
                setSignHint("");
                const url = new URL(location.href);
                url.searchParams.set("sign", item);
                history.replaceState(null, "", url.pathname + url.search);
              }}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
        <p className="sr-only" id="zodiac-sign-keys">Arrow keys move between signs. Home and End jump to the first or last. Escape clears a selected sign. Skip remains site-content.</p>
        <p className="expert-meta" role="status" aria-live="polite">{sign ? `${sign.charAt(0).toUpperCase() + sign.slice(1)} selected. Press Escape to clear.` : "Choose one of the twelve signs. Arrow keys move between options."}</p>
        <p id="zodiac-sign-help" className="expert-meta">Share a direct link like <code>/tools/horoscope?sign=aries</code>. Paid monthly reports remain <Link className="text-link" href="/tools/monthly-horoscope">paused</Link>.</p>
      </>}
      {kind === "palm-reading" && <>
        <p className="notice" id="palm-photo-help">Both photos are sent for AI image processing when you request a reading. Clear palm photos work best (JPEG, PNG or WebP). Large phone photos are compressed automatically before upload. No medical or lifespan prediction is offered. Press Escape on a chosen photo to clear it.</p>
        <div className="grid">
          {["left", "right"].map(side => <div className="panel stack" key={side}>
            <label className="field">{side === "left" ? "Left" : "Right"} palm photo<input ref={node => { palmInputs.current[side] = node; }} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" capture="environment" aria-describedby={error.includes("palm") ? "palm-photo-help tool-form-error" : "palm-photo-help"} aria-invalid={error.toLowerCase().includes(side) || (error.includes("palm") && !palms[side]) ? true : undefined} onChange={event => imageFile(side, event)} onKeyDown={event => {
              if (event.key !== 'Escape' || (!palms[side] && !event.currentTarget.value)) return;
              event.preventDefault();
              clearPalm(side);
            }} /></label>
            {imageLoading[side] && <p role="status">Preparing your photo…</p>}
            {palms[side] && <>
              <img src={palms[side]} alt={side + " palm preview"} width={200} height={200} style={{ objectFit: "contain" }} />
              <button type="button" className="button secondary" onClick={() => clearPalm(side)} onKeyDown={event => {
                if (event.key !== 'Escape') return;
                event.preventDefault();
                clearPalm(side);
              }}>Clear {side} photo</button>
            </>}
          </div>)}
        </div>
        <label className="check"><input type="checkbox" name="palmConsent" required /><span>I consent to sending these palm images for automated interpretation.</span></label>
      </>}
      {kind === "tarot" && <>
        <p id="tarot-intro">Hold a question in mind, choose a card back, then reveal a randomly drawn Major Arcana card. The back you pick only focuses the draw — it does not choose which Major Arcana appears.</p>
        <div
          className="actions tarot-card-backs"
          role="radiogroup"
          aria-labelledby="tarot-intro"
          aria-describedby="tarot-card-keys"
          onKeyDown={event => {
            const backs = [1, 2, 3];
            const currentIndex = Math.max(0, backs.indexOf(card));
            if (event.key === 'Escape' && card) {
              event.preventDefault();
              setCard(0);
              const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]');
              buttons[0]?.focus();
              return;
            }
            let next = currentIndex;
            if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (currentIndex + 1) % backs.length;
            else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (currentIndex - 1 + backs.length) % backs.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = backs.length - 1;
            else return;
            event.preventDefault();
            setCard(backs[next]);
            const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]');
            buttons[next]?.focus();
          }}
        >
          {[1, 2, 3].map(number => (
            <button
              type="button"
              role="radio"
              aria-checked={card === number}
              tabIndex={card === number || (card === 0 && number === 1) ? 0 : -1}
              className={card === number ? "button" : "button secondary"}
              key={number}
              onClick={() => setCard(number)}
            >
              Card back {number}
            </button>
          ))}
        </div>
        <p className="sr-only" id="tarot-card-keys">Arrow keys move between card backs. Home and End jump to the first or last. Escape clears a selection. Skip remains site-content.</p>
        <p className="expert-meta" role="status" aria-live="polite">{card ? `Card back ${card} selected. Your Major Arcana draw stays random — ready to reveal. Escape clears the selection.` : "Select one of the three card backs to begin. Arrow keys move between backs."}</p>
      </>}
    </fieldset>
    {error && <p id="tool-form-error" className="error" role="alert" aria-label="Reading form error" aria-atomic="true" data-form-error="tool" tabIndex={-1} ref={errorRef} onKeyDown={event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setError('');
      requestAnimationFrame(() => {
        const form = document.querySelector<HTMLFormElement>('main form');
        const invalid = form?.querySelector<HTMLElement>('[aria-invalid="true"]');
        (invalid || form?.querySelector<HTMLElement>('input, select, textarea, button'))?.focus();
      });
    }}>{error} Press Escape to dismiss and return to the form.</p>}
    {error && (
      <>
        <p className="sr-only" id="tool-form-error-hint">Arrow keys move between Fix details, tools help, other tools, draft, support and booking updates. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Reading error recovery" aria-describedby="tool-form-error-hint">
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setError('');
              requestAnimationFrame(() => {
                const form = document.querySelector<HTMLFormElement>('main form');
                const invalid = form?.querySelector<HTMLElement>('[aria-invalid="true"]');
                (invalid || form?.querySelector<HTMLElement>('input, select, textarea, button'))?.focus();
              });
            }}
          >
            Fix details and try again
          </button>
          <Link className="button secondary" href="/help/tools-and-readings">Tools help</Link>
          <Link className="button secondary" href="/tools">Other free tools</Link>
          <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
          <Link className="text-link" href="/contact">Contact support →</Link>
          <Link className="text-link" href="/how-it-works#booking-availability-how">Booking updates →</Link>
        </LinkKeyboardGroup>
      </>
    )}
    <button type="submit" className="button" disabled={busy || readingImages || (kind === "tarot" && !card) || palmMissing} aria-busy={busy || readingImages || undefined}>{busy ? "Preparing your reading…" : readingImages ? "Preparing your photos…" : result ? "Generate another reading" : kind === "tarot" ? "Reveal card" : "Get free reading"}</button>
    {busy && <p className="expert-meta" role="status">Your reading is being prepared. This may take a moment.</p>}
  </>;

  return <main id="main-content" className="page stack tool-flow">
    <p className="eyebrow">A moment for reflection · Free tool</p>
    <h1>{titles[kind]}</h1>
    <p className="lede">An automated interpretation, labelled separately from a live Pandit conversation. Use it as a starting point for your own judgement.</p>
    <aside className="notice tool-privacy" aria-label="Before you start">
      <p><strong>Before you start</strong></p>
      <p>{kind === "palm-reading" ? "Palm photos are sent for automated image processing when you request a reading — choosing a photo does not upload it." : "Your details stay in this form until you request a reading. The tool is separate from bookings and does not charge coins."}</p>
      <p>This page does not save a copy on your device unless you choose to.</p>
      <p><Link className="text-link" href="/privacy">Privacy policy</Link> · <Link className="text-link" href="/help/tools-and-readings">Tools help</Link></p>
    </aside>
    {result ? (
      <>
        <section className="stack" aria-labelledby="reading-heading">
          <h2 id="reading-heading" tabIndex={-1} ref={resultHeading}>Your reading</h2>
          <Reading data={result} />
          <aside className="notice stack" aria-label="Keep this reading">
            <div>
              <h3>Keep this reading?</h3>
              <p>Save a copy only on this browser so you can return to it later. It will stay here until you remove it.</p>
              {saveStatus && <p role="status" aria-live="polite">{saveStatus}</p>}
            </div>
            <div className="actions" style={{ margin: 0 }}>
              {!savedCopy
                ? <button type="button" className="button secondary" onClick={saveReadingToDevice}>Save this reading on this browser</button>
                : <button type="button" className="button secondary" onClick={removeSavedReading}>Remove saved copy</button>}
            </div>
          </aside>
          <aside className="panel stack">
            <h3>Bookings paused — prepare a draft next</h3>
            <p>Automated tools offer reflection. When you want a human conversation, prepare a private draft. New No Timer bookings are not open yet — preparing a draft does not create a charge.</p>
            <p className="sr-only" id="tool-reading-next-hint">Arrow keys move between next-step links. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</p>
            <LinkKeyboardGroup className="actions" aria-label="After your reading" aria-describedby="tool-reading-next-hint">
              <Link className="button" href="/guidance/start">Prepare a draft</Link>
              <Link className="button secondary" href="/pandits">Explore Pandits</Link>
              <Link className="button secondary" href="/tools">More free tools</Link>
              <Link className="text-link" href="/how-it-works#booking-availability-how">Get booking updates →</Link>
              <Link className="text-link" href="/contact">Contact support →</Link>
            </LinkKeyboardGroup>
            <p className="expert-meta">Leave your email if you want a note when No Timer opens.</p>
            <NotifyOpenForm source={`website_after_reading_${kind}`} />
          </aside>
          <p className="sr-only" id="reading-tools-hint">Arrow keys move between Clear and Print. Escape blurs the focused control. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Reading tools" aria-describedby="reading-tools-hint">
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setResult(undefined);
                setError('');
                setCard(0);
                setSignHint('');
                Object.keys(palms).forEach(side => clearPalm(side));
                requestAnimationFrame(() => {
                  const form = document.getElementById('main-content')?.querySelector('form');
                  const details = form?.closest('details');
                  if (details) details.open = true;
                  const first = form?.querySelector<HTMLElement>('input:not([type="hidden"]), select, textarea, button:not([type="submit"])');
                  (first || form?.querySelector<HTMLElement>('button, input, select'))?.focus();
                });
              }}
            >
              Clear reading and start again
            </button>
            <button
              type="button"
              className="button secondary no-print"
              aria-describedby="tool-print-help"
              onClick={() => {
                window.print();
                setPrintNote('Print dialog opened. Choose “Save as PDF” if you want a file copy — nothing is emailed.');
                requestAnimationFrame(() => printNoteRef.current?.focus());
              }}
            >
              Print or save as PDF
            </button>
            <Link className="text-link" href="/tools">More free tools →</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
          <p id="tool-print-help" className="expert-meta no-print">Uses your browser print dialog. Printing does not create a booking or charge. Press Escape to dismiss the print status.</p>
          {printNote && <p className="notice no-print" role="status" tabIndex={-1} ref={printNoteRef} aria-live="polite" onKeyDown={event => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            setPrintNote('');
          }}>{printNote} Press Escape to dismiss.</p>}
        </section>
        <details className="panel" open>
          <summary>Edit details &amp; generate again</summary>
          <form onSubmit={submit} className="stack" aria-busy={busy || readingImages} style={{ marginTop: 16 }}>
            {formFields}
          </form>
        </details>
      </>
    ) : (
      <form onSubmit={submit} className="stack" aria-busy={busy || readingImages}>
        {formFields}
      </form>
    )}
  </main>;
}
