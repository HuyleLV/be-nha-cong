import { DataSource } from 'typeorm';
import { Category } from '../../modules/categories/entities/category.entity';

export async function seedCategories(dataSource: DataSource) {
    const categoryRepo = dataSource.getRepository(Category);

    console.log('    Seeding categories (Finance, Asset, Job)...');

    const categories = [
        // --- FINANCE (Thu-Chi) ---
        // Thu (Income)
        { name: 'Tiền thuê phòng', type: 'finance', description: 'Thu tiền thuê hàng tháng' },
        { name: 'Tiền dịch vụ', type: 'finance', description: 'Thu điện, nước, dịch vụ' },
        { name: 'Tiền cọc', type: 'finance', description: 'Thu tiền đặt cọc' },
        { name: 'Thu khác', type: 'finance', description: 'Các khoản thu khác' },
        // Chi (Expense)
        { name: 'Tiền điện', type: 'finance', description: 'Chi trả tiền điện cho EVN' },
        { name: 'Tiền nước', type: 'finance', description: 'Chi trả tiền nước' },
        { name: 'Internet', type: 'finance', description: 'Chi cước viễn thông' },
        { name: 'Vệ sinh', type: 'finance', description: 'Chi thuê dọn dẹp' },
        { name: 'Bảo trì', type: 'finance', description: 'Chi sửa chữa, bảo dưỡng' },
        { name: 'Hoàn cọc', type: 'finance', description: 'Trả lại cọc cho khách' },
        { name: 'Chi khác', type: 'finance', description: 'Các khoản chi khác' },

        // --- ASSET (Tài sản) ---
        { name: 'Giường ngủ', type: 'asset', description: 'Giường gỗ, giường sắt...' },
        { name: 'Tủ quần áo', type: 'asset', description: 'Tủ gỗ, tủ lắp ghép...' },
        { name: 'Bàn làm việc', type: 'asset', description: '' },
        { name: 'Ghế', type: 'asset', description: '' },
        { name: 'Điều hòa', type: 'asset', description: 'Máy lạnh' },
        { name: 'Bình nóng lạnh', type: 'asset', description: '' },
        { name: 'Tủ lạnh', type: 'asset', description: '' },
        { name: 'Máy giặt', type: 'asset', description: '' },
        { name: 'Kệ bếp', type: 'asset', description: '' },
        { name: 'Sofa', type: 'asset', description: '' },
        { name: 'Rèm cửa', type: 'asset', description: '' },

        // --- JOB (Loại công việc) ---
        { name: 'Sửa chữa điện', type: 'job', description: 'Sửa bóng đèn, ổ cắm, đường dây...' },
        { name: 'Sửa chữa nước', type: 'job', description: 'Sửa ống nước, vòi, rò rỉ...' },
        { name: 'Sơn sửa', type: 'job', description: 'Sơn tường, trần, chống thấm' },
        { name: 'Vệ sinh công nghiệp', type: 'job', description: 'Dọn dẹp tổng thể' },
        { name: 'Dọn phòng', type: 'job', description: 'Dọn dẹp định kỳ' },
        { name: 'Giặt ủi', type: 'job', description: 'Giặt sấy chăn, ga, quần áo' },
        { name: 'Diệt côn trùng', type: 'job', description: 'Diệt mối, muỗi, kiến, gián' },
        { name: 'Vận chuyển', type: 'job', description: 'Chuyển đồ, chuyển nhà' },
        { name: 'Lắp đặt', type: 'job', description: 'Lắp đặt thiết bị mới' },

        // --- SYSTEM (Cấu hình) ---
        { name: 'Hotline Chính', type: 'system', slug: 'hotline-main', description: 'Số hotline hiển thị trang chủ', meta: { phone: '1900xxxx' } },
        { name: 'Zalo OA', type: 'system', slug: 'zalo-oa-config', description: 'Cấu hình Zalo Official Account', meta: { oaId: '', secret: '' } },
    ];

    const savedCategories = [];

    for (const cat of categories) {
        // Check exist by slug (auto generated name->slug) or explict slug if provided
        let slug = cat.slug;
        if (!slug) {
            // simple slugify for check
            slug = cat.name.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[đĐ]/g, 'd')
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
        }

        const exists = await categoryRepo.findOne({
            where: [
                { slug: slug },
                { name: cat.name, type: cat.type as any } // fallback check
            ]
        });

        if (!exists) {
            const newCat = categoryRepo.create({
                ...cat,
                isActive: true,
                slug: slug // Service will handle this usually, but here we set manual or rely on BeforeInsert if entity has it. 
                // Checked entity: it doesn't seem to have @BeforeInsert slug generation logic in the entity class itself 
                // (it was in Service). So we generate it here to be safe.
            } as any);
            const saved = await categoryRepo.save(newCat);
            savedCategories.push(saved);
        }
    }

    console.log(`    ✅ Seeded ${savedCategories.length} new categories.`);
    return savedCategories;
}
