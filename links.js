// Danh sách bài tập của Thảo Ngân.
// Thêm / sửa / xoá link ngay trong file này, lưu lại rồi tải lại trang.
//
// Mỗi bài tập là một dòng { ... }, các trường:
//   title   : tên bài tập (bắt buộc)
//   url     : đường link (bắt buộc)
//   subject : "toan" | "tv" (Tiếng Việt) | "ta" (Tiếng Anh) | "khac"
//   emoji   : biểu tượng (không bắt buộc, mặc định theo môn)
//   note    : ghi chú (không bắt buộc)
//   section : gom vào một mục riêng, VD: "Cuộc thi" (không bắt buộc)
//   fav     : true để ghim lên mục "Hay dùng"
//
// Ví dụ:
//   { title: "Luyện bảng cửu chương", url: "https://...", subject: "toan", emoji: "➕", note: "Mỗi tối 15 phút", fav: true },

window.LINKS = [
  { title: "Bài tập về nhà trên lớp", url: "https://docs.google.com/spreadsheets/d/1toaR38rq50zWISGFuwyh35TEM5zZB4RdZIX01bZo2Ag/edit?usp=sharing", subject: "khac", emoji: "📝", note: "Cô giao bài tập về nhà", fav: true },
  { title: "Cuộc thi Violympic", url: "https://violympic.vn/user-home", subject: "toan", emoji: "🏆", note: "Luyện thi Violympic", section: "Cuộc thi" },
  { title: "Cuộc thi IOE", url: "https://ioe.vn/hoc-sinh", subject: "ta", emoji: "🌍", note: "Thi Tiếng Anh trên mạng", section: "Cuộc thi" },
  { title: "Ôn thi Toán TIMO", url: "https://timo-test-268b2.web.app/", subject: "toan", emoji: "🧮", note: "Luyện đề thi TIMO", section: "Cuộc thi" },
  { title: "Ôn Tiếng Anh trên lớp", url: "https://chungbn.github.io/tieng-anh-thao-ngan/", subject: "ta", emoji: "🔤", note: "Ôn lại bài Tiếng Anh đã học trên lớp" },
  { title: "Luyện cờ vây", url: "https://chungbn.github.io/go-training/", subject: "khac", emoji: "⚫", note: "Luyện chơi cờ vây", section: "Giải trí" },
  { title: "Học đánh vần Tiếng Việt", url: "https://chungbn.github.io/danh-van/", subject: "tv", emoji: "🔠", note: "Luyện đánh vần" },
  { title: "Explore Our World 1", url: "https://learn.eltngl.com/dashboard/assignments", subject: "ta", emoji: "🌎", note: "Bài tập trên National Geographic Learning" },
];
