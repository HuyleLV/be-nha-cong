import { DataSource } from 'typeorm';
import { Location } from '../../modules/locations/entities/locations.entity';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Locations Seeding from CSV
 * Reads danh-muc-phuong-xa.csv and creates full location hierarchy
 * Structure: Province -> Ward (bỏ cấp District/City)
 * CSV format: STT, Mã tỉnh (BNV), Tên tỉnh/TP mới, Mã tỉnh (TMS), Số tự tăng, Mã phường/xã mới, Tên Phường/Xã mới
 */
export async function seedLocationsFromCSV(dataSource: DataSource) {
  console.log('📍 Seeding locations from CSV (all 34 provinces)...');

  const locationRepository = dataSource.getRepository(Location);

  // Read CSV file - adjust path based on where the CSV is located
  // Try multiple possible paths (including Docker container paths)
  const possiblePaths = [
    // Docker container: file is copied to /app/danh-muc-phuong-xa.csv
    path.join(process.cwd(), 'danh-muc-phuong-xa.csv'),
    // Local development: file in backend/ directory
    path.join(__dirname, '../../../..', 'danh-muc-phuong-xa.csv'),
    path.join(process.cwd(), '..', 'danh-muc-phuong-xa.csv'),
    path.join(process.cwd(), '..', '..', 'danh-muc-phuong-xa.csv'),
    // Alternative paths
    path.join(__dirname, '../../..', 'danh-muc-phuong-xa.csv'),
    path.join(__dirname, '../../../', 'danh-muc-phuong-xa.csv'),
  ];

  let csvPath: string | null = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      csvPath = p;
      break;
    }
  }

  if (!csvPath) {
    console.log(
      '⚠️  CSV file not found at any expected location, skipping CSV seeding...',
    );
    console.log('   Tried paths:', possiblePaths);
    return {};
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter((line) => line.trim());

  // Skip header
  const dataLines = lines.slice(1);

  // Parse CSV and group by province (bỏ cấp district)
  interface CSVRow {
    stt: string;
    maTinhBNV: string;
    tenTinh: string;
    maTinhTMS: string;
    soTuTang: string;
    maPhuongXa: string;
    tenPhuongXa: string;
  }

  const provinces = new Map<
    string,
    { name: string; wards: Array<{ code: string; name: string }> }
  >();

  for (const line of dataLines) {
    if (!line.trim()) continue;

    // Parse CSV properly handling commas in quoted fields
    const cols: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cols.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cols.push(current.trim()); // Add last column

    // CSV format: STT, Mã tỉnh (BNV), Tên tỉnh/TP mới, Mã tỉnh (TMS), Số tự tăng, Mã phường/xã mới, Tên Phường/Xã mới
    if (cols.length < 7) continue;

    const [
      stt,
      maTinhBNV,
      tenTinh,
      maTinhTMS,
      soTuTang,
      maPhuongXa,
      tenPhuongXa,
    ] = cols;

    // Process all provinces (không filter theo mã tỉnh)
    if (!maTinhTMS || !tenTinh) continue;

    if (!provinces.has(maTinhTMS)) {
      provinces.set(maTinhTMS, {
        name: tenTinh,
        wards: [],
      });
    }

    const province = provinces.get(maTinhTMS)!;

    if (maPhuongXa && tenPhuongXa) {
      province.wards.push({
        code: maPhuongXa,
        name: tenPhuongXa,
      });
    }
  }

  // Create locations - Structure: Province -> Ward (bỏ cấp District)
  const provinceMap: Record<string, Location> = {};
  const wardMap: Record<string, Location> = {};
  let totalProvinces = 0;
  let totalWards = 0;

  // Helper function to create slug
  const createSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Create all Provinces
  for (const [provinceCode, provinceData] of provinces) {
    const provinceSlug = createSlug(provinceData.name);

    let provinceLocation = await locationRepository.findOne({
      where: { slug: provinceSlug, level: 'Province' },
    });

    if (!provinceLocation) {
      provinceLocation = locationRepository.create({
        name: provinceData.name,
        slug: provinceSlug,
        level: 'Province' as const,
        parent: null,
      });
      await locationRepository.save(provinceLocation);
      totalProvinces++;
      console.log(
        `✅ Created Province: ${provinceData.name} (${provinceData.wards.length} wards)`,
      );
    } else {
      console.log(`⚠️  Province ${provinceData.name} already exists`);
    }

    provinceMap[provinceCode] = provinceLocation;

    // Create Wards directly under Province (bỏ cấp District)
    let createdWards = 0;
    for (const ward of provinceData.wards) {
      const wardSlug = createSlug(ward.name);

      // Create unique slug by combining province slug and ward name
      const uniqueWardSlug = `${provinceSlug}-${wardSlug}`;

      const existingWard = await locationRepository.findOne({
        where: {
          slug: uniqueWardSlug,
          level: 'Ward',
          parent: { id: provinceLocation!.id },
        },
      });

      if (!existingWard) {
        const wardLocation = locationRepository.create({
          name: ward.name,
          slug: uniqueWardSlug,
          level: 'Ward' as const,
          parent: provinceLocation!,
        });
        await locationRepository.save(wardLocation);
        wardMap[ward.code] = wardLocation;
        createdWards++;
        totalWards++;
      } else {
        wardMap[ward.code] = existingWard;
      }
    }

    if (createdWards > 0) {
      console.log(
        `  ✅ Created ${createdWards} wards for ${provinceData.name}`,
      );
    }
  }

  console.log(`✅ Completed seeding locations from CSV`);
  console.log(`   - Total Provinces: ${totalProvinces}`);
  console.log(`   - Total Wards: ${totalWards}`);

  return {
    provinces: provinceMap,
    wards: wardMap,
  };
}
