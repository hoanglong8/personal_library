"use client";

import { use, useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/adminFetch";
import { slugify } from "@/lib/slugify";
import { parseMarkdownToModule } from "@/lib/markdownImport";
import MarkdownFieldEditor from "@/components/MarkdownFieldEditor";
import { CATEGORY_TREE } from "@/lib/categories";
import type { Book, Module, Section } from "@/lib/types";

function newId(prefix: string): string {
  return `${prefix}-${(typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
  ).slice(0, 8)}`;
}

function newImageSection(): Section {
  return { id: newId("anh"), type: "image", title: "", url: "", alt: "" };
}

function newSectionOfType(type: Section["type"]): Section {
  switch (type) {
    case "concept":
      return { id: newId("khai-niem"), type: "concept", title: "", body: "" };
    case "framework":
      return { id: newId("khung"), type: "framework", title: "", steps: [] };
    case "case-study":
      return { id: newId("tinh-huong"), type: "case-study", title: "", body: "" };
    case "exercise":
      return { id: newId("bai-tap"), type: "exercise", title: "", prompt: "" };
    case "note":
      return { id: newId("ghi-chu"), type: "note", title: "", body: "", variant: "tip" };
    case "image":
    default:
      return newImageSection();
  }
}

const SECTION_TYPE_LABELS: Record<Section["type"], string> = {
  concept: "Khái niệm",
  framework: "Khung/quy trình",
  "case-study": "Tình huống",
  exercise: "Bài tập",
  note: "Ghi chú",
  image: "Ảnh",
};

function newEmptyModule(): Module {
  return {
    id: newId("chuong"),
    title: "",
    summary: "",
    sections: [newSectionOfType("concept"), newSectionOfType("exercise")],
  };
}

function SectionEditor({
  section,
  onChange,
  onDelete,
}: {
  section: Section;
  onChange: (next: Section) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs uppercase tracking-widest text-accent">
          {section.type} · {section.id}
        </span>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-paper-400 hover:text-danger"
        >
          Xoá
        </button>
      </div>

      <input
        value={section.title}
        onChange={(e) => onChange({ ...section, title: e.target.value })}
        placeholder="Tiêu đề mục"
        className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium outline-none focus:border-accent"
      />

      {section.type === "concept" && (
        <div className="mt-2">
          <MarkdownFieldEditor
            value={section.body}
            onChange={(body) => onChange({ ...section, body })}
            placeholder="Nội dung..."
          />
        </div>
      )}

      {section.type === "case-study" && (
        <>
          <div className="mt-2">
            <MarkdownFieldEditor
              value={section.body}
              onChange={(body) => onChange({ ...section, body })}
              placeholder="Nội dung..."
            />
          </div>
          <input
            value={section.source ?? ""}
            onChange={(e) => onChange({ ...section, source: e.target.value || undefined })}
            placeholder="Nguồn (không bắt buộc)"
            className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-accent"
          />
        </>
      )}

      {section.type === "note" && (
        <>
          <div className="mt-2">
            <MarkdownFieldEditor
              value={section.body}
              onChange={(body) => onChange({ ...section, body })}
              placeholder="Nội dung..."
              minHeight={120}
            />
          </div>
          <select
            value={section.variant}
            onChange={(e) =>
              onChange({ ...section, variant: e.target.value as typeof section.variant })
            }
            className="mt-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-accent"
          >
            <option value="tip">Ghi chú</option>
            <option value="warning">Lưu ý</option>
            <option value="definition">Định nghĩa</option>
          </select>
        </>
      )}

      {section.type === "framework" && (
        <>
          <div className="mt-2">
            <MarkdownFieldEditor
              value={section.intro ?? ""}
              onChange={(intro) => onChange({ ...section, intro: intro || undefined })}
              placeholder="Giới thiệu (không bắt buộc)"
              minHeight={100}
            />
          </div>
          <div className="mt-2 space-y-2">
            {section.steps.map((step, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={step}
                  onChange={(e) => {
                    const steps = [...section.steps];
                    steps[i] = e.target.value;
                    onChange({ ...section, steps });
                  }}
                  className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => onChange({ ...section, steps: section.steps.filter((_, j) => j !== i) })}
                  className="text-xs text-paper-400 hover:text-danger"
                >
                  Xoá dòng
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onChange({ ...section, steps: [...section.steps, ""] })}
              className="text-xs text-accent hover:underline"
            >
              + Thêm dòng
            </button>
          </div>
        </>
      )}

      {section.type === "exercise" && (
        <>
          <div className="mt-2">
            <MarkdownFieldEditor
              value={section.prompt}
              onChange={(prompt) => onChange({ ...section, prompt })}
              placeholder="Câu hỏi/yêu cầu..."
              minHeight={100}
            />
          </div>
          <div className="mt-2">
            <MarkdownFieldEditor
              value={section.hint ?? ""}
              onChange={(hint) => onChange({ ...section, hint: hint || undefined })}
              placeholder="Gợi ý (không bắt buộc)"
              minHeight={100}
            />
          </div>
          <div className="mt-2">
            <MarkdownFieldEditor
              value={section.answer ?? ""}
              onChange={(answer) => onChange({ ...section, answer: answer || undefined })}
              placeholder="Đáp án tham khảo (không bắt buộc)"
              minHeight={100}
            />
          </div>
        </>
      )}

      {section.type === "image" && (
        <>
          <div className="mt-2 flex gap-2">
            <input
              value={section.url}
              onChange={(e) => onChange({ ...section, url: e.target.value })}
              placeholder="https://... (lấy link ở trang Chèn ảnh)"
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <Link
              href="/chen-anh"
              target="_blank"
              className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs text-ink-soft hover:border-accent hover:text-accent"
            >
              Mở trang Chèn ảnh ↗
            </Link>
          </div>
          <input
            value={section.alt}
            onChange={(e) => onChange({ ...section, alt: e.target.value })}
            placeholder="Mô tả ảnh (alt text, bắt buộc cho a11y)"
            className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            value={section.caption ?? ""}
            onChange={(e) => onChange({ ...section, caption: e.target.value || undefined })}
            placeholder="Chú thích ảnh (không bắt buộc)"
            className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
          {section.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={section.url} alt="" className="mt-2 max-h-40 rounded-lg border border-border object-contain" />
          )}
        </>
      )}
    </div>
  );
}

function ModuleEditor({
  mod,
  onChange,
}: {
  mod: Module;
  onChange: (next: Module) => void;
}) {
  const [open, setOpen] = useState(false);
  const [newSectionType, setNewSectionType] = useState<Section["type"]>("concept");

  function updateSection(i: number, next: Section) {
    const sections = [...mod.sections];
    sections[i] = next;
    onChange({ ...mod, sections });
  }

  function deleteSection(i: number) {
    onChange({ ...mod, sections: mod.sections.filter((_, j) => j !== i) });
  }

  function addSection() {
    onChange({ ...mod, sections: [...mod.sections, newSectionOfType(newSectionType)] });
  }

  return (
    <div className="rounded-xl border border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <span className="font-medium text-ink">{mod.title || "(chưa có tiêu đề)"}</span>
        <span className="text-xs text-paper-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-border p-4">
          <input
            value={mod.title}
            onChange={(e) => onChange({ ...mod, title: e.target.value })}
            placeholder="Tiêu đề chương"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium outline-none focus:border-accent"
          />
          <MarkdownFieldEditor
            value={mod.summary}
            onChange={(summary) => onChange({ ...mod, summary })}
            placeholder="Tóm tắt chương"
            minHeight={100}
          />

          <div className="space-y-3">
            {mod.sections.map((s, i) => (
              <SectionEditor
                key={s.id}
                section={s}
                onChange={(next) => updateSection(i, next)}
                onDelete={() => deleteSection(i)}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={newSectionType}
              onChange={(e) => setNewSectionType(e.target.value as Section["type"])}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs outline-none focus:border-accent"
            >
              {(Object.keys(SECTION_TYPE_LABELS) as Section["type"][]).map((t) => (
                <option key={t} value={t}>
                  {SECTION_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addSection}
              className="rounded-full border border-dashed border-accent/60 px-4 py-1.5 text-xs font-medium text-accent hover:bg-accent-soft"
            >
              + Thêm mục vào cuối chương
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditBookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [status, setStatus] = useState<string | null>(null);
  const [data, setData] = useState<Omit<Book, "slug"> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    adminFetch(`/api/admin/books/${slug}`).then(async (res) => {
      const body = await res.json();
      if (!res.ok) {
        setLoadError(body.error ?? "Không tải được sách.");
        return;
      }
      setStatus(body.book.status);
      setData(body.book.data);
      setTagsInput((body.book.data.meta.tags ?? []).join(", "));
    });
  }, [slug]);

  function updateModule(i: number, next: Module) {
    if (!data) return;
    const modules = [...data.modules];
    modules[i] = next;
    setData({ ...data, modules });
  }

  function addEmptyModule() {
    if (!data) return;
    setData({ ...data, modules: [...data.modules, newEmptyModule()] });
  }

  async function handleImportMarkdown(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !data) return;

    const text = await file.text();
    const fallbackTitle = file.name.replace(/\.md$/i, "");
    const newModule = parseMarkdownToModule(text, fallbackTitle);

    // Ids must stay unique within the book (they're used as URL anchors
    // and as `section_id`/`module_id` for comments/bookmarks/progress) —
    // suffix on collision with an existing module id rather than silently
    // overwriting one.
    const existingIds = new Set(data.modules.map((m) => m.id));
    let moduleId = newModule.id;
    let suffix = 2;
    while (existingIds.has(moduleId)) {
      moduleId = `${newModule.id}-${suffix}`;
      suffix += 1;
    }

    setData({ ...data, modules: [...data.modules, { ...newModule, id: moduleId }] });
  }

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const toSave = { ...data, meta: { ...data.meta, tags } };

    const res = await adminFetch(`/api/admin/books/${slug}/edit`, {
      method: "POST",
      body: JSON.stringify({ data: toSave }),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setSaveError(body.error ?? "Lưu thất bại.");
      return;
    }
    setData(toSave);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loadError) {
    return (
      <div>
        <p className="text-sm text-danger">{loadError}</p>
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-paper-400">Đang tải...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Sửa nội dung</h1>
          <p className="text-xs text-paper-400">
            slug: {slug} · trạng thái: {status}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-ink disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : saved ? "Đã lưu ✓" : "Lưu"}
        </button>
      </div>
      {saveError && <p className="mt-2 text-xs text-danger">{saveError}</p>}
      {status === "published" && (
        <p className="mt-2 text-xs text-accent">
          Sách đang công khai — lưu sẽ cập nhật ngay trên trang live.
        </p>
      )}

      <div className="mt-6 space-y-3 rounded-xl border border-border p-5">
        <input
          value={data.meta.title}
          onChange={(e) => setData({ ...data, meta: { ...data.meta, title: e.target.value } })}
          placeholder="Tiêu đề sách"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-lg font-medium outline-none focus:border-accent"
        />
        <textarea
          value={data.meta.subtitle}
          onChange={(e) => setData({ ...data, meta: { ...data.meta, subtitle: e.target.value } })}
          rows={2}
          placeholder="Mô tả ngắn"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="Tag, cách nhau bởi dấu phẩy"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <input
          value={data.meta.thumbnail ?? ""}
          onChange={(e) =>
            setData({ ...data, meta: { ...data.meta, thumbnail: e.target.value || undefined } })
          }
          placeholder="Link ảnh thumbnail (không bắt buộc — lấy ở trang Chèn ảnh)"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <div>
          <input
            value={data.meta.sourceUrl ?? ""}
            onChange={(e) =>
              setData({ ...data, meta: { ...data.meta, sourceUrl: e.target.value || undefined } })
            }
            placeholder="Link tài liệu gốc (không bắt buộc) — Drive, Docs, Sheets, Slides, hoặc link https bất kỳ"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <p className="mt-1 text-xs text-paper-400">
            Bật nút nổi &quot;Xem bản gốc&quot; trên trang sách. Link Google Drive/Docs/Sheets/
            Slides cần đặt quyền chia sẻ &quot;Anyone with the link&quot;. Link dịch vụ khác cần
            là https và cho phép tải trực tiếp (không yêu cầu đăng nhập).
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-sm font-mono uppercase tracking-widest text-paper-400">
          Các chương ({data.modules.length})
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={addEmptyModule}
            className="rounded-full border border-dashed border-accent/60 px-4 py-1.5 text-xs font-medium text-accent hover:bg-accent-soft"
          >
            + Thêm chương trống
          </button>
          <label className="cursor-pointer rounded-full border border-dashed border-accent/60 px-4 py-1.5 text-xs font-medium text-accent hover:bg-accent-soft">
            + Nhập chương mới từ file .md
            <input type="file" accept=".md,text/markdown" onChange={handleImportMarkdown} className="hidden" />
          </label>
        </div>
      </div>
      <p className="mt-1 text-xs text-paper-400">
        Dòng <code className="font-mono">#</code> đầu file → tên chương; mỗi dòng{" "}
        <code className="font-mono">## ...</code> → 1 mục mới; ảnh dạng{" "}
        <code className="font-mono">![mô tả](link)</code> tự tách thành khối ảnh riêng, giữ đúng vị
        trí giữa bài. Chương mới thêm vào cuối sách — kiểm tra lại nội dung rồi bấm Lưu.
      </p>

      <div className="mt-3 space-y-3">
        {data.modules.map((mod, i) => (
          <ModuleEditor key={mod.id || slugify(mod.title)} mod={mod} onChange={(next) => updateModule(i, next)} />
        ))}
      </div>

      <h2 className="mt-8 text-sm font-mono uppercase tracking-widest text-paper-400">
        Thông tin bổ sung
      </h2>
      <div className="mt-3 space-y-3 rounded-xl border border-border p-5">
        <input
          value={data.meta.author ?? ""}
          onChange={(e) =>
            setData({ ...data, meta: { ...data.meta, author: e.target.value || undefined } })
          }
          placeholder="Tác giả (không bắt buộc)"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            value={data.meta.domain ?? ""}
            onChange={(e) =>
              setData({
                ...data,
                meta: { ...data.meta, domain: e.target.value || undefined, field: undefined },
              })
            }
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">Lĩnh vực lớn (không bắt buộc)</option>
            {CATEGORY_TREE.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
          <select
            value={data.meta.field ?? ""}
            onChange={(e) =>
              setData({ ...data, meta: { ...data.meta, field: e.target.value || undefined } })
            }
            disabled={!data.meta.domain}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-50"
          >
            <option value="">Chủ đề con (không bắt buộc)</option>
            {CATEGORY_TREE.find((d) => d.id === data.meta.domain)?.fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-paper-400">Ngày xuất bản (không bắt buộc)</label>
          <input
            type="date"
            value={data.meta.publishedAt ?? ""}
            onChange={(e) =>
              setData({ ...data, meta: { ...data.meta, publishedAt: e.target.value || undefined } })
            }
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent sm:w-60"
          />
        </div>
        <div className="flex gap-2">
          <input
            value={data.meta.footerImage ?? ""}
            onChange={(e) =>
              setData({ ...data, meta: { ...data.meta, footerImage: e.target.value || undefined } })
            }
            placeholder="Link ảnh minh hoạ cuối sách (không bắt buộc — lấy ở trang Chèn ảnh)"
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <Link
            href="/chen-anh"
            target="_blank"
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs text-ink-soft hover:border-accent hover:text-accent"
          >
            Mở trang Chèn ảnh ↗
          </Link>
        </div>
        {data.meta.footerImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.meta.footerImage}
            alt=""
            className="max-h-40 rounded-lg border border-border object-contain"
          />
        )}
      </div>
    </div>
  );
}
