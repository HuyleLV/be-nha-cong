import { DataSource } from 'typeorm';
import { Building } from '../../modules/building/entities/building.entity';
import { Apartment } from '../../modules/apartment/entities/apartment.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Location } from '../../modules/locations/entities/locations.entity';

/**
 * Buildings and Apartments Seeding
 * Creates sample buildings and apartments with realistic data
 */
export async function seedBuildingsAndApartments(
  dataSource: DataSource,
  locations: any,
  host?: User,
) {
  console.log('🏢 Seeding buildings and apartments...');

  const buildingRepository = dataSource.getRepository(Building);
  const apartmentRepository = dataSource.getRepository(Apartment);

  if (!locations.baDinh) {
    console.log('⚠️  Locations not found, skipping buildings...');
    return { buildings: [], apartments: [] };
  }

  // Create more buildings
  const buildingData = [
    {
      name: 'Chung Cư Green Tower',
      slug: 'chung-cu-green-tower',
      address: '123 Đường Láng, Ba Đình, Hà Nội',
      locationId: locations.baDinh.id,
      lat: '21.0285',
      lng: '105.8542',
      floors: 25,
      units: 200,
      yearBuilt: 2020,
      status: 'active' as const,
      description:
        'Chung cư cao cấp với đầy đủ tiện ích, gần trung tâm thành phố',
    },
    {
      name: 'Tòa Nhà Skyline',
      slug: 'toa-nha-skyline',
      address: '456 Phố Hàng Bông, Hoàn Kiếm, Hà Nội',
      locationId: locations.hoanKiem?.id || locations.baDinh.id,
      lat: '21.0245',
      lng: '105.8412',
      floors: 15,
      units: 120,
      yearBuilt: 2018,
      status: 'active' as const,
      description: 'Tòa nhà hiện đại, view đẹp, tiện nghi đầy đủ',
    },
    {
      name: 'Khu Nhà Trọ Sinh Viên',
      slug: 'khu-nha-tro-sinh-vien',
      address: '789 Đường Cầu Giấy, Cầu Giấy, Hà Nội',
      locationId: locations.cauGiay?.id || locations.baDinh.id,
      lat: '21.0305',
      lng: '105.8000',
      floors: 5,
      units: 50,
      yearBuilt: 2015,
      status: 'active' as const,
      description:
        'Khu nhà trọ dành cho sinh viên, giá rẻ, gần các trường đại học',
    },
    {
      name: 'Chung Cư Diamond Plaza',
      slug: 'chung-cu-diamond-plaza',
      address: '321 Đường Nguyễn Trãi, Thanh Xuân, Hà Nội',
      locationId: locations.thanhXuan?.id || locations.baDinh.id,
      lat: '21.0000',
      lng: '105.8000',
      floors: 20,
      units: 150,
      yearBuilt: 2019,
      status: 'active' as const,
      description: 'Chung cư cao cấp với nhiều tiện ích hiện đại',
    },
    {
      name: 'Tòa Nhà Sunrise',
      slug: 'toa-nha-sunrise',
      address: '654 Đường Láng Hạ, Đống Đa, Hà Nội',
      locationId: locations.dongDa?.id || locations.baDinh.id,
      lat: '21.0100',
      lng: '105.8200',
      floors: 12,
      units: 80,
      yearBuilt: 2017,
      status: 'active' as const,
      description: 'Tòa nhà yên tĩnh, phù hợp cho gia đình',
    },
  ];

  const buildings: Building[] = [];
  for (const data of buildingData) {
    const existing = await buildingRepository.findOne({
      where: { slug: data.slug },
    });

    if (!existing) {
      const building = buildingRepository.create({
        ...data,
        createdBy: host?.id,
      });
      await buildingRepository.save(building);
      buildings.push(building);
      console.log(`✅ Created building: ${data.name}`);
    } else {
      buildings.push(existing);
    }
  }

  // Create more apartments with diverse data
  const apartmentData = [
    // Building 1 - Green Tower
    {
      title: 'Phòng trọ đẹp, gần trung tâm Ba Đình',
      slug: 'phong-tro-dep-gan-trung-tam-ba-dinh',
      excerpt: 'Phòng trọ sạch sẽ, đầy đủ tiện nghi, gần các trường đại học',
      description:
        '<p>Phòng trọ rộng rãi, thoáng mát, có đầy đủ nội thất cơ bản. Gần các trường đại học, thuận tiện đi lại. Có wifi, điều hòa, nước nóng.</p>',
      locationId: locations.baDinh.id,
      buildingId: buildings[0]?.id,
      streetAddress: '123 Đường Láng, Ba Đình',
      lat: '21.0285',
      lng: '105.8542',
      bedrooms: 1,
      bathrooms: 1,
      livingRooms: 0,
      areaM2: '25',
      rentPrice: '3000000',
      depositAmount: '3000000',
      currency: 'VND',
      status: 'published' as const,
      roomStatus: 'o_ngay' as const,
      hasAirConditioner: true,
      hasWaterHeater: true,
      hasWardrobe: true,
      hasBed: true,
      hasMattress: true,
      hasPrivateBathroom: true,
      hasWashingMachine: true,
      hasFridge: true,
      hasElevator: true,
      createdBy: host?.id,
    },
    {
      title: 'Căn hộ 2 phòng ngủ, view đẹp, đầy đủ nội thất',
      slug: 'can-ho-2-phong-ngu-view-dep-day-du-noi-that',
      excerpt: 'Căn hộ hiện đại, view đẹp, đầy đủ tiện nghi',
      description:
        '<p>Căn hộ 2 phòng ngủ, 1 phòng khách, đầy đủ nội thất. View đẹp, yên tĩnh. Phù hợp cho gia đình nhỏ hoặc nhóm bạn.</p>',
      locationId: locations.hoanKiem?.id || locations.baDinh.id,
      buildingId: buildings[1]?.id,
      streetAddress: '456 Phố Hàng Bông, Hoàn Kiếm',
      lat: '21.0245',
      lng: '105.8412',
      bedrooms: 2,
      bathrooms: 2,
      livingRooms: 1,
      areaM2: '60',
      rentPrice: '8000000',
      depositAmount: '8000000',
      currency: 'VND',
      status: 'published' as const,
      roomStatus: 'sap_trong' as const,
      hasAirConditioner: true,
      hasWaterHeater: true,
      hasWardrobe: true,
      hasBed: true,
      hasMattress: true,
      hasBedding: true,
      hasSofa: true,
      hasDressingTable: true,
      hasPrivateBathroom: true,
      hasWashingMachine: true,
      hasFridge: true,
      hasKitchenCabinet: true,
      hasElevator: true,
      createdBy: host?.id,
    },
    {
      title: 'Phòng trọ sinh viên giá rẻ, gần Bách Khoa',
      slug: 'phong-tro-sinh-vien-gia-re-gan-bach-khoa',
      excerpt: 'Phòng trọ giá rẻ, phù hợp sinh viên',
      description:
        '<p>Phòng trọ nhỏ gọn, giá rẻ, phù hợp sinh viên. Gần các trường đại học Bách Khoa, Kinh tế Quốc dân. Có wifi, nước nóng.</p>',
      locationId: locations.cauGiay?.id || locations.baDinh.id,
      buildingId: buildings[2]?.id,
      streetAddress: '789 Đường Cầu Giấy, Cầu Giấy',
      lat: '21.0305',
      lng: '105.8000',
      bedrooms: 1,
      bathrooms: 1,
      livingRooms: 0,
      areaM2: '20',
      rentPrice: '2000000',
      depositAmount: '2000000',
      currency: 'VND',
      status: 'published' as const,
      roomStatus: 'o_ngay' as const,
      hasAirConditioner: false,
      hasWaterHeater: true,
      hasWardrobe: true,
      hasBed: true,
      hasSharedBathroom: true,
      createdBy: host?.id,
    },
    {
      title: 'Studio hiện đại, full nội thất, gần metro',
      slug: 'studio-hien-dai-full-noi-that-gan-metro',
      excerpt: 'Studio đẹp, đầy đủ tiện nghi, gần ga metro',
      description:
        '<p>Studio rộng rãi, thiết kế hiện đại, đầy đủ nội thất. Gần ga metro, thuận tiện đi lại. Phù hợp cho người đi làm hoặc sinh viên.</p>',
      locationId: locations.thanhXuan?.id || locations.baDinh.id,
      buildingId: buildings[3]?.id,
      streetAddress: '321 Đường Nguyễn Trãi, Thanh Xuân',
      lat: '21.0000',
      lng: '105.8000',
      bedrooms: 0,
      bathrooms: 1,
      livingRooms: 0,
      areaM2: '30',
      rentPrice: '4500000',
      depositAmount: '4500000',
      currency: 'VND',
      status: 'published' as const,
      roomStatus: 'o_ngay' as const,
      hasAirConditioner: true,
      hasWaterHeater: true,
      hasWardrobe: true,
      hasBed: true,
      hasMattress: true,
      hasPrivateBathroom: true,
      hasWashingMachine: true,
      hasFridge: true,
      hasKitchenCabinet: true,
      hasElevator: true,
      createdBy: host?.id,
    },
    {
      title: 'Căn hộ 3 phòng ngủ, phù hợp gia đình',
      slug: 'can-ho-3-phong-ngu-phu-hop-gia-dinh',
      excerpt: 'Căn hộ rộng rãi, đầy đủ tiện nghi cho gia đình',
      description:
        '<p>Căn hộ 3 phòng ngủ, 2 phòng tắm, 1 phòng khách rộng. Đầy đủ nội thất cao cấp. Phù hợp cho gia đình có trẻ nhỏ.</p>',
      locationId: locations.dongDa?.id || locations.baDinh.id,
      buildingId: buildings[4]?.id,
      streetAddress: '654 Đường Láng Hạ, Đống Đa',
      lat: '21.0100',
      lng: '105.8200',
      bedrooms: 3,
      bathrooms: 2,
      livingRooms: 1,
      areaM2: '90',
      rentPrice: '12000000',
      depositAmount: '12000000',
      currency: 'VND',
      status: 'published' as const,
      roomStatus: 'sap_trong' as const,
      hasAirConditioner: true,
      hasWaterHeater: true,
      hasWardrobe: true,
      hasBed: true,
      hasMattress: true,
      hasBedding: true,
      hasSofa: true,
      hasDressingTable: true,
      hasPrivateBathroom: true,
      hasWashingMachine: true,
      hasFridge: true,
      hasKitchenCabinet: true,
      hasRangeHood: true,
      hasElevator: true,
      allowPet: true,
      createdBy: host?.id,
    },
    {
      title: 'Phòng trọ mini, giá siêu rẻ cho sinh viên',
      slug: 'phong-tro-mini-gia-sieu-re-cho-sinh-vien',
      excerpt: 'Phòng trọ nhỏ, giá rẻ nhất khu vực',
      description:
        '<p>Phòng trọ mini, giá siêu rẻ, phù hợp sinh viên có ngân sách hạn chế. Gần các trường đại học, có wifi miễn phí.</p>',
      locationId: locations.hoangMai?.id || locations.baDinh.id,
      buildingId: null,
      streetAddress: '111 Đường Giải Phóng, Hoàng Mai',
      lat: '20.9800',
      lng: '105.8500',
      bedrooms: 1,
      bathrooms: 1,
      livingRooms: 0,
      areaM2: '15',
      rentPrice: '1500000',
      depositAmount: '1500000',
      currency: 'VND',
      status: 'published' as const,
      roomStatus: 'o_ngay' as const,
      hasWaterHeater: true,
      hasBed: true,
      hasSharedBathroom: true,
      createdBy: host?.id,
    },
    {
      title: 'Căn hộ penthouse view đẹp, nội thất sang trọng',
      slug: 'can-ho-penthouse-view-dep-noi-that-sang-trong',
      excerpt: 'Penthouse cao cấp, view toàn cảnh thành phố',
      description:
        '<p>Penthouse trên tầng cao nhất, view đẹp, nội thất sang trọng. Đầy đủ tiện nghi cao cấp. Phù hợp cho người có thu nhập cao.</p>',
      locationId: locations.baDinh.id,
      buildingId: buildings[0]?.id,
      streetAddress: '123 Đường Láng, Ba Đình',
      lat: '21.0285',
      lng: '105.8542',
      bedrooms: 4,
      bathrooms: 3,
      livingRooms: 2,
      areaM2: '150',
      rentPrice: '25000000',
      depositAmount: '25000000',
      currency: 'VND',
      status: 'published' as const,
      roomStatus: 'sap_trong' as const,
      floorNumber: 25,
      hasAirConditioner: true,
      hasWaterHeater: true,
      hasWardrobe: true,
      hasBed: true,
      hasMattress: true,
      hasBedding: true,
      hasSofa: true,
      hasDressingTable: true,
      hasPrivateBathroom: true,
      hasWashingMachine: true,
      hasFridge: true,
      hasKitchenCabinet: true,
      hasRangeHood: true,
      hasElevator: true,
      allowPet: true,
      createdBy: host?.id,
    },
  ];

  let createdCount = 0;
  const apartments: Apartment[] = [];

  for (const data of apartmentData) {
    const existing = await apartmentRepository.findOne({
      where: { slug: data.slug },
    });

    if (!existing) {
      const apartment = apartmentRepository.create(data);
      await apartmentRepository.save(apartment);
      apartments.push(apartment);
      createdCount++;
      console.log(`✅ Created apartment: ${data.title}`);
    } else {
      apartments.push(existing);
    }
  }

  if (createdCount === 0) {
    console.log('⚠️  Apartments already exist, skipping...');
  } else {
    console.log(`✅ Created ${createdCount} apartments`);
  }

  return { buildings, apartments };
}
