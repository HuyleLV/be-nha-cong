// src/entities/apartment.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';

/*
 * Entity Apartment
 * -----------------
 * Mô tả đầy đủ dữ liệu 1 tin phòng/căn hộ hiển thị ra FE.
 * Phân nhóm các trường theo mục đích sử dụng để dễ bảo trì:
 *  - Address & Geo: thông tin vị trí, toạ độ (lat/lng dạng chuỗi thập phân để tránh sai số)
 *  - Specs: thông số cơ bản (số phòng ngủ, vệ sinh, diện tích, giá, trạng thái...)
 *  - Service fees: các loại phí phát sinh / đơn giá. Cho phép null nếu không áp dụng.
 *  - Furnitures: nội thất kèm theo bên trong phòng/căn hộ (các cờ boolean hiển thị ở mục "Nội thất")
 *  - Amenities: tiện ích sử dụng / điều kiện sinh hoạt ("Tiện ích")
 *  - Notes: ghi chú bổ sung hiển thị phía dưới danh sách, cho admin nhập tự do.
 *  - Verification & Meta: thông tin xác minh + audit (ai tạo, thời điểm tạo/cập nhật).
 *
 * Lý do dùng nhiều cờ boolean: giúp lọc nhanh và đơn giản với TypeORM + MySQL (chỉ số hoá dễ dàng nếu cần).
 * Khi mở rộng thêm tiện ích/nội thất mới: chỉ cần bổ sung cột bool + cập nhật DTO + FE mapping.
 */

export type ApartmentStatus = 'draft' | 'published' | 'archived';

@Entity('apartments')
export class Apartment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  @Index()
  title: string;
  // Tiêu đề hiển thị chính của tin (SEO + UI). Có index để search nhanh theo LIKE.

  @Column({ length: 220, unique: true })
  slug: string;
  // Slug duy nhất dùng cho permalink. BE đảm bảo sinh nếu chưa cung cấp.

  @Column({ length: 300, nullable: true })
  excerpt?: string;
  // Mô tả ngắn (đoạn giới thiệu 1-2 câu). Tuỳ chọn.

  @Column({ type: 'text', nullable: true })
  description?: string;
  // Mô tả chi tiết (HTML). Có thể khá dài.

  @Column({ name: 'location_id', type: 'int' })
  @Index()
  locationId: number; 
  // Khóa ngoại Location (quận/huyện…). Bắt buộc.

  @Column({ name: 'building_id', type: 'int', nullable: true })
  @Index()
  buildingId?: number | null; 
  // Optional: thuộc tòa nhà nào (có thể null nếu phòng lẻ).

  /* ========== Address & Geo ========== */
  @Column({ name: 'street_address', length: 200, nullable: true })
  streetAddress?: string;
  // Địa chỉ chi tiết (số nhà, ngõ, đường). Có thể để trống nếu chỉ hiển thị quận/huyện.

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lat?: string;
  // Vĩ độ dạng chuỗi decimal (precision 7 cho độ chính xác ~1m). Dùng string tránh float rounding.

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lng?: string;
  // Kinh độ tương tự lat.

  /* ========== Specs ========== */
  @Column({ default: 0 })
  bedrooms: number;
  // Số phòng ngủ (>=0). Có thể =0 với dạng phòng studio.

  @Column({ default: 0 })
  bathrooms: number;
  // Số phòng vệ sinh (WC). Phân biệt thêm private/shared bằng các cờ amenities.

  @Column({ name: 'living_rooms', default: 0 })
  livingRooms: number;
  // Số phòng khách (nếu phòng khép kín nhỏ có thể =0).
  
  @Column({ name: 'room_code', length: 50, nullable: true })
  roomCode?: string;
  // Mã phòng/căn hộ nội bộ (ví dụ: P302, A12). Dùng để hiển thị hoặc tra cứu nhanh trong admin.

  @Column({ name: 'floor_number', type: 'int', unsigned: true, nullable: true })
  floorNumber?: number | null;
  // Số tầng trong tòa nhà (bắt đầu từ 1). Null nếu chưa gán hoặc không thuộc tòa. Giúp group hiển thị theo tầng.

  @Column({ name: 'guests', type: 'int', unsigned: true, nullable: true })
  guests?: number;
  // Sức chứa đề xuất (số người ở tối đa). Tuỳ chọn.

  @Column({ name: 'area_m2', type: 'numeric', precision: 7, scale: 2, nullable: true })
  areaM2?: string;
  // Diện tích sử dụng (m²) dạng numeric string để đồng bộ với FE (ví dụ "25.5").

  @Column({ name: 'rent_price', type: 'numeric', precision: 12, scale: 2 })
  rentPrice: string;
  // Giá thuê/tháng (numeric string). Không null.

  @Column({ default: 'VND', length: 10 })
  currency: string;
  // Đơn vị tiền tệ (mặc định VND).

  @Column({ name: 'discount_percent', type: 'int', unsigned: true, nullable: true })
  discountPercent?: number | null;
  // Ưu đãi theo phần trăm (0-100). Null nếu không có ưu đãi.

  @Column({ default: 'draft', length: 20 })
  status: ApartmentStatus;
  // Trạng thái tin: draft/published/archived.

  @Column({ name: 'cover_image_url', type: 'text', nullable: true })
  coverImageUrl?: string;
  // Ảnh cover hiển thị đầu tiên / thumbnail.

  @Column({ name: 'images', type: 'simple-json', nullable: true })
  images?: string[];
  // Danh sách URL ảnh (gallery). BE đảm bảo videoUrl nếu có sẽ đứng đầu thông qua logic riêng.


  /* ========== Service fees ========== */
  @Column({ name: 'electricity_price_per_kwh', type: 'int', unsigned: true, nullable: true })
  electricityPricePerKwh?: number;
  // Đơn giá điện (đ/KWh). Null nếu chưa cập nhật.

  @Column({ name: 'water_price_per_m3', type: 'int', unsigned: true, nullable: true })
  waterPricePerM3?: number;
  // Đơn giá nước (đ/m³).

  @Column({ name: 'internet_price_per_room', type: 'int', unsigned: true, nullable: true })
  internetPricePerRoom?: number;
  // Phí internet / phòng / tháng.

  @Column({ name: 'common_service_fee_per_person', type: 'int', unsigned: true, nullable: true })
  commonServiceFeePerPerson?: number;
  // Phí dịch vụ chung / người / tháng (vệ sinh, rác…).

  // Optional note about service fees
  @Column({ name: 'service_fee_note', type: 'text', nullable: true })
  serviceFeeNote?: string;
  // Ghi chú chi tiết về cơ chế tính phí (hiển thị FE). Ví dụ: "Điện nước tính theo hoá đơn Nhà nước".

  /* ========== Furnitures ========== */
  @Column({ name: 'has_air_conditioner', type: 'bool', default: false })
  hasAirConditioner: boolean;
  // Điều hoà

  @Column({ name: 'has_water_heater', type: 'bool', default: false })
  hasWaterHeater: boolean;
  // Bình nóng lạnh

  @Column({ name: 'has_kitchen_cabinet', type: 'bool', default: false })
  hasKitchenCabinet: boolean;
  // Kệ/bếp có tủ

  @Column({ name: 'has_washing_machine', type: 'bool', default: false })
  hasWashingMachine: boolean;
  // (Cờ tổng hợp cũ - vẫn giữ để tương thích nếu dữ liệu cũ còn dùng)

  @Column({ name: 'has_wardrobe', type: 'bool', default: false })
  hasWardrobe: boolean;
  // Tủ quần áo

  // ===== Additional furnitures (2025-11) =====
  @Column({ name: 'has_bed', type: 'bool', default: false })
  hasBed: boolean;
  // Giường ngủ

  @Column({ name: 'has_mattress', type: 'bool', default: false })
  hasMattress: boolean;
  // Đệm

  @Column({ name: 'has_bedding', type: 'bool', default: false })
  hasBedding: boolean;
  // Bộ ga gối chăn

  @Column({ name: 'has_dressing_table', type: 'bool', default: false })
  hasDressingTable: boolean;
  // Bàn trang điểm

  @Column({ name: 'has_sofa', type: 'bool', default: false })
  hasSofa: boolean;
  // Sofa / ghế dài

  /* ========== Amenities ========== */
  @Column({ name: 'has_private_bathroom', type: 'bool', default: false })
  hasPrivateBathroom: boolean;
  // WC khép kín trong phòng

  @Column({ name: 'has_shared_bathroom', type: 'bool', default: false })
  hasSharedBathroom: boolean;
  // WC dùng chung

  @Column({ name: 'has_washing_machine_shared', type: 'bool', default: false })
  hasWashingMachineShared: boolean;
  // Máy giặt dùng chung (khu vực chung / tầng / toà)

  @Column({ name: 'has_washing_machine_private', type: 'bool', default: false })
  hasWashingMachinePrivate: boolean;
  // Máy giặt riêng trong phòng

  @Column({ name: 'has_desk', type: 'bool', default: false })
  hasDesk: boolean;
  // Bàn làm việc

  @Column({ name: 'has_kitchen_table', type: 'bool', default: false })
  hasKitchenTable: boolean;
  // Bàn bếp / mặt bàn chế biến

  @Column({ name: 'has_range_hood', type: 'bool', default: false })
  hasRangeHood: boolean;
  // Máy hút mùi

  @Column({ name: 'has_fridge', type: 'bool', default: false })
  hasFridge: boolean;
  // Tủ lạnh

  @Column({ name: 'has_mezzanine', type: 'bool', default: false })
  hasMezzanine: boolean;
  // Có gác xép

  @Column({ name: 'no_owner_living', type: 'bool', default: false })
  noOwnerLiving: boolean;
  // Không ở chung với chủ nhà (ưu tiên tìm kiếm)

  @Column({ name: 'flexible_hours', type: 'bool', default: false })
  flexibleHours: boolean;
  // Giờ giấc tự do (không giới hạn giờ đóng cửa)

  /* ========== New amenities (2025-11): Elevator / EV / Pet ========== */
  @Column({ name: 'has_elevator', type: 'bool', default: false })
  hasElevator: boolean;
  // Thang máy

  @Column({ name: 'allow_pet', type: 'bool', default: false })
  allowPet: boolean;
  // Cho phép nuôi thú cưng

  @Column({ name: 'allow_electric_vehicle', type: 'bool', default: false })
  allowElectricVehicle: boolean;
  // Cho phép để xe điện / sạc xe điện

  /* ========== Notes for UI sections (2025-11) ========== */
  @Column({ name: 'furniture_note', type: 'text', nullable: true })
  furnitureNote?: string;
  // Ghi chú bổ sung cho phần Nội thất (hiển thị dưới grid)

  @Column({ name: 'amenities_note', type: 'text', nullable: true })
  amenitiesNote?: string;
  // Ghi chú bổ sung cho phần Tiện ích

  /* ========== Verification ========== */
  @Column({ name: 'is_verified', type: 'bool', default: false })
  isVerified: boolean;
  // Đánh dấu tin đã được kiểm duyệt / xác minh (hiển thị tick xanh FE)

  /* ========== Meta ========== */
  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdById: number;
  // ID user tạo tin (phục vụ thống kê / hiển thị liên hệ)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
  // Thời điểm tạo bản ghi

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
  // Thời điểm cập nhật gần nhất
}
