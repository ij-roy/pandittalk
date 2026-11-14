function pdfSafe(text: string): string {
  return text
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90);
}

function pdfEscape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function labelKey(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
}

function flatten(value: unknown, depth: number): string[] {
  if (depth > 3) return [];
  if (typeof value === 'string') {
    const text = pdfSafe(value);
    return text ? [text] : [];
  }
  if (typeof value === 'number' || typeof value === 'boolean') return [String(value)];
  if (Array.isArray(value)) return value.flatMap((item) => flatten(item, depth + 1));
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
      const inner = flatten(child, depth + 1);
      if (inner.length === 0) return [];
      if (inner.length === 1) return [`${labelKey(key)}: ${inner[0]}`.slice(0, 90)];
      return [labelKey(key), ...inner];
    });
  }
  return [];
}

export function reportPlainLines(title: string, payload: unknown): string[] {
  const heading = pdfSafe(title) || 'PanditTalk report';
  const body = flatten(payload, 0).slice(0, 32);
  return [heading, ...body];
}

export function buildTextPdf(lines: string[]): string {
  const body = lines.map(pdfSafe).filter(Boolean).slice(0, 36);
  const pageLines = body.length > 0 ? body : ['PanditTalk report'];
  const commands = ['BT', '/F1 12 Tf', '50 740 Td', '16 TL'];
  pageLines.forEach((line, index) => {
    const text = `(${pdfEscape(line)}) Tj`;
    commands.push(index === 0 ? text : `T* ${text}`);
  });
  commands.push('ET');
  const stream = commands.join('\n');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n',
    `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += object;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return pdf;
}

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function latin1ToBase64(input: string): string {
  let out = '';
  for (let index = 0; index < input.length; index += 3) {
    const a = input.charCodeAt(index);
    const hasB = index + 1 < input.length;
    const hasC = index + 2 < input.length;
    const b = hasB ? input.charCodeAt(index + 1) : 0;
    const c = hasC ? input.charCodeAt(index + 2) : 0;
    const n = (a << 16) | (b << 8) | c;
    out += BASE64[(n >> 18) & 63];
    out += BASE64[(n >> 12) & 63];
    out += hasB ? BASE64[(n >> 6) & 63] : '=';
    out += hasC ? BASE64[n & 63] : '=';
  }
  return out;
}
