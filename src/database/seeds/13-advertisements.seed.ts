import { DataSource } from 'typeorm';
import { Advertisement } from '../../modules/advertisements/entities/advertisement.entity';

/**
 * Seed Advertisements
 * 
 * Tạo các quảng cáo mẫu để thay thế hardcoded banners
 */
export async function seedAdvertisements(dataSource: DataSource) {
  const repo = dataSource.getRepository(Advertisement);

  const ads = [
    // Homepage Slides - Sử dụng đường dẫn từ frontend assets (sẽ được map sang backend)
    // Admin cần upload ảnh tương ứng hoặc copy từ frontend/assets/banner-*.jpg
    {
      title: 'Banner Trang Chủ 1 - Tìm Phòng Trọ',
      position: 'homepage_slide' as const,
      imageUrl: '/api/static/images/banner-01.jpg', // Hoặc /uploads/banners/banner-01.jpg
      linkUrl: '/tim-phong-quanh-day',
      priority: 10,
      status: 'active' as const,
      description: 'Banner quảng cáo trang chủ - Tìm phòng trọ nhanh chóng, uy tín',
    },
    {
      title: 'Banner Trang Chủ 2 - Ưu Đãi Đặc Biệt',
      position: 'homepage_slide' as const,
      imageUrl: '/api/static/images/banner-02.jpg',
      linkUrl: '/tim-phong-quanh-day',
      priority: 9,
      status: 'active' as const,
      description: 'Banner quảng cáo trang chủ - Ưu đãi đặc biệt cho khách hàng mới',
    },
    {
      title: 'Banner Trang Chủ 3 - Tin Tức & Blog',
      position: 'homepage_slide' as const,
      imageUrl: '/api/static/images/banner-03.jpg',
      linkUrl: '/blog',
      priority: 8,
      status: 'active' as const,
      description: 'Banner quảng cáo trang chủ - Cập nhật tin tức và blog mới nhất',
    },
    {
      title: 'Banner Trang Chủ 4 - Dành Cho Chủ Nhà',
      position: 'homepage_slide' as const,
      imageUrl: '/api/static/images/banner-04.jpg',
      linkUrl: '/danh-cho-chu-nha',
      priority: 7,
      status: 'active' as const,
      description: 'Banner quảng cáo trang chủ - Giải pháp quản lý cho chủ nhà',
    },
    // Footer Ads
    {
      title: 'Quảng Cáo Footer - Tuyển Dụng',
      position: 'footer' as const,
      imageUrl: '/api/static/images/footer-ad-1.jpg',
      linkUrl: '/tuyen-dung',
      priority: 5,
      status: 'active' as const,
      description: 'Quảng cáo footer - Cơ hội nghề nghiệp tại Nhà Cộng',
    },
    {
      title: 'Quảng Cáo Footer - Về Chúng Tôi',
      position: 'footer' as const,
      imageUrl: '/api/static/images/footer-ad-2.jpg',
      linkUrl: '/ve-chung-toi',
      priority: 4,
      status: 'active' as const,
      description: 'Quảng cáo footer - Tìm hiểu về Nhà Cộng',
    },
    // Detail Page Ads
    {
      title: 'Quảng Cáo Sidebar - Tìm Phòng',
      position: 'detail_page' as const,
      imageUrl: '/api/static/images/detail-ad-1.jpg',
      linkUrl: '/tim-phong-quanh-day',
      priority: 6,
      status: 'active' as const,
      description: 'Quảng cáo sidebar trang chi tiết - Tìm phòng trọ',
    },
    {
      title: 'Quảng Cáo Sidebar - Blog',
      position: 'detail_page' as const,
      imageUrl: '/api/static/images/detail-ad-2.jpg',
      linkUrl: '/blog',
      priority: 5,
      status: 'active' as const,
      description: 'Quảng cáo sidebar trang chi tiết - Đọc blog',
    },
    // Popup Ads
    {
      title: 'Popup - Ưu Đãi Đặc Biệt',
      position: 'popup' as const,
      imageUrl: '/api/static/images/popup-ad.jpg',
      linkUrl: '/tim-phong-quanh-day',
      priority: 10,
      status: 'active' as const,
      description: 'Popup quảng cáo - Ưu đãi đặc biệt cho khách hàng mới',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const adData of ads) {
    // Check if ad already exists (by title and position)
    const existing = await repo.findOne({
      where: {
        title: adData.title,
        position: adData.position,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const ad = repo.create({
      ...adData,
      createdBy: null, // System created
    });

    await repo.save(ad);
    created++;
  }

  console.log(`  ✅ Created ${created} advertisements`);
  if (skipped > 0) {
    console.log(`  ⏭️  Skipped ${skipped} existing advertisements`);
  }

  return { created, skipped };
}
