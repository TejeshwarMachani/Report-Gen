// Export helpers: PDF via print window, DOCX via minimal OOXML word/document.xml
import type { ReportDoc } from "./report";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function exportPdf(report: ReportDoc) {
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return;
  const parts: string[] = [];
  if (report.headlineMetrics?.length) {
    parts.push(
      `<h2>Key metrics</h2><table><thead><tr><th>Metric</th><th>Value</th><th>Change</th></tr></thead><tbody>${report.headlineMetrics
        .map(
          (m) =>
            `<tr><td>${esc(m.label)}</td><td><b>${esc(m.value)}</b></td><td>${
              m.change ? esc(m.change) : "—"
            }</td></tr>`,
        )
        .join("")}</tbody></table>`,
    );
  }
  if (report.narrative) {
    parts.push(`<h2>Summary</h2><p>${esc(report.narrative.headline)}</p><p>${esc(
      report.narrative.summary,
    )}</p>`);
  }
  if (report.insights?.length) {
    parts.push(
      `<h2>Insights</h2><ul>${report.insights.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`,
    );
  }
  if (report.charts?.length) {
    parts.push(
      `<h2>Charts</h2>${report.charts
        .map(
          (c) =>
            `<div class="chart"><h3>${esc(c.title)}</h3>${c.data
              .map(
                (p) =>
                  `<div class="row"><span>${esc(p.label)}</span><span class="bar" style="width:${
                    Math.max(2, (p.value / Math.max(...c.data.map((d) => d.value))) * 100
                  )}%"></span><span class="val">${p.value.toLocaleString()}</span></div>`,
              )
              .join("")}</div>`,
        )
        .join("")}`,
    );
  }
  if (report.narrative) {
    parts.push(`<h2>What to watch</h2><p>${esc(report.narrative.watch)}</p>`);
  }

  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(
    report.title,
  )}</title><style>
    body{font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#1e293b;max-width:760px;margin:32px auto;padding:0 24px;line-height:1.6;}
    h1{font-size:24px;letter-spacing:-0.02em;margin-bottom:4px}
    h2{font-size:15px;text-transform:uppercase;letter-spacing:0.08em;color:#6366f1;margin-top:32px}
    h3{font-size:14px;margin:18px 0 8px}
    .meta{color:#64748b;font-size:13px;margin-bottom:24px}
    table{border-collapse:collapse;width:100%;font-size:14px}
    th,td{border:1px solid #e2e8f0;padding:8px 10px;text-align:left}
    th{background:#f8fafc;font-weight:600}
    ul{padding-left:20px}li{margin:6px 0}
    .chart{border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;margin-bottom:14px}
    .row{display:flex;align-items:center;gap:8px;margin:4px 0;font-size:12px}
    .row span:first-child{width:110px;flex:none;color:#475569}
    .bar{display:block;height:12px;background:#6366f1;border-radius:3px}
    .val{color:#334155;font-variant-numeric:tabular-nums}
    @media print{.noprint{display:none}}
  </style></head><body>
  <h1>${esc(report.title)}</h1>
  <div class="meta">Generated ${new Date(report.createdAt).toLocaleString()} · Intent: ${esc(
    report.intent,
  )}</div>
  ${parts.join("")}
  <script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
  </body></html>`);
  w.document.close();
}

export async function exportDocx(report: ReportDoc) {
  const para = (text: string, style: string, bold = false): string =>
    `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr><w:r>${
      bold ? "<w:rPr><w:b/></w:rPr>" : ""
    }<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;

  const body: string[] = [];
  body.push(para(report.title, "Heading1"));
  body.push(
    para(`Generated ${new Date(report.createdAt).toLocaleString()} · Intent: ${report.intent}`, "Compact"),
  );
  if (report.narrative) {
    body.push(para(report.narrative.headline, "Heading2"));
    body.push(para(report.narrative.summary, "Normal"));
    body.push(para("What to watch", "Heading2"));
    body.push(para(report.narrative.watch, "Normal"));
  }
  if (report.headlineMetrics?.length) {
    body.push(para("Key metrics", "Heading2"));
    for (const m of report.headlineMetrics) {
      const change = m.change ? ` (${m.change})` : "";
      body.push(para(`${m.label}: ${m.value}${change}`, "ListParagraph"));
    }
  }
  if (report.insights?.length) {
    body.push(para("Insights", "Heading2"));
    for (const i of report.insights) body.push(para(i, "ListParagraph"));
  }
  if (report.charts?.length) {
    body.push(para("Charts", "Heading2"));
    for (const c of report.charts) {
      body.push(para(c.title, "Heading3"));
      const max = Math.max(...c.data.map((d) => d.value), 1);
      for (const p of c.data) {
        const bar = "█".repeat(Math.max(1, Math.round((p.value / max) * 20)));
        body.push(para(`${p.label}: ${bar} ${p.value.toLocaleString()}`, "ListParagraph"));
      }
    }
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
${body.join("\n")}
<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
</w:body></w:document>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  function crc32(bytes: Uint8Array): string {
    let c: number;
    const table: number[] = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
    let crc = 0 ^ -1;
    for (let i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 0xff];
    return ((crc ^ -1) >>> 0).toString(16).padStart(8, "0");
  }

  // Very small ZIP builder (stored, no compression) — enough for a .docx.
  function zip(files: { name: string; data: string }[]): Blob {
    const enc = new TextEncoder();
    const chunks: BlobPart[] = [];
    const central: Uint8Array[] = [];
    let offset = 0;

    const u32 = (n: number) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
    const u16 = (n: number) => [n & 0xff, (n >>> 8) & 0xff];

    for (const f of files) {
      const nameBytes = enc.encode(f.name);
      const dataBytes = enc.encode(f.data);
      const crc = parseInt(crc32(dataBytes), 16);

      const local = new Uint8Array([
        ...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
        ...u32(crc), ...u32(dataBytes.length), ...u32(dataBytes.length),
        ...u16(nameBytes.length), ...u16(0), ...nameBytes, ...dataBytes,
      ]);
      chunks.push(local);

      const cd = new Uint8Array([
        ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
        ...u32(crc), ...u32(dataBytes.length), ...u32(dataBytes.length),
        ...u16(nameBytes.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0),
        ...u32(offset), ...nameBytes,
      ]);
      central.push(cd);
      offset += local.length;
    }

    const centralSize = central.reduce((a, c) => a + c.length, 0);
    const end = new Uint8Array([
      ...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length),
      ...u32(centralSize), ...u32(offset), ...u16(0),
    ]);

    const all: Uint8Array[] = [];
    for (const c of chunks) all.push(c as Uint8Array);
    for (const c of central) all.push(c);
    all.push(end);
    return new Blob(all as BlobPart[], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  }

  const blob = zip([
    { name: "[Content_Types].xml", data: contentTypes },
    { name: "_rels/.rels", data: rels },
    { name: "word/document.xml", data: documentXml },
  ]);

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.title.replace(/[^\w\s-]/g, "").slice(0, 60)}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
