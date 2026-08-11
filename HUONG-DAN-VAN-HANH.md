# Hướng dẫn vận hành Portal "Thư viện số"

Portal học tập chạy tại **https://thuvien-so.vercel.app** (domain cũ
`https://creatgitbookcanhan.vercel.app` vẫn còn sống, trỏ cùng
deployment — chưa gỡ để tránh hỏng link đã chia sẻ trước đó), dựng bởi
skill `foxai-learning-portal` (`~/.claude/skills/foxai-learning-portal`
trên máy có Claude Code). Tài liệu này ghi lại cách sửa nội dung, thêm
sách mới, và deploy — để đọc lại khi cần mà không phải hỏi lại từ đầu.

## 1. Kiến trúc tóm tắt

- **Code + nội dung**: repo GitHub `hoanglong8/creat_gitbook_ca_nhan`,
  Next.js 16. Toàn bộ nội dung sách nằm trong **một file**:
  `content/portal.json`.
- **Bình luận**: lưu trên Supabase project `viet-sach-cung-claude-portal`
  (ref `lamaeusnlxnlcfahtube`), không nằm trong repo.
- **Hosting**: Vercel project `hoanglong8s-projects/creat_gitbook_ca_nhan`.
- Một portal chứa được **nhiều sách** — mỗi sách là một phần tử trong mảng
  `books` của `portal.json`, có URL riêng `/<slug-sách>`. Hiện có 2 sách:
  `/viet-sach-cung-claude` (Hoàng Trần) và `/lich-su-ai` (Trần Đức Hoàng).
- Sách có `meta.sourceUrl` (link Google Drive) sẽ tự có nút nổi
  "📄 Xem bản gốc" — mở panel nhúng PDF gốc song song với nội dung đã viết
  lại. Cả 2 sách hiện có đều đã bật tính năng này.
- Trang chủ có **panel chủ đề bên trái** (`components/CategorySidebar.tsx`)
  phân loại sách theo cây cố định ở `lib/categories.ts`: Khoa học tự nhiên,
  Khoa học xã hội, Nhân học, Công nghệ thông tin (mỗi domain có vài nhánh
  con). Gán qua `meta.domain`/`meta.field` trong `portal.json` — xem mục 3.

## 2. Sửa nội dung một sách đang có

Nội dung (chương, case study, khung kiến thức, bài tập, tag, tác giả...)
nằm trong `content/portal.json`, theo kiểu dữ liệu ở `lib/types.ts`. Có 2
cách sửa:

**Cách A — nhờ Claude Code (khuyến nghị):** mở Claude Code trong thư mục
project, mô tả muốn đổi gì ("sửa đoạn case study ở chương 3", "thêm tag
mới cho sách", "đổi tên tác giả"...). Claude sửa đúng field trong JSON,
`npm run build` để kiểm cú pháp trước khi commit, rồi hỏi bạn có muốn
deploy luôn không.

**Cách B — tự sửa trên GitHub.com:** vào repo → `content/portal.json` →
biểu tượng bút chì → sửa → Commit. Rủi ro: gõ sai cú pháp JSON (thiếu dấu
phẩy/ngoặc) sẽ làm site **build lỗi và không deploy được** — nếu không
chắc, dùng Cách A hoặc nhờ Claude kiểm tra lại trước khi push.

Sau khi sửa xong, xem mục 5 để đưa bản mới lên site live — sửa file không
tự động cập nhật trang đang chạy.

## 3. Thêm một sách mới

1. Đưa file nguồn (PDF/DOCX/XLSX) cho Claude Code, nói muốn thêm vào
   portal đang có (không phải tạo portal mới).
2. Claude trích nội dung + soạn thành một `book` object mới (title,
   author, tags, modules...), thêm vào cuối mảng `books` trong
   `content/portal.json` — **không đụng vào sách cũ**.
3. `npm run build && npm run lint` phải sạch — route mới `/<slug-mới>` tự
   sinh, không cần sửa code.
4. Không cần tạo Supabase project mới — một project phục vụ mọi sách nhờ
   cột `book_id` cách ly bình luận theo từng sách.
5. Deploy lại (mục 5).

Chi tiết máy móc hơn (quy tắc đặt `slug`, cách viết `author`/`tags`/
`publishedAt`/`sourceUrl` trung thực) nằm ở
`~/.claude/skills/foxai-learning-portal/references/content-structuring.md`.

**Muốn bật "Xem bản gốc" cho sách mới?** Đưa Claude link chia sẻ Google
Drive tới file gốc (đặt quyền chia sẻ **"Anyone with the link"**, không thì
panel nhúng sẽ báo lỗi truy cập) — Claude điền vào `meta.sourceUrl`, không
cần sửa code gì thêm.

**Muốn sách mới hiện đúng chỗ trong panel chủ đề bên trái?** Nói Claude
sách thuộc lĩnh vực nào (vd "sách này về Vật lý" hoặc "về AI/công nghệ") —
Claude điền `meta.domain`/`meta.field` bằng đúng `id` có sẵn trong
`lib/categories.ts` (không tự đặt tên domain mới). Nếu chưa có nhánh phù
hợp trong cây hiện tại, nói Claude mở rộng `lib/categories.ts` trước.

## 4. Chèn ảnh — thumbnail và ảnh trong bài

Trang **`/chen-anh`** (link "Chèn ảnh" ở header) là công cụ tự phục vụ:
dán link ảnh có sẵn, hoặc chọn file từ máy để tải lên — cả hai cách đều
trả về một link ảnh công khai kèm nút "Chép link". Trang này **chỉ tạo
link ảnh**, không tự gắn vào sách nào — đưa link đó cho Claude Code (hoặc
tự dán vào `content/portal.json`) để thực sự dùng làm:

- **Ảnh đại diện (thumbnail)** của một sách: điền vào `meta.thumbnail`.
  Sách không có `thumbnail` sẽ tự hiện ảnh mặc định theo tông màu portal.
- **Ảnh chèn giữa nội dung bài viết**: thêm một section kiểu
  `{ "type": "image", "url": "...", "alt": "...", "caption": "..." }` vào
  mảng `sections` của module, ở đúng vị trí muốn ảnh xuất hiện.

**Tải ảnh lên** dùng Supabase Storage (bucket `portal-images`, cùng
project Supabase phục vụ bình luận) — **cần chạy một lần**
`supabase/storage-setup.sql` trong Supabase SQL Editor trước khi tab "Tải
ảnh lên" hoạt động (tab "Dán link có sẵn" luôn hoạt động, không phụ thuộc
bước này). Bucket giới hạn sẵn 5MB/ảnh và chỉ nhận jpg/png/webp/gif/svg,
mở tự do không cần đăng nhập — cùng triết lý "mở, không xác thực" như
bảng bình luận (xem mục 6). Nếu bị lạm dụng sau này, siết policy insert
trong `storage-setup.sql` (ví dụ yêu cầu `auth.uid()`).

## 5. Deploy

### 5a. Deploy thủ công (đang dùng, luôn chạy được)

```bash
cd creat_gitbook_ca_nhan
npm install && npm run build && npm run lint   # phải sạch
npx vercel --prod
```

Lệnh này build và đẩy thẳng lên Vercel production, không phụ thuộc Git.
Vercel tự cập nhật `creatgitbookcanhan.vercel.app` (domain mặc định của
project), **nhưng KHÔNG tự cập nhật `thuvien-so.vercel.app`** — domain đó
là alias gán tay, không tự theo dõi "production". Phát hiện ngày
2026-08-10: sau 1 lần `vercel --prod`, `creatgitbookcanhan.vercel.app` đã
có tính năng mới nhưng `thuvien-so.vercel.app` vẫn phục vụ 1 bản deploy cũ
(404 ở các route mới) cho tới khi chạy lệnh gán lại alias — **luôn chạy
thêm bước này sau mỗi lần `vercel --prod`**:

```bash
# lấy URL bản deploy vừa tạo từ output lệnh trên (dòng "Production ...")
npx vercel alias set <url-bản-deploy-vừa-tạo> thuvien-so.vercel.app
```

Sau đó luôn kiểm chứng bằng `curl` thật vào `thuvien-so.vercel.app` (không
chỉ tin log "Deployment ready" hay log gán alias) trước khi báo deploy
xong. Muốn hết phải nhớ bước này: vào **Vercel Dashboard → project →
Settings → Domains**, đặt `thuvien-so.vercel.app` làm domain chính
("Production") thay vì chỉ là alias rời — việc này chỉ user tự làm được
qua dashboard.

### 5b. Bật tự động deploy khi push GitHub (chưa nối — làm 1 lần)

Hiện tại push code lên GitHub **không** tự động deploy — lần đầu nối
Vercel với repo qua CLI đã báo lỗi *"Failed to connect repo to project"*
(nhiều khả năng do Vercel GitHub App chưa được cấp quyền truy cập repo
này). Đây là thao tác cấp quyền tài khoản, Claude không tự làm thay được.
Để bật, tự bạn vào:

**Vercel Dashboard → chọn project `creat_gitbook_ca_nhan` → Settings →
Git → Connect Git Repository** → chọn `hoanglong8/creat_gitbook_ca_nhan`.
Nếu Vercel chưa thấy repo trong danh sách, vào **GitHub → Settings →
Applications → Vercel → Repository access** và thêm quyền cho repo này.

Sau khi nối xong: mỗi lần `git push` lên nhánh `main` (dù bạn tự sửa trên
GitHub hay Claude push giúp) site sẽ tự build và deploy — không cần chạy
lệnh 5a nữa. Tự kiểm tra bằng cách push một thay đổi nhỏ và xem tab
**Deployments** trên Vercel có chạy job mới không.

## 6. Quản lý bình luận (Supabase)

- Xem/xoá bình luận: **supabase.com/dashboard** → project
  `viet-sach-cung-claude-portal` → **Table Editor** → bảng `comments`.
  Cột `book_id` cho biết bình luận thuộc sách nào.
- Bình luận hiện mở tự do (không cần đăng nhập, không kiểm duyệt trước khi
  hiện) — đúng thiết kế ban đầu. Nếu sau này cần duyệt trước khi hiện
  công khai, xem mục "Chạy schema" trong
  `references/supabase-setup.md` (thêm cột `approved`, sửa policy).
- **Việc còn nợ**: nếu Personal Access Token Supabase dùng để setup ban
  đầu chưa thu hồi, vào **supabase.com/dashboard/account/tokens** thu hồi
  — token đó có quyền tạo/xoá project, không nên để tồn tại lâu.

## 7. Checklist trước khi coi một lần cập nhật là "xong"

- [ ] `npm run build` sạch (không lỗi type/JSON).
- [ ] `npm run lint` sạch.
- [ ] Mở `npm run dev` xem local trước khi deploy, nhất là sau khi sửa
      tay trên GitHub.
- [ ] Sau khi deploy: tự mở link production, kiểm tra đúng nội dung vừa
      sửa/thêm — đừng tin log "Deployment ready" là đủ.

## 8. Tham chiếu nhanh

| Thứ | Giá trị |
|---|---|
| Site live | https://thuvien-so.vercel.app (alias cũ: https://creatgitbookcanhan.vercel.app) |
| Repo GitHub | https://github.com/hoanglong8/creat_gitbook_ca_nhan |
| Vercel project | `hoanglong8s-projects/creat_gitbook_ca_nhan` |
| Supabase project | `viet-sach-cung-claude-portal` (ref `lamaeusnlxnlcfahtube`) |
| Skill nguồn | `~/.claude/skills/foxai-learning-portal` |
