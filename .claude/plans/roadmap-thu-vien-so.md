# Roadmap hợp nhất: Portal "Thư viện số" → nền tảng đọc sách + AI backend + kiến trúc dữ liệu bền vững

> Bản sao lưu trong repo của plan gốc tại
> `C:\Users\Admin\.claude\plans\elegant-conjuring-hanrahan.md` (thư mục
> plan toàn cục của Claude Code, không thuộc repo này) — đặt ở đây để theo
> sát cùng code, cập nhật tiến độ mỗi khi xong 1 giai đoạn.

## Tiến độ hiện tại (cập nhật gần nhất)

- **Giai đoạn 0 — Migrate sang Postgres: XONG, đã kiểm chứng local, CHƯA
  deploy production.**
  - `supabase/books-schema.sql` đã chạy trên project thật.
  - Migration đã chạy thành công (3 sách `published` trong bảng `books`) —
    lần đầu user báo "đã chạy" nhưng bảng vẫn rỗng khi kiểm tra trực tiếp
    (khả năng thiếu `SUPABASE_SERVICE_ROLE_KEY` lúc đó); chạy lại script
    lần 2 mới thực sự có dữ liệu — **bài học: luôn tự kiểm tra bằng
    query thật, không tin lời báo "đã chạy" khi có thể verify được**.
  - Phát hiện + sửa 1 bug trong lúc kiểm chứng: `lib/content.ts` chỉ lấy
    cột `data` (chỉ có `meta`+`modules`) mà quên ghép cột `slug` (khoá
    chính, không nằm trong `data`) — khiến mọi link sách ra `/undefined`
    và mở sách bị 404. Đã sửa: `select("slug, data")` rồi merge
    `{ slug: row.slug, ...row.data }`.
  - Đã kiểm chứng thật qua `npm run dev`: `/` hiện đúng 3/3 sách với link
    đúng slug; cả 3 trang sách (`/viet-sach-cung-claude`, `/lich-su-ai`,
    `/top-repo-github-cho-claude`) trả 200; 1 trang module test
    (`/viet-sach-cung-claude/modules/buc-tranh-toan-canh`) render đúng
    tiêu đề thật. `npm run build && npm run lint` sạch.
  - **Đã deploy production và kiểm chứng thật** qua
    `curl https://thuvien-so.vercel.app` (không chỉ tin log "Deployment
    ready"): trang chủ "3/3 sách" đúng link, cả 3 trang sách trả 200,
    trang module test render đúng nội dung thật. **Giai đoạn 0 hoàn
    thành.**

- **Giai đoạn 1 — Auth người đọc + khoá tải + tiến độ/bookmark: CODE XONG,
  chờ user chạy SQL + tự test đăng nhập thật.**
  - Đã viết: `lib/auth.ts` (useSession qua useSyncExternalStore, giống
    ThemeToggle), `components/{AuthWidget,TuSachLink,MarkReadButton,
    BookmarkButton,HeroActions,PrintView}.tsx`, `app/tu-sach/page.tsx`,
    `app/[book]/print/page.tsx`, `supabase/reader-schema.sql`
    (`reading_progress` + `bookmarks`, RLS `auth.uid()=user_id`),
    `lib/types.ts` thêm `lang`/`translationGroup`.
  - Bug tự phát hiện + sửa trong lúc lint: 7 component ban đầu gọi
    `setState` đồng bộ ngay đầu `useEffect` để reset khi chưa đăng nhập —
    vi phạm rule `react-hooks/set-state-in-effect`. Sửa: 4 component
    (MarkReadButton, BookmarkButton, HeroActions, PrintView, `/tu-sach`)
    vốn đã gate phần render theo `session` nên bỏ hẳn nhánh reset (thừa,
    state cũ không bao giờ hiển thị); riêng `ModuleNav`/`ModuleGrid` luôn
    hiện danh sách bất kể đăng nhập nên cần reset thật — chuyển sang
    pattern "reset theo key trong lúc render" của React thay vì trong
    effect.
  - **Quyết định phạm vi**: bỏ `middleware.ts` + phân quyền `ADMIN_EMAIL`
    ra khỏi Giai đoạn 1 — chưa có trang `/admin` nào để bảo vệ (Giai đoạn 2
    mới tạo), viết middleware cho route chưa tồn tại là code chết. Dời
    việc này sang lúc bắt đầu Giai đoạn 2.
  - **Quyết định kỹ thuật đáng chú ý**: route `/[book]/print` khoá bằng
    client-side gate (component client tự fetch nội dung sau khi xác nhận
    `useSession()`), không phải server-side cookie check — vì thêm
    `@supabase/ssr` + auth cookie cho riêng 1 route là quá tay so với giá
    trị thật (nội dung sách vốn đã public hoàn toàn qua trang module bình
    thường, gate ở đây chỉ là rào cản khuyến khích đăng ký, không phải
    DRM). Đã verify: HTML server-render của `/print` khi chưa đăng nhập
    KHÔNG chứa nội dung sách (không rò rỉ qua "view source").
  - **Đã kiểm chứng** (`npm run build && npm run lint` sạch, `npm run dev`
    thật): toàn bộ trạng thái "chưa đăng nhập" trên 4 mặt — trang module
    (nhắc đăng nhập để lưu tiến độ), `/print` (nhắc đăng nhập, không rò rỉ
    nội dung), trang bìa sách (nút tải bị khoá, hiện "Đăng nhập để tải
    sách"), `/tu-sach` (nhắc đăng nhập).
  - **Chưa kiểm chứng** (cần user): luồng thật khi đã đăng nhập (gửi magic
    link, đánh dấu đã đọc, bookmark, xem `/tu-sach` có dữ liệu, tải PDF)
    — vì bảng `reading_progress`/`bookmarks` **chưa tồn tại trên Supabase
    thật** (cần chạy `supabase/reader-schema.sql`), và gửi thử magic link
    cần 1 email thật nên chỉ user tự làm được. Cũng chưa xác nhận provider
    Email/Magic Link đã bật trong Supabase Dashboard (Authentication →
    Providers) — Supabase project mới thường bật sẵn nhưng chưa kiểm tra
    trực tiếp.
  - **Đã chạy `supabase/reader-schema.sql`** — xác nhận qua service_role
    key: 2 bảng `reading_progress`/`bookmarks` tồn tại, đang trống (đúng
    dự kiến, chưa ai đăng nhập/đánh dấu).
  - **Đã deploy production** (`npx vercel --prod`) — nhưng phát hiện 1 lỗ
    hổng vận hành: `thuvien-so.vercel.app` là alias gán tay, **không tự
    theo production** như `creatgitbookcanhan.vercel.app` — sau deploy,
    domain chính vẫn phục vụ bản cũ (404 ở `/print`, `/tu-sach`) cho tới
    khi chạy `npx vercel alias set <deploy-url> thuvien-so.vercel.app`.
    Đã sửa + đã cập nhật `HUONG-DAN-VAN-HANH.md` mục 5a ghi rõ bước này
    cho các lần deploy sau, kèm gợi ý user vào Vercel Dashboard đặt
    `thuvien-so.vercel.app` làm domain chính để không phải nhớ tay nữa.
  - **Đã kiểm chứng lại trên production sau khi sửa alias**: cả 3 trang
    sách, `/print`, `/tu-sach` đều 200; AuthWidget hiện trên trang chủ;
    nút tải sách bị khoá đúng khi chưa đăng nhập; `/print` không rò rỉ nội
    dung khi chưa đăng nhập.
  - **Đã kiểm chứng luồng thật**: user tự đăng nhập + test; tự kiểm tra
    lại qua service_role query thấy dữ liệu thật trong Supabase (2 dòng
    `reading_progress`, 4 dòng `bookmarks`, sách `lich-su-ai`) — không chỉ
    tin lời báo. **Giai đoạn 1 hoàn thành.**

## Giai đoạn 2 — bắt đầu (2026-08-10)

**Quyết định đổi so với roadmap gốc**: dùng **Gemini** (Google Generative
Language API) thay vì Anthropic cho job summarize/tag/classify/translate —
user chốt sau khi được hỏi lại (roadmap gốc ghi Anthropic). Gemini hỗ trợ
`responseSchema` tương đương Structured Outputs của Anthropic nên vẫn ép
được schema/domain-field hợp lệ, chỉ khác SDK/tên field.

**Đã có, đã lưu vào `.env.local`** (không commit, đã kiểm tra `.gitignore`
che `.env*`):
- `GEMINI_API_KEY` — đã tự test bằng gọi `models.list`, key hợp lệ (HTTP
  200, trả về danh sách model thật gồm `gemini-2.5-flash`).
- `GOOGLE_SA_EMAIL` = `thuvienso@gen-lang-client-0988868309.iam.gserviceaccount.com`
- `GOOGLE_DRIVE_INGEST_FOLDER_URL` = link thư mục Drive user đã chia sẻ.

**Đang thiếu — chặn riêng job "ingest" (đọc Drive), KHÔNG chặn summarize/
tag/classify/translate**: file khoá JSON của Service Account (chứa
`private_key`, không chỉ email) — cần để xác thực gọi Drive API. User mới
đưa email, chưa đưa file JSON. Sẽ hỏi khi thực sự bắt tay code phần
ingest; có thể code + test summarize/tag/classify/translate trước (chạy
trên sách đã có sẵn trong `books`, không cần Drive) mà không cần đợi.

Kế hoạch chi tiết vẫn theo đúng phần "Giai đoạn 2" ở dưới, chỉ thay
Anthropic → Gemini trong phần "Summarize/tag/classify" và "Translate";
model mặc định đổi biến môi trường từ `AI_JOB_MODEL_ID` sang
`GEMINI_MODEL_ID` (mặc định `gemini-2.5-flash`).

**Cập nhật tiến độ — code xong, build/lint sạch, chờ user chạy 2 SQL mới:**

- **Đổi kiến trúc so với roadmap gốc (2 điểm, đã có lý do rõ)**:
  1. Bỏ Supabase Edge Function + `pg_cron` → dùng Route Handler Vercel,
     admin bấm nút "Xử lý ngay" (đã hỏi và được user chọn) — project ở gói
     Vercel Hobby (cron giới hạn 1 lần/ngày), và project chưa có hạ tầng
     Supabase Edge Function nào.
  2. Bỏ `middleware.ts` kiểu edge-cookie → session Supabase của project
     này lưu ở `localStorage` (client), middleware chạy edge không đọc
     được. Thay bằng: mọi Route Handler admin xác thực qua
     `Authorization: Bearer <access_token>` (client gửi qua
     `lib/adminFetch.ts`), server verify bằng
     `supabase.auth.getUser(token)` rồi so `ADMIN_EMAIL`
     (`lib/adminAuth.ts::requireAdmin`) — đây mới là ranh giới bảo mật
     thật; `app/admin/layout.tsx` chỉ là lớp UX (ẩn UI khi chưa đăng nhập,
     không phải chặn thật).
- **Đã có, đã lưu `.env.local`**: `GEMINI_API_KEY` (đã test hợp lệ),
  `GOOGLE_SA_EMAIL`, `GOOGLE_DRIVE_INGEST_FOLDER_URL`, `ADMIN_EMAIL=
  hoanglong208@gmail.com`.
- **Đã viết**: `supabase/{ai-jobs-schema,books-pending-edit}.sql`,
  `lib/{gemini,adminAuth,adminFetch}.ts`, `lib/aiJobs/{types,tag,classify,
  summarize,translate}.ts`, `app/admin/{layout,page}.tsx`,
  `app/admin/jobs/page.tsx`, `app/admin/drafts/page.tsx`,
  `app/api/admin/jobs/route.ts` (+ `[id]/process/route.ts`),
  `app/api/admin/drafts/route.ts`, `app/api/admin/books/[slug]/
  {publish,reject}/route.ts`, `components/AdminLink.tsx`.
- **Mô hình dữ liệu draft**: sách MỚI (translate/ingest) → `books.status=
  'draft'`, duyệt = đổi status; sửa sách ĐÃ publish (tag/summarize/
  classify) → ghi vào cột mới `books.pending_data` (không đụng `data` cho
  tới khi duyệt), tránh AI tự ý đè nội dung đang live.
- **job "ingest" bị chặn ngay lúc tạo** (trả lỗi rõ ràng, không cho vào
  hàng đợi) — thiếu file khoá JSON Service Account (mới có email).
- `npm run build && npm run lint` sạch. 2 lỗi TypeScript tự phát hiện + tự
  sửa: `revalidateTag` ở Next.js 16 đổi chữ ký thành bắt buộc 2 tham số
  (`revalidateTag(tag, {expire:0})` cho invalidate ngay, đọc từ
  `node_modules/next/dist/docs` theo đúng cảnh báo trong AGENTS.md); 1 dead
  code TypeScript tự phát hiện (so sánh `jobType !== "ingest"` sau khi
  nhánh ingest đã return ở trên — TS tự biết không bao giờ true).
- **Đã chạy 2 SQL mới, đã deploy production, đã test thật — Giai đoạn 2
  hoàn thành (trừ job "ingest", xem dưới).**
  - Phát hiện lúc deploy: `SUPABASE_SERVICE_ROLE_KEY` chưa từng được set
    trên Vercel (Giai đoạn 0 chỉ chạy migration script ở máy local) — đã
    thêm cùng 4 biến mới (`GEMINI_API_KEY`, `ADMIN_EMAIL`,
    `GOOGLE_SA_EMAIL`, `GOOGLE_DRIVE_INGEST_FOLDER_URL`) vào Vercel
    Production trước khi deploy.
  - Lần test đầu bị hiểu nhầm "xong" khi thực ra chưa chạy qua UI — tự
    kiểm tra thấy bảng `ai_jobs` rỗng nên phát hiện ra, hỏi lại user và
    yêu cầu làm đúng từng bước UI thay vì chỉ xem trang sách.
  - Lần test thật đầu tiên báo lỗi Gemini: model `gemini-2.5-flash`
    (hard-code ban đầu) trả 404 "no longer available to new users" dù vẫn
    có trong danh sách `models.list` — tự gọi thử `generateContent` với
    vài model ứng viên, xác nhận `gemini-flash-latest` chạy được thật (tự
    trỏ tới `gemini-3.6-flash`) trước khi sửa code. Đổi
    `DEFAULT_MODEL` trong `lib/gemini.ts` sang alias `-latest` để tránh
    lặp lại lỗi này khi Google tiếp tục deprecate model cụ thể.
  - Sau khi sửa, user bấm "Xử lý ngay" lại đúng job cũ (status `error` →
    retry được, không cần gửi job mới) → `ready_for_review` → duyệt →
    **tự kiểm tra lại qua service_role query**: `ai_jobs.result` đúng
    slug, `books.data.meta.tags` đổi thật sang giá trị mới do Gemini sinh,
    `books.pending_data` đã về `null`.
  - **Việc nợ nhỏ, không chặn gì**: `ai_jobs.status` không tự chuyển sang
    trạng thái "đã publish" sau khi duyệt — vẫn hiện `ready_for_review`
    trong `/admin/jobs` dù đã xong, chỉ là hiển thị chưa chính xác 100%,
    không ảnh hưởng chức năng.
  - **Job "ingest" đã mở khoá và test thật thành công (2026-08-11)** — user
    đưa file khoá JSON Service Account, tôi tự đọc trực tiếp (không dán
    key vào chat), lưu `GOOGLE_SA_PRIVATE_KEY` vào `.env.local` + Vercel.
    Viết `lib/googleDrive.ts` (JWT Bearer flow bằng `node:crypto`, không
    cần thư viện ngoài) + `lib/aiJobs/ingest.ts`. Test thật folder Drive
    chỉ có 1 file Google Docs (~500.000 ký tự, 1 cuốn hồi ký/sách dịch) —
    phạm vi bản đầu chỉ hỗ trợ Google Docs (chưa thêm PDF/DOCX vì folder
    hiện chưa có loại đó, tránh thêm dependency khi chưa cần).
  - **Sự cố thật gặp phải + đã sửa**: lần xử lý đầu tiên bị Vercel 504
    (Runtime Timeout) sau ~2 phút 39 giây dù đã set `maxDuration=60`, để
    lại job kẹt vĩnh viễn ở `status='processing'` (không có cách retry qua
    UI). Đo lại bằng script độc lập cho thấy pipeline thật (token 281ms +
    export Drive 3.3s + Gemini 80k ký tự 16.3s) chỉ ~20 giây — không giải
    thích được lần treo đó, khả năng là 1 lần Gemini phản hồi chậm bất
    thường. Sửa phòng ngừa thay vì đoán mù:
    1. Thêm `AbortSignal.timeout()` cho mọi fetch ra ngoài (Gemini 45s,
       Drive 15-20s) — request chậm sẽ lỗi rõ ràng thay vì treo âm thầm.
    2. Job kẹt ở `processing` quá 90 giây được coi là "có thể đã chết",
       cho phép bấm "Xử lý ngay" lại (trước đó chỉ cho retry khi
       `pending`/`error`, không có `processing` — phải sửa tay qua
       Supabase mới gỡ được job kẹt lần đầu).
    3. Bấm lại sau khi deploy fix → **thành công thật**, xác nhận qua
       service_role query: sách nháp `status='draft', source='ingested'`,
       tiêu đề/mô tả đúng nội dung tài liệu gốc, disclaimer đúng, module
       chỉ có 2/5 loại section (concept + exercise) — AI không bịa
       framework/case-study/note vì văn bản gốc không có nội dung phù hợp,
       đúng nguyên tắc chống bịa đã dặn trong prompt.
  - **Tất cả 5/5 loại job (tag/summarize/classify/translate/ingest) đã
    chạy thật thành công trên production. Giai đoạn 2 hoàn thành.**
  - Bản nháp "BƯỚC NGOẶT..." đang chờ ở `/admin/drafts` — nội dung lịch
    sử/chính trị nhạy cảm, để user tự đọc và quyết định Duyệt/Từ chối,
    không tự publish thay.
- **Giai đoạn 1 (auth người đọc + khoá link tải + tiến độ/bookmark + đa
  ngôn ngữ)**: chưa bắt đầu, chờ Giai đoạn 0 build xanh trên production.
- **Giai đoạn 2 (AI job queue), Giai đoạn 3 (backup độc lập)**: chưa bắt
  đầu.
- **Giai đoạn 4 (RAG/Q&A)**: chủ động hoãn theo quyết định của bạn, chỉ
  giữ chỗ kiến trúc (pgvector có sẵn trong Postgres, không cần đổi engine).

---

## Context

Portal đang chạy: `E:\Github_Opensource\GitBook_ca_nhan\creat_gitbook_ca_nhan`
— live tại `https://thuvien-so.vercel.app`, Next.js 16 + Tailwind v4 +
Supabase, scaffold từ skill `foxai-learning-portal`. Hiện **hoàn toàn
tĩnh**: 3 sách nằm trong 1 file `content/portal.json` commit vào Git,
build SSG qua `generateStaticParams`; chỉ có bình luận (ẩn danh) và upload
ảnh chạy qua Supabase, không có auth, không có backend xử lý logic nào.

Người dùng đặt ra 3 mục tiêu vượt xa quy mô hiện tại:

1. **Frontend đọc sách + chia sẻ link đọc/tải** — người đọc phải **đăng
   nhập** mới thấy link tải file.
2. **Backend đầy đủ** chạy AI cho các luồng nghiệp vụ: tổng hợp, tóm tắt,
   gắn tag, phân loại, dịch thuật, hỏi đáp, trợ lý học tập.
3. **Database bền vững, phân tầng đúng loại dữ liệu**: SQL cho dữ liệu có
   cấu trúc (bảng), có backup độc lập (nền tảng sập vẫn lấy lại được dữ
   liệu); file thô (.pdf/.docx) lưu Google Drive; nội dung đã làm sạch
   hiển thị dạng gần-markdown; sẵn sàng mở rộng vector DB (RAG) và graph DB
   sau này mà không phải đập đi xây lại.

So sánh 2 plan riêng lẻ đã thảo trước đó (mở rộng nhẹ portal giữ JSON tĩnh
vs. đổi hẳn sang Postgres + pipeline AI đọc Google Drive): **plan nào
đứng riêng cũng không đạt đủ 3 mục tiêu** — chừng nào nội dung còn là JSON
tĩnh trong Git, kết quả AI sẽ không bao giờ tự lên trang; ngược lại
pipeline AI kia không có auth công khai cho người đọc (chỉ có 1 tài khoản
admin) và không có chiến lược backup. Roadmap dưới đây hợp nhất 2 plan,
theo đúng thứ tự ưu tiên đã chốt: **migrate DB → auth người đọc + tải sách
có khoá → AI job queue mở rộng → backup độc lập → RAG/Q&A (để sau)**. Lưu
trữ file gốc dùng Google Drive; backup tự xây job xuất riêng, không phụ
thuộc gói trả phí của Supabase.

**Nguyên tắc xuyên suốt cả roadmap**: mỗi giai đoạn build + lint + kiểm
chứng thật xong mới deploy và sang giai đoạn kế — không gộp nhiều giai
đoạn vào 1 lần deploy, đúng tinh thần checklist đã có trong
`HUONG-DAN-VAN-HANH.md` mục 7.

---

## Giai đoạn 0 — Migrate nguồn dữ liệu sang Postgres (nền tảng bắt buộc)

**Vì sao bắt buộc trước mọi thứ khác**: cả auth+khoá-link-tải (Giai đoạn
1) lẫn AI job queue (Giai đoạn 2) đều cần ghi/đọc trạng thái tại runtime.
Giữ `content/portal.json` build tĩnh nghĩa là mọi thay đổi (AI ghi bản
nháp, admin duyệt, dịch thuật xong...) sẽ không hiện lên site cho tới khi
ai đó tự `git push` + `vercel --prod` lại — không đáp ứng được cả 3 mục
tiêu.

- `supabase/books-schema.sql` **(đã viết)**: bảng
  `books(slug text primary key, data jsonb not null, status text not null
  default 'draft' check (status in ('draft','published')), source text not
  null default 'manual', created_at, updated_at)`. `data` giữ nguyên shape
  `Book` (`meta` + `modules`) đã định nghĩa ở `lib/types.ts`. RLS: `select`
  công khai chỉ khi `status='published'`; **không có** policy insert/
  update/delete cho `anon`/`authenticated` — mọi ghi đi qua server bằng
  `service_role` key.
- `lib/supabaseServerClient.ts` **(đã viết)** dùng anon key (RLS đã tự
  giới hạn `published`) cho phần đọc công khai; `lib/supabaseAdminClient.ts`
  **(đã viết)** dùng `service_role` key, chỉ import trong code chạy server.
- `lib/content.ts` **(đã viết lại)**: async, đọc từ `books`, bọc
  `unstable_cache` (`revalidate: 60`, tag `'books'`).
- `app/page.tsx`, `app/[book]/page.tsx`, `app/[book]/layout.tsx`,
  `app/[book]/modules/[slug]/page.tsx` **(đã cập nhật)**: bỏ
  `generateStaticParams`, `await` các hàm `content.ts` mới.
- `scripts/migrate-portal-json-to-supabase.mjs` **(đã viết, chưa chạy —
  chờ bạn cung cấp service_role key)**: đẩy 3 sách hiện có
  (`viet-sach-cung-claude`, `lich-su-ai`, `top-repo-github-cho-claude`)
  vào bảng `books` với `status='published', source='manual'`. Giữ
  `content/portal.json` trong repo làm bản lưu trữ lịch sử, không duy trì
  song song 2 nguồn dữ liệu sau khi migrate ổn định.

**Kiểm chứng**: `npm run build && npm run lint` sạch (lint đã sạch; build
sạch TypeScript, còn chờ bảng `books` tồn tại để build xanh hết); mở site
live, xác nhận cả 3 sách hiển thị y hệt nội dung cũ (đọc từ Postgres,
không phải từ JSON nữa).

---

## Giai đoạn 1 — Auth người đọc, khoá link tải, tiến độ đọc, bookmark, đa ngôn ngữ

### 1a. Hai tầng auth tách biệt

Vì Giai đoạn này thêm auth **công khai cho người đọc** (đăng ký/đăng nhập
tự do qua magic link), tầng admin (Giai đoạn 2 cần) không thể chỉ dựa vào
"có session" nữa — độc giả cũng sẽ có session. Phải phân biệt bằng danh
tính, không chỉ bằng trạng thái đăng nhập.

- **Supabase Dashboard (người dùng tự làm)**: Authentication → Providers →
  bật Email, chế độ Magic Link; Authentication → URL Configuration → thêm
  `https://thuvien-so.vercel.app` và `http://localhost:3000` vào Redirect
  URLs.
- `lib/auth.ts` (mới): `signInWithMagicLink(email)` gọi
  `supabase.auth.signInWithOtp(...)`; hook `useSession()` theo khuôn mẫu
  `useSyncExternalStore` mà `ThemeToggle.tsx` đã dùng.
- `components/AuthWidget.tsx` (mới), đặt trong `app/layout.tsx` cạnh
  `ThemeToggle`.
- **Phân quyền admin**: biến môi trường `ADMIN_EMAIL` — mọi Route
  Handler/trang `/admin/*` kiểm tra `session.user.email ===
  process.env.ADMIN_EMAIL` ở server. `middleware.ts` (mới) chặn `/admin/*`
  khi chưa đăng nhập ở tầng UI; Route Handler ghi dữ liệu tự kiểm tra lại
  email ở server trước khi dùng `service_role` client.

### 1b. Khoá link tải sách sau đăng nhập

- `components/Hero.tsx`: nút "🖨️ Tải PDF" và "📥 Tải EPUB" (khi có) chỉ
  render khi `useSession()` có user; chưa đăng nhập thì hiện nút "Đăng
  nhập để tải sách", không disable im lặng.
- `app/[book]/print/page.tsx` (server component) tự kiểm tra session phía
  server trước khi trả nội dung — chặn cả trường hợp gõ thẳng URL.

### 1c. Tiến độ đọc + bookmark

- `supabase/reader-schema.sql` (mới): bảng `reading_progress(user_id,
  book_id, module_id, completed_at)` và `bookmarks(user_id, book_id,
  section_id, created_at)`, RLS `auth.uid() = user_id` cho cả đọc/ghi.
- `components/MarkReadButton.tsx`, dấu ✓ trong `ModuleNav`/`ModuleGrid`,
  dòng tiến độ "X/Y chương đã đọc" trong `Hero.tsx`.
- `components/BookmarkButton.tsx` cạnh `CommentThread`; trang mới
  `app/tu-sach/page.tsx` ("Tủ sách của tôi").

### 1d. Route in PDF (không cần toolchain thêm)

- `app/[book]/print/page.tsx` + khối `@media print` trong
  `app/globals.css`. `window.print()` → Save as PDF. Chạy được ngay trên
  Vercel.

### 1e. Đa ngôn ngữ (dịch AI, có nhãn "chưa xác nhận")

- `lib/types.ts`: thêm `lang?: string`, `translationGroup?: string` vào
  `PortalMeta`.
- Việc dịch chuyển thành 1 loại job trong AI job queue ở Giai đoạn 2
  (`job_type='translate'`), đi qua cùng luồng duyệt-trước-khi-publish.
  Giữ nguyên `module.id`/`section.id` giữa các bản dịch để
  `LanguageSwitcher` link đúng module tương ứng.

**Kiểm chứng**: gửi magic link thật, đăng nhập được; thử tải sách khi
CHƯA đăng nhập → chỉ thấy nút "Đăng nhập để tải"; đăng nhập xong → nút
tải hiện, `/print` chặn khi gọi thẳng URL ẩn danh; đánh dấu đọc/bookmark
lưu được qua F5; `ADMIN_EMAIL` vào `/admin` được, email khác bị chặn.

---

## Giai đoạn 2 — AI job queue (mở rộng, không chỉ ingest tự động)

- `supabase/ai-jobs-schema.sql` (mới): bảng `ai_jobs(id, job_type text
  check (job_type in ('ingest','summarize','tag','classify','translate')),
  book_id, payload jsonb, status, result jsonb, attempt_count, created_at,
  updated_at)`.
- `app/admin/jobs/page.tsx` (mới): submit job mới, xem tiến độ.
- **Ingest Drive** (`job_type='ingest'`): Service Account
  (`drive.readonly`), Edge Function trích văn bản (Google Docs export API,
  PDF qua `unpdf`, `.docx` qua `mammoth`), cắt ngưỡng ~80.000 ký tự.
- **Summarize/tag/classify**: Anthropic API + Structured Outputs, schema
  build từ `lib/types.ts` + danh mục hợp lệ từ `lib/categories.ts`, đối
  chiếu lại kết quả với `CATEGORY_TREE` trước khi ghi.
- **Translate**: input 1 `book_id` đã publish + `targetLang`; output là 1
  `book` object mới (`module.id`/`section.id` giữ nguyên,
  `meta.disclaimer` = "Bản dịch bằng AI, chưa được xác nhận"), ghi
  `status='draft'`.
- Mọi job xong → `books.status='draft'` → màn duyệt
  (`app/admin/drafts/...`, `app/api/admin/books/[slug]/publish/route.ts`
  gọi `revalidateTag('books')`).
- Model mặc định `claude-sonnet-5` qua `AI_JOB_MODEL_ID`, đổi được sang
  `claude-opus-5` không cần deploy lại. *Giá/token chưa xác minh trong
  phiên này — tự kiểm tra bảng giá tại console Anthropic.*
- **Ẩn nguồn Drive**: `app/api/drive-proxy/[bookSlug]/route.ts` stream
  file gốc qua domain riêng thay vì nhúng thẳng `drive.google.com`; áp
  dụng luôn cho 3 sách hiện có.

**Kiểm chứng**: submit job `tag` → draft mới với tag hợp lệ; submit
`translate` → bản nháp mới, duyệt xong `LanguageSwitcher` link đúng
chiều; submit `ingest` 1 folder Drive thật → bản nháp hợp lệ; "Xem bản
gốc" qua proxy không có request tới `drive.google.com` trong Network tab.

---

## Giai đoạn 3 — Backup độc lập (không phụ thuộc Supabase)

Supabase gói Free **không có** point-in-time recovery — không thể coi "có
Postgres" là đã có backup.

- `scripts/backup-export.mjs` (mới): (1) `pg_dump` toàn schema public →
  `.sql`, chứa dữ liệu cá nhân người đọc → **lưu ở nơi RIÊNG TƯ** (repo/
  Release private), không chung chỗ với file công khai; (2) render
  `dist/<slug>.md` cho mỗi sách `published` — input cho Pandoc xuất
  `.epub` (nút "📥 Tải EPUB" ở Giai đoạn 1b) và cũng là bản backup nội
  dung sạch dạng gần-markdown — công khai được, đăng Release `latest` của
  repo hiện tại.
- `.github/workflows/backup-and-export.yml` (mới): chạy theo lịch +
  `workflow_dispatch`, tách rõ đích `.sql` (private) và `.md`/`.epub`
  (public).
- Secrets thêm: `SUPABASE_DB_URL` (connection string, khác anon/
  service_role key).

**Kiểm chứng**: chạy workflow thủ công → restore thử `.sql` vào 1
Postgres test, xác nhận đọc lại được; mở `.epub` bằng app đọc epub thật;
xác nhận Release chứa `.sql` KHÔNG public.

---

## Giai đoạn 4 — RAG / Hỏi đáp / Trợ lý học tập (để sau, chỉ giữ chỗ mở rộng)

- Không đổi engine — bật `pgvector` trong Postgres hiện có khi cần
  (`create extension if not exists vector;`).
- Khi triển khai: bảng `embeddings(book_id, section_id, content,
  embedding vector(...))`, job `job_type='embed'` trong hàng đợi đã có,
  giao diện chat gọi retrieval + Anthropic API.
- **Graph DB**: mô tả bằng bảng `edges(from_book, to_book, relation)` +
  `WITH RECURSIVE` trong Postgres đang có; chỉ cân nhắc graph DB thật khi
  cần thuật toán đồ thị chuyên biệt mà SQL đệ quy không đáp ứng nổi.

---

## File/thư mục liên quan chính

`E:\Github_Opensource\GitBook_ca_nhan\creat_gitbook_ca_nhan\` —
`content/portal.json` (nguồn migrate 1 lần), `lib/{types,content,
supabaseClient,supabaseServerClient,supabaseAdminClient,auth,categories}.ts`,
`components/{Hero,SectionRenderer,ModuleNav,ModuleGrid,CommentThread,
AuthWidget,MarkReadButton,BookmarkButton,LanguageSwitcher}.tsx`,
`app/{page,[book]/page,[book]/layout,[book]/modules/[slug]/page,
[book]/print/page,tu-sach/page}.tsx`, `app/admin/**`, `app/api/admin/**`,
`middleware.ts`, `supabase/{books-schema,reader-schema,ai-jobs-schema}.sql`
+ các file `schema.sql`/`storage-setup.sql` đã có, `scripts/
{migrate-portal-json-to-supabase,backup-export}.mjs`,
`.github/workflows/backup-and-export.yml`, `HUONG-DAN-VAN-HANH.md` (cập
nhật cuối mỗi giai đoạn lớn).

## Kiểm chứng chung toàn roadmap

Mỗi giai đoạn (0→3): `npm run build && npm run lint` sạch → test luồng
thật qua `npm run dev` → deploy `npx vercel --prod` → mở lại
`https://thuvien-so.vercel.app` xác nhận trên production. Không báo "hoàn
thành" một giai đoạn khi backup chưa thử restore thật, hoặc khi job AI
chưa chạy qua ít nhất 1 lượt thật với dữ liệu thật.
