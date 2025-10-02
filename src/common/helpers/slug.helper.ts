import { Repository, Not } from 'typeorm';

/**
 * Chuyển chuỗi thành slug chuẩn SEO
 */
export function makeSlug(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // bỏ dấu tiếng Việt
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 200);
}

/**
 * Kiểm tra slug đã tồn tại trong DB chưa
 */
export async function slugExists<T>(
  repo: Repository<T>,
  slug: string,
  excludeId?: number,
): Promise<boolean> {
  if (excludeId) {
    const exists = await repo
      .createQueryBuilder('b')
      .where('b.slug = :slug', { slug })
      .andWhere('b.id != :id', { id: excludeId })
      .getExists();
    return exists;
  }

  return (
    (await repo.exists?.({ where: { slug } as any })) ??
    (await repo.count({ where: { slug } as any })) > 0
  );
}

/**
 * Tạo slug duy nhất (tự động thêm -2, -3… nếu bị trùng)
 */
export async function ensureUniqueSlug<T>(
  repo: Repository<T>,
  input: string,
  excludeId?: number,
): Promise<string> {
  const base = makeSlug(input || '');
  let slug = base || String(Date.now());
  let i = 2;

  while (await slugExists(repo, slug, excludeId)) {
    slug = `${base}-${i++}`;
  }

  return slug;
}
