# 🏆 Small Victory (Chiến Thắng Nhỏ)

> **Ứng dụng PWA giúp bạn khởi đầu ngày mới có chủ đích và khép lại trong tự hào.**

Dự án được xây dựng với kiến trúc hiện đại, phân tách rõ ràng giữa **Frontend Next.js (PWA)** và **Backend Golang**, lưu trữ dữ liệu với **MongoDB** và quản lý ảnh đám mây với **Cloudinary**.

---

## 🌟 Tính Năng Chính

1. 🌅 **Ghi Mục Đích Đầu Ngày (Morning Intention)**:
   - Đặt ý niệm cốt lõi cho ngày (Daily One Big Intention).
   - Đánh giá mức năng lượng khởi đầu ngày (⚡ 1 đến 5 sao).
   - Lập danh sách mục tiêu kèm nhãn ưu tiên: 🔥 *Quan trọng nhất*, ⚡ *Cần làm*, 🌱 *Mở rộng*.

2. 📸 **Chụp 1 Tấm Hình Đầu Ngày (Morning Snap)**:
   - Viewfinder máy ảnh trực tiếp trong app (hỗ trợ chuyển camera trước / sau, chớp sáng, âm thanh chụp ảnh chân thực).
   - Hỗ trợ chọn ảnh từ thư viện thiết bị.
   - Tự động đóng dấu thời gian (watermark) và tải ảnh an toàn lên **Cloudinary**.

3. 🌙 **Hiện Lại List Vào Cuối Ngày & Kiểm Tra Hoàn Thành (Evening Review)**:
   - Tự động gợi ý vào buổi tối hoặc truy cập bất cứ lúc nào.
   - Hiện lại toàn bộ danh sách mục tiêu đã đặt lúc sáng dưới dạng Checklist tương tác.
   - Âm thanh chuông báo (Chime) và hiệu ứng pháo hoa (**Canvas Confetti**) khi hoàn thành mục tiêu.
   - Thanh tiến độ động (`3/4 mục tiêu - 75%`).
   - Tự suy ngẫm cuối ngày, chấm sao cảm xúc và nút **"Đóng Dấu Hoàn Thành Ngày"**.

4. 🏆 **Nhật Ký Chiến Thắng Nhỏ (Micro-Wins Journal)**:
   - Ghi lại các bước tiến nhỏ trong ngày cho cả **văn bản (text)** và **hình ảnh (img)**.
   - Gắn nhãn danh mục: `#BảnThân`, `#CôngViệc`, `#SứcKhỏe`, `#HọcTập`, `#ThóiQuen`.
   - Xem dạng thẻ ảnh (Grid Cards), hỗ trợ phóng to ảnh (Lightbox) và thống kê chuỗi ngày liên tiếp (Streak 🔥).

5. 📱 **Tiêu Chuẩn Progressive Web App (PWA)**:
   - Cài đặt trực tiếp lên màn hình chính điện thoại (iOS, Android) hoặc máy tính (Windows, macOS) như ứng dụng native.
   - Hỗ trợ Service Worker với bộ nhớ đệm (Cache) và chế độ hoạt động offline độc lập.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: [Next.js](https://nextjs.org/) (App Router, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti, Web Audio API).
- **Backend**: [Golang](https://go.dev/) ([Gin Web Framework](https://gin-gonic.com/), Go MongoDB Driver).
- **Database**: [MongoDB](https://www.mongodb.com/) (Collections: `days`, `wins`).
- **Media Cloud**: [Cloudinary](https://cloudinary.com/) (Tải ảnh chụp đầu ngày & ảnh chiến thắng, có fallback lưu local nếu chưa cấu hình API key).
- **PWA Engine**: Service Worker, Web App Manifest, Standalone Mode.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Chuẩn bị MongoDB
Bạn có thể dùng MongoDB cài sẵn trên máy, MongoDB Atlas (Cloud), hoặc chạy nhanh qua Docker Compose:

```bash
docker-compose up -d
```

### 2. Khởi chạy Backend (Golang)

```bash
# Di chuyển vào thư mục backend
cd backend

# Cấu hình biến môi trường (copy từ .env.example)
# Điền thông tin Cloudinary của bạn vào backend/.env
cp .env.example .env

# Chạy server
go run ./cmd/server
```
> Server sẽ chạy tại: `http://localhost:8080` (API endpoint: `http://localhost:8080/api`).

### 3. Khởi chạy Frontend (Next.js)

Mở một cửa sổ Terminal mới:

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt thư viện (nếu chưa cài)
npm install

# Khởi chạy chế độ phát triển (Development)
npm run dev
```
> Mở trình duyệt và truy cập: `http://localhost:3000`

---

## ☁️ Cấu Hình Cloudinary

Tạo tài khoản miễn phí tại [Cloudinary](https://cloudinary.com/) và lấy thông tin trong Dashboard:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Điền các thông số này vào file `backend/.env`:
```env
CLOUDINARY_CLOUD_NAME=ten_cloud_cua_ban
CLOUDINARY_API_KEY=api_key_cua_ban
CLOUDINARY_API_SECRET=api_secret_cua_ban
```
*(Nếu chưa cấu hình Cloudinary, hệ thống sẽ tự động chuyển sang lưu tạm vào thư mục `backend/uploads/` mà không làm gián đoạn trải nghiệm của bạn)*.

---

## 📱 Cài Đặt PWA Lên Thiết Bị

- **Trên Điện Thoại (iOS Safari)**: Nhấn nút **Share** (Chia sẻ) -> chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
- **Trên Điện Thoại (Android Chrome)**: Nhấn nút **"Cài App"** trên thanh Header hoặc chọn menu 3 chấm -> **"Cài đặt ứng dụng"**.
- **Trên Máy Tính (Chrome / Edge)**: Nhấn biểu tượng cài đặt (máy tính có mũi tên tải xuống) trên thanh địa chỉ URL.

---

## 📄 Bản Quyền
Dự án được khởi tạo và lưu trữ tại repository: [https://github.com/macchu25/small-victory.git](https://github.com/macchu25/small-victory.git)
