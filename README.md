# creat_gitbook_ca_nhan
Dự án tạo các gitbook cá nhân để phục vụ học tập, nghiên cứu, chia sẻ tài nguyên...

---

## Portal: Viết Sách Cùng Claude

Next.js 16 + Tailwind v4 + Supabase learning-portal site, scaffolded by the
`foxai-learning-portal` Claude Code skill, dựng từ nội dung `VietSachCungClaude.pdf`.

### Cấu trúc nội dung

Toàn bộ nội dung sống ở `content/portal.json`, gõ theo kiểu trong
`lib/types.ts`. Mỗi module có nhiều `sections`, mỗi section là một trong 5
loại: `concept`, `framework`, `case-study`, `exercise`, `note`. Sửa file này
(không sửa `.tsx`) để thay nội dung.

### Chạy thử local

```bash
npm install
npm run dev
```

### Bật bình luận thật (Supabase)

1. Tạo project tại supabase.com, chạy `supabase/schema.sql` trong SQL Editor.
2. Copy `.env.example` thành `.env.local`, điền `NEXT_PUBLIC_SUPABASE_URL`
   và `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API).
3. `npm run dev` lại — khung bình luận ở cuối mỗi section sẽ hoạt động
   (đọc + ghi + realtime qua `components/CommentThread.tsx`).

Không cấu hình `.env.local` thì trang vẫn chạy bình thường, chỉ phần bình
luận hiện thông báo "chưa được kích hoạt".

### Deploy

```bash
npm run build
```

Push lên Vercel/Netlify, khai báo 2 biến môi trường ở trên trong dashboard.
Xem chi tiết ở `references/deployment.md` của skill `foxai-learning-portal`.
