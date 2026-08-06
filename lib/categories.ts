export interface CategoryField {
  id: string;
  label: string;
}

export interface CategoryDomain {
  id: string;
  label: string;
  fields: CategoryField[];
}

export const CATEGORY_TREE: CategoryDomain[] = [
  {
    id: "khoa-hoc-tu-nhien",
    label: "Khoa học tự nhiên",
    fields: [
      { id: "toan-hoc", label: "Toán học" },
      { id: "vat-ly", label: "Vật lý" },
      { id: "hoa-sinh-hoc", label: "Hóa Sinh học" },
      { id: "ky-thuat", label: "Kỹ thuật" },
    ],
  },
  {
    id: "khoa-hoc-xa-hoi",
    label: "Khoa học xã hội",
    fields: [
      { id: "van-hoc", label: "Văn học" },
      { id: "lich-su", label: "Lịch sử" },
      { id: "dia-ly", label: "Địa lý" },
      { id: "kinh-te-hoc", label: "Kinh tế học" },
      { id: "nghe-thuat", label: "Nghệ thuật" },
    ],
  },
  {
    id: "nhan-hoc",
    label: "Nhân học",
    fields: [
      { id: "triet-hoc", label: "Triết học" },
      { id: "ton-giao", label: "Tôn giáo" },
      { id: "tam-linh-huyen-hoc", label: "Tâm linh - Huyền học" },
    ],
  },
  {
    id: "cong-nghe-thong-tin",
    label: "Công nghệ thông tin",
    fields: [
      { id: "lap-trinh-phan-mem", label: "Lập trình & Phát triển phần mềm" },
      { id: "tri-tue-nhan-tao", label: "Trí tuệ nhân tạo & Machine Learning" },
      { id: "cong-cu-ung-dung-ai", label: "Công cụ & Ứng dụng AI" },
      { id: "khoa-hoc-du-lieu", label: "Khoa học dữ liệu" },
      { id: "an-ninh-mang", label: "An ninh mạng" },
      { id: "he-thong-mang", label: "Hệ thống & Mạng" },
    ],
  },
];
