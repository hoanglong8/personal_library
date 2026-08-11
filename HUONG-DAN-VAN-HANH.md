# Hướng dẫn vận hành Portal "Thư viện số"

Portal chạy tại **https://thuvien-so.vercel.app** (alias cũ
`https://creatgitbookcanhan.vercel.app` vẫn sống, trỏ cùng deployment).
Bắt đầu từ skill `foxai-learning-portal`, sau đó nâng cấp qua nhiều giai
đoạn (xem `.claude/plans/roadmap-thu-vien-so.md` để biết lịch sử/lý do
từng quyết định kiến trúc). Tài liệu này ghi lại cách vận hành hiện tại —
đọc lại khi cần thay vì hỏi lại từ đầu.

## 1. Kiến trúc tóm tắt

- **Code**: repo GitHub `hoanglong8/personal_library` (đổi tên từ
  `creat_gitbook_ca_nhan` — remote đã cập nhật, GitHub tự redirect nếu ai
  còn dùng tên cũ), Next.js 16, thư mục local
  `E:\Github_Opensource\GitBook_ca_nhan\creat_gitbook_ca_nhan`.
- **Nội dung sách — nguồn dữ liệu thật là Supabase Postgres (bảng
  `books`), KHÔNG PHẢI `content/portal.json`** — file đó chỉ còn là bản
  lưu trữ lịch sử của lần migrate đầu tiên, sửa file đó không có tác dụng
  gì với site đang chạy. Mọi thay đổi nội dung đi qua `/admin/edit/[slug]`
  hoặc AI job queue (`/admin/jobs`), xem mục 2-3.
- **Auth**: 2 tầng tách biệt — độc giả đăng nhập công khai bằng magic link
  (Supabase Auth), admin nhận diện bằng biến môi trường `ADMIN_EMAIL`
  (không phải 1 tầng quyền riêng trong Supabase). Mọi Route Handler admin
  verify qua `Authorization: Bearer <token>`, xem `lib/adminAuth.ts`.
- **Hosting**: Vercel project `hoanglong8s-projects/creat_gitbook_ca_nhan`
  (tên project trên Vercel KHÔNG đổi theo tên repo GitHub).
- **Supabase project**: `viet-sach-cung-claude-portal` (ref
  `lamaeusnlxnlcfahtube`) — chứa toàn bộ bảng: `books`, `comments`,
  `reading_progress`, `bookmarks`, `ai_jobs`, storage bucket
  `portal-images`.
- Một portal chứa nhiều sách, mỗi sách 1 URL `/<slug>`. Sách có
  `meta.sourceUrl` (link Google Drive) tự có nút "📄 Xem bản gốc". Panel
  chủ đề bên trái trang chủ phân loại theo `lib/categories.ts`.

## 2. Sửa nội dung một sách đang có

**Cách A — trang biên tập (khuyến nghị, không cần Claude Code):**
`/admin/edit/<slug>` (link "Sửa nội dung" ở `/admin/drafts`, hoặc gõ thẳng
URL) — sửa tiêu đề/mô tả/tag/thumbnail, sửa từng mục theo đúng loại
(concept/framework/case-study/note/exercise/image), xoá mục, thêm ảnh
(nút "Thêm ảnh vào cuối chương", lấy link ở `/chen-anh`), hoặc nhập cả 1
chương mới từ file `.md` (nút "+ Nhập chương mới từ file .md" — dòng `#`
đầu file → tên chương, `##` → mục mới, `![alt](link)` → khối ảnh đúng vị
trí). Bấm **Lưu** để ghi thẳng vào Postgres — nếu sách đang công khai,
thay đổi lên site ngay lập tức, không cần build/deploy lại.

**Cách B — AI Job Queue** (`/admin/jobs`): các job "Gắn tag"/"Tóm
tắt"/"Phân loại" đề xuất chỉnh sửa cho sách **đã publish**, đi qua bước
duyệt riêng ở `/admin/drafts` trước khi áp dụng — xem mục 3.

**Cách C — nhờ Claude Code**: mô tả muốn đổi gì, Claude sửa trực tiếp qua
Supabase (cần `SUPABASE_SERVICE_ROLE_KEY` trong `.env.local`) hoặc hướng
dẫn qua UI ở trên.

Không còn "Cách sửa `content/portal.json` trên GitHub.com" — sửa file đó
không ảnh hưởng gì tới site nữa.

## 3. Thêm một sách mới

**3 cách, tuỳ nguồn nội dung:**

1. **Từ file `.md` đã có sẵn (dịch tay, hoặc công cụ ngoài như
   silaBook)**: `/admin/import` — điền tên/slug/ngôn ngữ, chọn "Bản dịch
   của: [sách gốc]" nếu đây là bản dịch (để nút chuyển ngôn ngữ nhận diện
   đúng), tải lên 1 hoặc nhiều file `.md` (mỗi file = 1 chương) → tạo sách
   **nháp** → chuyển sang `/admin/edit/<slug>` để rà lại → duyệt/publish ở
   `/admin/drafts`.
2. **Dịch tự động bằng AI**: `/admin/jobs` → job "Dịch thuật" → chọn sách
   gốc + mã ngôn ngữ đích → "Xử lý ngay" → ra sách nháp (đã đánh dấu "chưa
   xác nhận") → rà lại + duyệt/publish như trên.
3. **Từ tài liệu Google Drive**: `/admin/jobs` → job "Nhập từ Google
   Drive" → tự đọc 1 Google Doc **chưa từng ingest** trong folder đã cấu
   hình (`GOOGLE_DRIVE_INGEST_FOLDER_URL`), tóm tắt thành 1 chương (không
   bịa nội dung không có trong tài liệu gốc) → sách nháp.

Mọi sách mới đều ở trạng thái **draft** (chưa duyệt, chưa công khai) —
xem mục "Vòng đời 1 sách" bên dưới.

**Muốn sách hiện đúng chỗ trong panel chủ đề bên trái?** Sửa
`meta.domain`/`meta.field` ở trang edit, dùng đúng `id` có sẵn trong
`lib/categories.ts` (không tự đặt tên domain mới).

## 4. Vòng đời 1 sách (draft → reviewed → published)

```
draft (mới, AI/nhập tay tạo ra, chưa ai xem)
  --[Duyệt ở /admin/drafts]--> reviewed (nội dung đã duyệt, CHƯA công khai)
  --[Publish ở /admin/drafts]--> published (công khai trên trang chủ)
  --[Ngừng công khai]--> reviewed (rút khỏi trang chủ, giữ nguyên nội dung)
```

Sách **đã publish** mà bị 1 job AI (tag/summarize/classify) đề xuất sửa:
đề xuất nằm ở cột riêng (`pending_data`), **không đụng vào bản đang công
khai** cho tới khi bấm Duyệt ở `/admin/drafts` — Duyệt lúc đó áp dụng
thẳng, sách vẫn ở `published` xuyên suốt (không qua lại `draft`).

`/admin/drafts` chia 3 khu vực đúng theo vòng đời trên: **Chờ duyệt**,
**Đã duyệt chờ công khai**, **Đang công khai**.

## 5. Chèn ảnh — thumbnail và ảnh trong bài

Trang **`/chen-anh`** (link "Chèn ảnh" ở header): dán link ảnh có sẵn,
hoặc tải file từ máy lên Supabase Storage (bucket `portal-images`, cần đã
chạy `supabase/storage-setup.sql` 1 lần) — trả về 1 link ảnh công khai.
Dùng link đó ở trang edit (`meta.thumbnail`, hoặc nút "Thêm ảnh vào cuối
chương") — không cần sửa JSON tay nữa.

## 6. AI Job Queue (`/admin/jobs`)

5 loại job, đều gọi Gemini (`GEMINI_API_KEY`, model mặc định
`gemini-flash-latest` — dùng alias `-latest`, không hard-code phiên bản
cụ thể, tránh lặp lại lỗi model bị Google deprecate):

| Job | Input | Kết quả |
|---|---|---|
| Gắn tag | 1 sách đã publish | đề xuất `meta.tags` mới |
| Tóm tắt | 1 sách đã publish | đề xuất `meta.subtitle` mới |
| Phân loại | 1 sách đã publish | đề xuất `meta.domain`/`field` (ép đúng `lib/categories.ts`, không cho AI tự bịa) |
| Dịch thuật | 1 sách + mã ngôn ngữ | 1 sách nháp mới, giữ nguyên `module.id`/`section.id` để liên kết đa ngôn ngữ |
| Nhập từ Drive | folder Drive đã cấu hình | 1 sách nháp mới, tự bỏ qua file đã ingest trước đó |

Job bấm "Xử lý ngay" chạy đồng bộ trong 1 request (không có worker nền) —
nếu job kẹt ở `processing` quá 90 giây (vd Vercel timeout), nút tự đổi
thành "có thể đã bị treo — bấm để thử lại", không cần sửa tay qua
Supabase.

## 7. Deploy

### 7a. Deploy thủ công (đang dùng, luôn chạy được)

```bash
cd creat_gitbook_ca_nhan
npm install && npm run build && npm run lint   # phải sạch
npx vercel --prod
```

**Luôn chạy thêm bước này ngay sau đó** — `thuvien-so.vercel.app` là alias
gán tay, không tự theo production:

```bash
# lấy URL bản deploy vừa tạo từ dòng "Production ..." ở output lệnh trên
npx vercel alias set <url-bản-deploy-vừa-tạo> thuvien-so.vercel.app
```

Rồi kiểm chứng bằng `curl` thật vào `thuvien-so.vercel.app` — không tin
log "Deployment ready" hay log gán alias là đủ. Muốn hết phải nhớ bước
này: **Vercel Dashboard → project → Settings → Domains**, đặt
`thuvien-so.vercel.app` làm domain chính ("Production").

### 7b. Deploy tự động khi push GitHub (chưa nối)

Push code lên GitHub **không** tự động deploy (Vercel GitHub App chưa
được cấp quyền truy cập repo `personal_library`). Muốn bật: **Vercel
Dashboard → project `creat_gitbook_ca_nhan` → Settings → Git → Connect
Git Repository** → chọn `hoanglong8/personal_library`.

**Biến môi trường trên Vercel** (Project Settings → Environment
Variables, môi trường Production) — khác hẳn `.env.local`, phải set riêng
mỗi khi thêm biến mới, dễ quên: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`GEMINI_API_KEY`, `ADMIN_EMAIL`, `GOOGLE_SA_EMAIL`,
`GOOGLE_SA_PRIVATE_KEY`, `GOOGLE_DRIVE_INGEST_FOLDER_URL`.

## 8. Quản lý bình luận (Supabase)

- Xem/xoá bình luận: **supabase.com/dashboard** → project
  `viet-sach-cung-claude-portal` → **Table Editor** → bảng `comments`
  (cột `book_id` cho biết thuộc sách nào).
- Bình luận mở tự do (không cần đăng nhập, không kiểm duyệt trước khi
  hiện) — khác với `reading_progress`/`bookmarks` (RLS riêng theo
  `auth.uid()`, chỉ chủ tài khoản đọc/sửa được của mình).

## 9. Checklist trước khi coi một lần cập nhật là "xong"

- [ ] `npm run build` sạch (không lỗi type).
- [ ] `npm run lint` sạch.
- [ ] Mở `npm run dev` xem local trước khi deploy.
- [ ] SQL migration mới (nếu có, trong `supabase/*.sql`) đã chạy trên
      Supabase Dashboard thật, không chỉ viết file.
- [ ] Biến môi trường mới (nếu có) đã set trên **cả** `.env.local`
      **và** Vercel Production — thiếu 1 trong 2 nơi rất dễ bị bỏ sót.
- [ ] Sau deploy: `npx vercel alias set` lại `thuvien-so.vercel.app`, rồi
      tự `curl`/mở link production kiểm tra đúng nội dung — đừng tin log
      "Deployment ready" là đủ.

## 10. Tham chiếu nhanh

| Thứ | Giá trị |
|---|---|
| Site live | https://thuvien-so.vercel.app (alias cũ: https://creatgitbookcanhan.vercel.app) |
| Repo GitHub | https://github.com/hoanglong8/personal_library |
| Vercel project | `hoanglong8s-projects/creat_gitbook_ca_nhan` |
| Supabase project | `viet-sach-cung-claude-portal` (ref `lamaeusnlxnlcfahtube`) |
| Roadmap/lịch sử quyết định | `.claude/plans/roadmap-thu-vien-so.md` |
| Skill nguồn ban đầu | `~/.claude/skills/foxai-learning-portal` |
