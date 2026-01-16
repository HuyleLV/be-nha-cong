import { DataSource } from 'typeorm';
import { Location } from '../../modules/locations/entities/locations.entity';

/**
 * Locations Seeding
 * Creates Hanoi and wards (mô hình 2 cấp: Tỉnh -> Phường/Xã)
 * Note: This is a legacy seeder. The CSV seeder (02-locations-csv.seed.ts) is the primary source.
 */
export async function seedLocations(dataSource: DataSource) {
  console.log('📍 Seeding locations (legacy - Hà Nội wards)...');

  const locationRepository = dataSource.getRepository(Location);

  // Check if locations already exist
  let hanoi = await locationRepository.findOne({
    where: { slug: 'ha-noi' },
  });

  if (!hanoi) {
    hanoi = locationRepository.create({
      name: 'Hà Nội',
      slug: 'ha-noi',
      level: 'Province' as const,
      parent: null,
    });
    await locationRepository.save(hanoi);
    console.log('✅ Created Hà Nội (Province)');
  } else {
    console.log('⚠️  Hà Nội already exists, skipping...');
  }

  // Create wards (formerly districts, now wards in 2-level model)
  const wards = [
    { name: 'Ba Đình', slug: 'ba-dinh' },
    { name: 'Hoàn Kiếm', slug: 'hoan-kiem' },
    { name: 'Tây Hồ', slug: 'tay-ho' },
    { name: 'Long Biên', slug: 'long-bien' },
    { name: 'Cầu Giấy', slug: 'cau-giay' },
    { name: 'Đống Đa', slug: 'dong-da' },
    { name: 'Hai Bà Trưng', slug: 'hai-ba-trung' },
    { name: 'Hoàng Mai', slug: 'hoang-mai' },
    { name: 'Thanh Xuân', slug: 'thanh-xuan' },
    { name: 'Sóc Sơn', slug: 'soc-son' },
    { name: 'Đông Anh', slug: 'dong-anh' },
    { name: 'Gia Lâm', slug: 'gia-lam' },
    { name: 'Nam Từ Liêm', slug: 'nam-tu-liem' },
    { name: 'Bắc Từ Liêm', slug: 'bac-tu-liem' },
    { name: 'Mê Linh', slug: 'me-linh' },
    { name: 'Hà Đông', slug: 'ha-dong' },
    { name: 'Sơn Tây', slug: 'son-tay' },
    { name: 'Ba Vì', slug: 'ba-vi' },
    { name: 'Phúc Thọ', slug: 'phuc-tho' },
    { name: 'Đan Phượng', slug: 'dan-phuong' },
    { name: 'Hoài Đức', slug: 'hoai-duc' },
    { name: 'Quốc Oai', slug: 'quoc-oai' },
    { name: 'Thạch Thất', slug: 'thach-that' },
    { name: 'Chương Mỹ', slug: 'chuong-my' },
    { name: 'Thanh Oai', slug: 'thanh-oai' },
    { name: 'Thường Tín', slug: 'thuong-tin' },
    { name: 'Phú Xuyên', slug: 'phu-xuyen' },
    { name: 'Ứng Hòa', slug: 'ung-hoa' },
    { name: 'Mỹ Đức', slug: 'my-duc' },
  ];

  let createdCount = 0;
  const wardMap: Record<string, Location> = {};

  for (const ward of wards) {
    const existing = await locationRepository.findOne({
      where: { slug: ward.slug },
    });

    if (!existing) {
      const location = locationRepository.create({
        name: ward.name,
        slug: ward.slug,
        level: 'Ward' as const, // Mô hình 2 cấp: Ward trực thuộc Province
        parent: hanoi,
      });
      await locationRepository.save(location);
      wardMap[ward.slug] = location;
      createdCount++;
    } else {
      wardMap[ward.slug] = existing;
    }
  }

  if (createdCount > 0) {
    console.log(`✅ Created ${createdCount} wards in Hà Nội`);
  } else {
    console.log('⚠️  Wards already exist, skipping...');
  }

  // Return locations in the format expected by other seeders
  // Keep "districts" key for backward compatibility with other seeders
  const baDinh =
    wardMap['ba-dinh'] ||
    (await locationRepository.findOne({ where: { slug: 'ba-dinh' } }));
  const hoanKiem =
    wardMap['hoan-kiem'] ||
    (await locationRepository.findOne({ where: { slug: 'hoan-kiem' } }));
  const cauGiay =
    wardMap['cau-giay'] ||
    (await locationRepository.findOne({ where: { slug: 'cau-giay' } }));
  const dongDa =
    wardMap['dong-da'] ||
    (await locationRepository.findOne({ where: { slug: 'dong-da' } }));
  const thanhXuan =
    wardMap['thanh-xuan'] ||
    (await locationRepository.findOne({ where: { slug: 'thanh-xuan' } }));
  const hoangMai =
    wardMap['hoang-mai'] ||
    (await locationRepository.findOne({ where: { slug: 'hoang-mai' } }));

  return {
    hanoi,
    districts: wardMap, // Keep "districts" key for backward compatibility
    baDinh,
    hoanKiem,
    cauGiay,
    dongDa,
    thanhXuan,
    hoangMai,
  };
}
