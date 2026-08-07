# creat_gitbook_ca_nhan
Dự án tạo các gitbook cá nhân để phục vụ học tập, nghiên cứu, chia sẻ tài nguyên...

<img width="1262" height="939" alt="image" src="https://github.com/user-attachments/assets/33afb033-9251-4378-9033-b9e5e0ea2f80" />

---

## Portal học tập

Next.js 16 + Tailwind v4 + Supabase, scaffolded bởi skill Claude Code
`foxai-learning-portal`. Site live: **https://thuvien-so.vercel.app**
— portal chứa nhiều sách, mỗi sách dựng từ một tài liệu nguồn (PDF/DOCX/
XLSX), có tìm kiếm/lọc tag ở trang chủ và bình luận thật qua Supabase.

**Sửa nội dung, thêm sách mới, deploy (thủ công/tự động), quản lý bình
luận** → xem **[HUONG-DAN-VAN-HANH.md](./HUONG-DAN-VAN-HANH.md)**.

### Chạy thử local

```bash
npm install
npm run dev
```

Cần `.env.local` (xem `.env.example`) để bật bình luận thật; không có thì
trang vẫn chạy bình thường, chỉ phần bình luận hiện "chưa được kích hoạt".
