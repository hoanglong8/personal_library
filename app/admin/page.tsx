import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Quản trị</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/jobs"
          className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent"
        >
          <h2 className="font-medium text-ink">AI Job Queue</h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            Gửi job gắn tag, tóm tắt, phân loại, dịch thuật cho sách đã có.
          </p>
        </Link>
        <Link
          href="/admin/drafts"
          className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent"
        >
          <h2 className="font-medium text-ink">Bản nháp chờ duyệt</h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            Xem và duyệt/từ chối các sách ở trạng thái draft trước khi lên site.
          </p>
        </Link>
      </div>
    </div>
  );
}
