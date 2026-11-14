"""Parse Articles.docx into editorial-articles.json. One-off helper."""
from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

DOCX = Path(r"d:\Downloads\Articles (1).docx")
OUT = Path(__file__).resolve().parents[1] / "data" / "editorial-articles.json"

COVER = {
    "astrology": "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=400&fit=crop",
    "spirituality": "https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&h=400&fit=crop",
    "vastu": "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800&h=400&fit=crop",
    "numerology": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=400&fit=crop",
    "tarot": "https://images.unsplash.com/photo-1509245853830-fb36a1f1f1c1?w=800&h=400&fit=crop",
    "palmistry": "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&h=400&fit=crop",
}

SLUGS = {
    ("astrology", 0): "raksha-bandhan-2026-rashi",
    ("astrology", 1): "janmashtami-midnight-krishna",
    ("spirituality", 0): "raksha-bandhan-meaning",
    ("spirituality", 1): "ganesh-chaturthi-why-first",
    ("vastu", 0): "vastu-myths-after-rakhi",
    ("vastu", 1): "festive-home-cleaning-vastu",
    ("numerology", 0): "numerology-moolank",
    ("numerology", 1): "numerology-1111",
    ("palmistry", 0): "palmistry-life-marriage-lines",
    ("palmistry", 1): "palmistry-x-mark",
    ("tarot", 0): "tarot-death-card",
    ("tarot", 1): "tarot-sun-card",
}

SECOND_MARKERS = {
    "astrology": lambda p: "Janmashtami" in p and len(p) < 40,
    "spirituality": lambda p: p.strip() == "Ganesh Chaturthi",
    "vastu": lambda p: p.strip().startswith("Bhadrapada Purnima"),
    "numerology": lambda p: p.strip().startswith("2.") and "11:11" in p,
    "palmistry": lambda p: p.strip().startswith("2.") and "हथेली" in p,
    "tarot": lambda p: p.strip().startswith("2.") and "Lucky" in p,
}

STUB_TITLES = {
    "astrology": True,
    "spirituality": True,
    "vastu": True,
    "numerology": False,
    "palmistry": False,
    "tarot": False,
}

HEADING_RE = re.compile(
    r"^(✅|✔|❌|🧿|🌕|🌙|🐘|🧵|❤|🏡|🧹|🔢|✨|💫|✋|🃏|☀|🪄|🧠|🌺|🦚|🤯|🏠|🪷|♈)"
)

W_NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def extract_paragraphs(path: Path) -> list[str]:
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml")
    root = ET.fromstring(xml)
    paras: list[str] = []
    for para in root.iter(f"{W_NS}p"):
        texts = [t.text or "" for t in para.iter(f"{W_NS}t")]
        line = "".join(texts).strip()
        if line:
            paras.append(line)
    return paras


def category_of(line: str) -> str | None:
    match = re.match(
        r"^(?:[\W\d]+\s*)*(ASTROLOGY|SPIRITUALITY|VASTU|NUMEROLOGY|PALMISTRY|TAROT)\s*$",
        line.strip(),
        re.I,
    )
    if not match:
        return None
    return match.group(1).lower()


def to_markdown(paras: list[str]) -> str:
    out: list[str] = []
    for p in paras:
        parts = [x.strip() for x in re.split(r"(?=✔)", p) if x.strip()]
        for part in parts:
            short_numbered = bool(re.match(r"^\d+\.\s+\S.{0,60}$", part))
            if (HEADING_RE.match(part) or part.startswith("MYTH ") or part.startswith("FACT ") or short_numbered) and len(part) <= 80:
                out.append("## " + part)
            else:
                out.append(part)
    return "\n\n".join(out)


def excerpt_of(md: str, n: int = 150) -> str:
    plain = re.sub(r"[#*_`]+", "", md)
    plain = re.sub(r"\s+", " ", plain).strip()
    if len(plain) <= n:
        return plain
    return plain[: n - 3].rstrip() + "..."


def read_time(md: str) -> int:
    words = len(md.split())
    return max(2, (words + 199) // 200)


def main() -> None:
    paras = extract_paragraphs(DOCX)
    sections: list[tuple[str, list[str]]] = []
    cur_cat: str | None = None
    buf: list[str] = []
    for line in paras:
        cat = category_of(line)
        if cat:
            if cur_cat and buf:
                sections.append((cur_cat, buf))
            cur_cat = cat
            buf = []
            continue
        if cur_cat:
            buf.append(line)
    if cur_cat and buf:
        sections.append((cur_cat, buf))

    articles = []
    for cat, lines in sections:
        split_at = None
        marker = SECOND_MARKERS[cat]
        for i, p in enumerate(lines):
            if marker(p):
                split_at = i
                break
        chunks = [lines] if split_at is None else [lines[:split_at], lines[split_at:]]
        for idx, chunk in enumerate(chunks):
            body = list(chunk)
            if idx == 1 and STUB_TITLES[cat]:
                body = body[1:]
            title = re.sub(r"^2\.\s*", "", body[0]).strip()
            body = body[1:]
            if body and body[0] == title:
                body = body[1:]
            md = to_markdown(body)
            articles.append(
                {
                    "slug": SLUGS[(cat, idx)],
                    "title": title,
                    "category": cat,
                    "author": "PanditTalk Editorial",
                    "coverImageUrl": COVER[cat],
                    "excerpt": excerpt_of(md),
                    "content": md,
                    "readTimeMinutes": read_time(md),
                }
            )

    if len(articles) != 12:
        raise SystemExit(f"expected 12 articles, got {len(articles)}")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(articles, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(articles)} articles to {OUT} ({OUT.stat().st_size} bytes)")
    for a in articles:
        print(f"{a['category']:13} {a['slug']:32} {a['readTimeMinutes']}m chars={len(a['content'])}")


if __name__ == "__main__":
    main()
