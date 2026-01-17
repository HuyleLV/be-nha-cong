import { DataSource } from 'typeorm';
import { Location } from '../../modules/locations/entities/locations.entity';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Locations Seeding from CSV
 * Reads danh-muc-phuong-xa.csv and creates full location hierarchy
 * Structure: Province -> District -> Ward
 */
export async function seedLocationsFromCSV(dataSource: DataSource) {
  console.log('📍 Seeding locations from CSV (3-level hierarchy)...');

  const locationRepository = dataSource.getRepository(Location);

  // Read CSV file - adjust path based on where the CSV is located
  const possiblePaths = [
    path.join(process.cwd(), 'danh-muc-phuong-xa.csv'),
    path.join(__dirname, '../../../..', 'danh-muc-phuong-xa.csv'),
    path.join(process.cwd(), '..', 'danh-muc-phuong-xa.csv'),
    path.join(process.cwd(), '..', '..', 'danh-muc-phuong-xa.csv'),
    path.join(__dirname, '../../..', 'danh-muc-phuong-xa.csv'),
    path.join(__dirname, '../../../', 'danh-muc-phuong-xa.csv'),
    // Add be-nha-cong root path explicitly
    path.join(process.cwd(), 'be-nha-cong', 'danh-muc-phuong-xa.csv'),
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
    return {};
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter((line) => line.trim());

  // Data Structures
  interface WardData {
    code: string;
    name: string;
    fullRow: any;
  }
  interface DistrictData {
    code: string; // 2 digits
    name: string; // inferred
    wards: WardData[];
    rawName: string; // original name of the district placeholder
  }
  interface ProvinceData {
    name: string;
    code: string; // 3 digits
    districts: Map<string, DistrictData>;
  }

  const provinces = new Map<string, ProvinceData>();

  // Skip header
  const dataLines = lines.slice(1);

  for (const line of dataLines) {
    if (!line.trim()) continue;

    // Parse CSV
    const cols: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { cols.push(current.trim()); current = ''; }
      else { current += char; }
    }
    cols.push(current.trim());

    if (cols.length < 7) continue;

    const [stt, maTinhBNV, tenTinh, maTinhTMS, soTuTang, maPhuongXa, tenPhuongXa] = cols;

    if (!maTinhTMS || !tenTinh || !maPhuongXa) continue;

    // 1. Province
    const provCode = maTinhTMS;
    if (!provinces.has(provCode)) {
      provinces.set(provCode, {
        name: tenTinh,
        code: provCode,
        districts: new Map(),
      });
    }
    const province = provinces.get(provCode)!;

    // 2. District & Ward Extraction
    // Logic: maPhuongXa (8 chars) = Prov(3) + Dist(2) + Ward(3)
    // Example: 101 05 001

    // Fallback for codes that might be short/long? Assume standard 8 digits from example.
    // If not 8, we try to parse carefully.

    let distCode = '00';
    if (maPhuongXa.length >= 5) {
      // Start after province code length? Usually Prov Code in CSV is 3 digits matching prefix?
      // Check if maPhuongXa starts with maTinhTMS
      if (maPhuongXa.startsWith(maTinhTMS)) {
        distCode = maPhuongXa.substring(maTinhTMS.length, maTinhTMS.length + 2);
      } else {
        // Fallback: take characters 3-5 (index 3,4)
        distCode = maPhuongXa.substring(3, 5);
      }
    }

    if (!province.districts.has(distCode)) {
      province.districts.set(distCode, {
        code: distCode,
        name: tenPhuongXa, // Temporary, will be cleaned later or replaced by the "header" row
        rawName: tenPhuongXa, // The first row encountered is treated as defining the district
        wards: [],
      });
    }

    const district = province.districts.get(distCode)!;

    // We add ALL rows as candidates.
    // LATER, we identify which one is the "District Placeholder" and remove it from Wards.
    district.wards.push({
      code: maPhuongXa,
      name: tenPhuongXa,
      fullRow: cols,
    });
  }

  // --- Processing & Saving ---
  const provinceMap: Record<string, Location> = {};
  const districtMap: Record<string, Location> = {};
  const wardMap: Record<string, Location> = {};

  let totalProvinces = 0;
  let totalDistricts = 0;
  let totalWards = 0;

  const createSlug = (name: string): string => {
    return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const cleanName = (name: string): string => {
    return name.replace(/^(Phường|Xã|Thị trấn|Quận|Huyện)\s+/i, '').trim();
  };

  for (const [pCode, pData] of provinces) {
    const pSlug = createSlug(pData.name);

    // 1. Create Province
    let pLoc = await locationRepository.findOne({ where: { slug: pSlug, level: 'Province' } });
    if (!pLoc) {
      pLoc = locationRepository.create({
        name: pData.name,
        slug: pSlug,
        level: 'Province',
        parent: null
      });
      await locationRepository.save(pLoc);
      totalProvinces++;
      console.log(`✅ Province: ${pData.name}`);
    }
    provinceMap[pCode] = pLoc;

    for (const [dCode, dData] of pData.districts) {
      // 2. Identify District Name
      // Heuristic: The FIRST row added to the district group is assumed to be the placeholder.
      // E.g. "Phường Hoàn Kiếm" (Row 1) -> we use "Hoàn Kiếm" as District Name.
      // We assume the sorted order from CSV is correct (first ID is the district).

      const firstWard = dData.wards[0];
      const districtName = cleanName(firstWard.name);

      // Slug
      const dSlug = `${pSlug}-${createSlug(districtName)}`;

      let dLoc = await locationRepository.findOne({ where: { slug: dSlug, level: 'District' } });
      if (!dLoc) {
        dLoc = locationRepository.create({
          name: districtName,
          slug: dSlug,
          level: 'District',
          parent: pLoc
        });
        await locationRepository.save(dLoc);
        totalDistricts++;
      }
      districtMap[`${pCode}-${dCode}`] = dLoc;

      // 3. Create Wards
      // Skip the *first* ward if it is indeed the placeholder (same name as district or just "Phường [DistrictName]")
      // But purely based on index 0 is safer with this dataset pattern.
      const wardsToCreate = dData.wards.slice(1);

      for (const w of wardsToCreate) {
        const wName = w.name;
        // Unique slug: prov-dist-ward
        const wSlug = `${dSlug}-${createSlug(wName)}`;

        const existingWard = await locationRepository.findOne({ where: { slug: wSlug, level: 'Ward' } });
        if (!existingWard) {
          const wLoc = locationRepository.create({
            name: wName,
            slug: wSlug,
            level: 'Ward',
            parent: dLoc
          });
          await locationRepository.save(wLoc);
          wardMap[w.code] = wLoc;
          totalWards++;
        }
      }
    }
  }

  console.log(`✅ Seeding Complete. Prov: ${totalProvinces}, Dist: ${totalDistricts}, Wards: ${totalWards}`);

  return { provinces: provinceMap, districts: districtMap, wards: wardMap };
}
