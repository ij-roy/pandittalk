import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { getErrorMessage } from '../lib/api';
import { htmlToMarkdown, markdownToHtml } from '../lib/markdown';
import {
  ARTICLE_CATEGORIES,
  getMyArticle,
  publishMyArticle,
  unpublishMyArticle,
  updateMyArticle,
  uploadCover,
  type ArticleCategory,
  type ArticleLanguage,
  type PanditArticle,
} from '../lib/panditArticlesApi';
import { articlePublicUrl } from '../lib/site';
import styles from './ArticleEditor.module.css';

type PreviewMode = 'phone' | 'web';

function draftFingerprint(input: {
  title: string;
  slug: string;
  category: ArticleCategory;
  markdown: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  coverAlt: string;
}): string {
  return JSON.stringify(input);
}

export function ArticleEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<PanditArticle | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<ArticleCategory>('spirituality');
  const [excerpt, setExcerpt] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [coverAlt, setCoverAlt] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [preview, setPreview] = useState<PreviewMode>('web');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [scheduleAt, setScheduleAt] = useState('');
  const hydrated = useRef(false);
  const lastSaved = useRef('');
  const saveTimer = useRef<number | null>(null);

  const editor = useEditor({
    immediatelyRender: true,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
        },
      }),
      Placeholder.configure({
        placeholder: 'Write the article the way you would speak to a seeker…',
      }),
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: '',
    editorProps: {
      attributes: { class: styles.tiptap, spellcheck: 'true' },
    },
    onUpdate: ({ editor: instance }) => {
      setMarkdown(htmlToMarkdown(instance.getHTML()));
    },
  });

  useEffect(() => {
    if (!id) {
      navigate('/articles', { replace: true });
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    hydrated.current = false;
    void getMyArticle(id)
      .then((row) => {
        if (cancelled) return;
        setArticle(row);
        const nextTitle = row.title === 'Untitled article' ? '' : row.title;
        setTitle(nextTitle);
        setSlug(row.slug);
        setCategory(row.category);
        setExcerpt(row.excerpt);
        setSeoTitle(row.seoTitle ?? '');
        setSeoDescription(row.seoDescription ?? '');
        setCoverAlt(row.coverAlt ?? '');
        setMarkdown(row.content);
        lastSaved.current = draftFingerprint({
          title: nextTitle,
          slug: row.slug,
          category: row.category,
          markdown: row.content,
          excerpt: row.excerpt,
          seoTitle: row.seoTitle ?? '',
          seoDescription: row.seoDescription ?? '',
          coverAlt: row.coverAlt ?? '',
        });
        hydrated.current = true;
      })
      .catch((err) => setError(getErrorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!editor || !article || !hydrated.current) return;
    const html = markdownToHtml(article.content);
    editor.commands.setContent(html || '<p></p>', { emitUpdate: false });
  }, [article?.id, editor]);

  const persist = useCallback(async () => {
    if (!article || !hydrated.current) return;
    const snapshot = draftFingerprint({
      title,
      slug,
      category,
      markdown,
      excerpt,
      seoTitle,
      seoDescription,
      coverAlt,
    });
    if (snapshot === lastSaved.current) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await updateMyArticle(article.id, {
        title: title.trim() || 'Untitled article',
        slug: slug.trim() || undefined,
        category,
        content: markdown,
        excerpt,
        seoTitle,
        seoDescription,
        coverAlt,
      });
      setArticle(saved);
      setSlug(saved.slug);
      lastSaved.current = draftFingerprint({
        title: saved.title === 'Untitled article' ? '' : saved.title,
        slug: saved.slug,
        category: saved.category,
        markdown: saved.content,
        excerpt: saved.excerpt,
        seoTitle: saved.seoTitle ?? '',
        seoDescription: saved.seoDescription ?? '',
        coverAlt: saved.coverAlt ?? '',
      });
      setNotice('Saved');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [article, title, slug, category, markdown, excerpt, seoTitle, seoDescription, coverAlt]);

  useEffect(() => {
    if (!article || !hydrated.current) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void persist();
    }, 1600);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [article, persist]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 1800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (saving || publishing) {
        event.preventDefault();
        event.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [saving, publishing]);

  async function handlePublish() {
    if (!article) return;
    await persist();
    setPublishing(true);
    try {
      const saved = await publishMyArticle(
        article.id,
        scheduleAt ? new Date(scheduleAt).toISOString() : undefined,
      );
      setArticle(saved);
      setNotice(saved.status === 'scheduled' ? 'Scheduled' : 'Published');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    if (!article) return;
    setPublishing(true);
    try {
      const saved = await unpublishMyArticle(article.id);
      setArticle(saved);
      setNotice('Unpublished');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPublishing(false);
    }
  }

  async function handleCover(file: File | undefined) {
    if (!article || !file) return;
    try {
      const saved = await uploadCover(article.id, file);
      setArticle(saved);
      setNotice('Cover updated');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const previewHtml = useMemo(() => markdownToHtml(markdown), [markdown]);
  const displayTitle = title.trim() || 'Untitled article';

  if (!id) {
    return null;
  }

  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <button type="button" className={styles.ghostBtn} onClick={() => navigate('/articles')}>
            Back
          </button>
          <div className={styles.statusRow}>
            <span className={styles.status}>{article?.status ?? 'draft'}</span>
            <span className={styles.saveState}>{saving ? 'Saving…' : notice ?? 'Autosave on'}</span>
          </div>
          <div className={styles.actions}>
            {article?.status === 'published' ? (
              <button type="button" className={styles.ghostBtn} onClick={() => void handleUnpublish()}>
                Unpublish
              </button>
            ) : null}
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => void handlePublish()}
              disabled={publishing || !article}
            >
              {scheduleAt ? 'Schedule' : 'Publish'}
            </button>
          </div>
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.layout}>
          <section className={styles.editorCol}>
            <input
              className={styles.titleInput}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title"
            />
            <div className={styles.toolbar} role="toolbar" aria-label="Formatting">
              <ToolbarButton
                label="H2"
                active={editor?.isActive('heading', { level: 2 })}
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              />
              <ToolbarButton
                label="H3"
                active={editor?.isActive('heading', { level: 3 })}
                onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              />
              <ToolbarButton
                label="B"
                active={editor?.isActive('bold')}
                onClick={() => editor?.chain().focus().toggleBold().run()}
              />
              <ToolbarButton
                label="I"
                active={editor?.isActive('italic')}
                onClick={() => editor?.chain().focus().toggleItalic().run()}
              />
              <ToolbarButton
                label="Quote"
                active={editor?.isActive('blockquote')}
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              />
              <ToolbarButton
                label="List"
                active={editor?.isActive('bulletList')}
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
              />
              <ToolbarButton
                label="1."
                active={editor?.isActive('orderedList')}
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              />
              <ToolbarButton
                label="Link"
                active={editor?.isActive('link')}
                onClick={() => {
                  const href = window.prompt('Link URL');
                  if (!href) {
                    editor?.chain().focus().unsetLink().run();
                    return;
                  }
                  editor?.chain().focus().setLink({ href }).run();
                }}
              />
              <ToolbarButton
                label="Undo"
                onClick={() => editor?.chain().focus().undo().run()}
              />
            </div>
            <EditorContent editor={editor} className={styles.editorSurface} />
          </section>

          <aside className={styles.side}>
            <div className={styles.previewTabs}>
              <button
                type="button"
                className={preview === 'web' ? styles.tabActive : styles.tab}
                onClick={() => setPreview('web')}
              >
                Website
              </button>
              <button
                type="button"
                className={preview === 'phone' ? styles.tabActive : styles.tab}
                onClick={() => setPreview('phone')}
              >
                App
              </button>
            </div>
            <div className={preview === 'phone' ? styles.phoneFrame : styles.webFrame}>
              <img
                src={article?.coverImageUrl}
                alt={coverAlt || ''}
                className={styles.previewCover}
              />
              <div className={styles.previewBody}>
                <p className={styles.previewKicker}>
                  {ARTICLE_CATEGORIES.find((c) => c.id === category)?.label} ·{' '}
                  {article?.readTimeMinutes ?? 1} min
                </p>
                <h2 className={styles.previewTitle}>{displayTitle}</h2>
                <div
                  className={styles.previewProse}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>

            <label className={styles.field}>
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ArticleCategory)}
              >
                {ARTICLE_CATEGORIES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <p className={styles.hint}>
              Language is detected from the title and body
              {article?.language ? ` (${languageLabel(article.language)})` : ''}.
            </p>
            <label className={styles.field}>
              URL slug
              <input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </label>
            <label className={styles.field}>
              Excerpt
              <textarea
                rows={3}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
              />
            </label>
            <label className={styles.field}>
              Cover image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => void handleCover(e.target.files?.[0])}
              />
            </label>
            <label className={styles.field}>
              Cover alt text
              <input value={coverAlt} onChange={(e) => setCoverAlt(e.target.value)} />
            </label>
            <label className={styles.field}>
              SEO title
              <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={70} />
            </label>
            <label className={styles.field}>
              SEO description
              <textarea
                rows={3}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                maxLength={160}
              />
            </label>
            <label className={styles.field}>
              Schedule (optional)
              <input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
              />
            </label>
            {article?.status === 'published' ? (
              <a
                className={styles.liveLink}
                href={articlePublicUrl(article.slug)}
                target="_blank"
                rel="noreferrer"
              >
                Open live page
              </a>
            ) : null}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function languageLabel(language: ArticleLanguage): string {
  if (language === 'hi') return 'Hindi';
  if (language === 'en') return 'English';
  return 'Hindi + English';
}

function ToolbarButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? `${styles.toolBtn} ${styles.toolBtnActive}` : styles.toolBtn}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
