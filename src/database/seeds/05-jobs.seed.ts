import { DataSource } from 'typeorm';
import { Job } from '../../modules/jobs/entities/job.entity';

/**
 * Jobs Seeding
 * Creates sample job postings
 */
export async function seedJobs(dataSource: DataSource) {
  console.log('💼 Seeding jobs...');

  const jobRepository = dataSource.getRepository(Job);

  const jobData = [
    {
      title: 'Nhân viên Tư vấn Bất động sản',
      slug: 'nhan-vien-tu-van-bat-dong-san',
      description: `
        <h3>Mô tả công việc:</h3>
        <ul>
          <li>Tư vấn khách hàng về các sản phẩm bất động sản</li>
          <li>Hỗ trợ khách hàng tìm kiếm phòng trọ, căn hộ phù hợp</li>
          <li>Chăm sóc khách hàng sau khi ký hợp đồng</li>
          <li>Phát triển mạng lưới khách hàng mới</li>
        </ul>
      `,
      requirements: `
        <h3>Yêu cầu:</h3>
        <ul>
          <li>Tốt nghiệp THPT trở lên</li>
          <li>Kỹ năng giao tiếp tốt</li>
          <li>Nhiệt tình, trách nhiệm</li>
          <li>Ưu tiên có kinh nghiệm trong lĩnh vực bất động sản</li>
        </ul>
      `,
      benefits: `
        <h3>Quyền lợi:</h3>
        <ul>
          <li>Lương cơ bản + hoa hồng hấp dẫn</li>
          <li>Được đào tạo chuyên nghiệp</li>
          <li>Môi trường làm việc năng động</li>
          <li>Cơ hội thăng tiến</li>
        </ul>
      `,
      location: 'Hà Nội',
      employmentType: 'Full-time',
      level: 'Junior',
      salaryMin: 8000000,
      salaryMax: 15000000,
      currency: 'VND',
      status: 'published' as const,
      publishedAt: new Date(),
    },
    {
      title: 'Chuyên viên Marketing Digital',
      slug: 'chuyen-vien-marketing-digital',
      description: `
        <h3>Mô tả công việc:</h3>
        <ul>
          <li>Xây dựng và triển khai chiến lược marketing online</li>
          <li>Quản lý các kênh social media (Facebook, Zalo, TikTok)</li>
          <li>Tạo nội dung marketing hấp dẫn</li>
          <li>Phân tích và báo cáo hiệu quả marketing</li>
        </ul>
      `,
      requirements: `
        <h3>Yêu cầu:</h3>
        <ul>
          <li>Tốt nghiệp Đại học chuyên ngành Marketing, Truyền thông</li>
          <li>Kinh nghiệm 1-2 năm trong lĩnh vực digital marketing</li>
          <li>Thành thạo các công cụ marketing online</li>
          <li>Kỹ năng viết nội dung tốt</li>
        </ul>
      `,
      benefits: `
        <h3>Quyền lợi:</h3>
        <ul>
          <li>Lương thỏa thuận theo năng lực</li>
          <li>Làm việc linh hoạt, có thể remote</li>
          <li>Được tham gia các khóa đào tạo chuyên sâu</li>
        </ul>
      `,
      location: 'Hà Nội / Remote',
      employmentType: 'Full-time',
      level: 'Junior',
      salaryMin: 10000000,
      salaryMax: 20000000,
      currency: 'VND',
      status: 'published' as const,
      publishedAt: new Date(),
    },
    {
      title: 'Kỹ sư Phần mềm (Full-stack)',
      slug: 'ky-su-phan-mem-full-stack',
      description: `
        <h3>Mô tả công việc:</h3>
        <ul>
          <li>Phát triển và bảo trì hệ thống quản lý bất động sản</li>
          <li>Làm việc với team để xây dựng tính năng mới</li>
          <li>Tối ưu hóa hiệu suất hệ thống</li>
          <li>Code review và đảm bảo chất lượng code</li>
        </ul>
      `,
      requirements: `
        <h3>Yêu cầu:</h3>
        <ul>
          <li>Tốt nghiệp Đại học chuyên ngành CNTT</li>
          <li>Thành thạo Node.js, TypeScript, React/Next.js</li>
          <li>Kinh nghiệm với MySQL, TypeORM</li>
          <li>Kỹ năng làm việc nhóm tốt</li>
        </ul>
      `,
      benefits: `
        <h3>Quyền lợi:</h3>
        <ul>
          <li>Lương cạnh tranh: 15-30 triệu/tháng</li>
          <li>Làm việc linh hoạt, có thể remote</li>
          <li>Được học hỏi công nghệ mới</li>
          <li>Môi trường startup năng động</li>
        </ul>
      `,
      location: 'Hà Nội / Remote',
      employmentType: 'Full-time',
      level: 'Senior',
      salaryMin: 15000000,
      salaryMax: 30000000,
      currency: 'VND',
      status: 'published' as const,
      publishedAt: new Date(),
    },
    {
      title: 'Nhân viên Chăm sóc Khách hàng',
      slug: 'nhan-vien-cham-soc-khach-hang',
      description: `
        <h3>Mô tả công việc:</h3>
        <ul>
          <li>Tiếp nhận và xử lý yêu cầu của khách hàng</li>
          <li>Hỗ trợ khách hàng qua điện thoại, email, chat</li>
          <li>Giải quyết khiếu nại và phản hồi của khách hàng</li>
          <li>Cập nhật thông tin khách hàng vào hệ thống</li>
        </ul>
      `,
      requirements: `
        <h3>Yêu cầu:</h3>
        <ul>
          <li>Tốt nghiệp THPT trở lên</li>
          <li>Kỹ năng giao tiếp tốt, thân thiện</li>
          <li>Chịu được áp lực công việc</li>
          <li>Ưu tiên có kinh nghiệm chăm sóc khách hàng</li>
        </ul>
      `,
      benefits: `
        <h3>Quyền lợi:</h3>
        <ul>
          <li>Lương: 7-10 triệu/tháng</li>
          <li>Làm việc theo ca linh hoạt</li>
          <li>Được đào tạo kỹ năng chuyên nghiệp</li>
        </ul>
      `,
      location: 'Hà Nội',
      employmentType: 'Full-time',
      level: 'Junior',
      salaryMin: 7000000,
      salaryMax: 10000000,
      currency: 'VND',
      status: 'published' as const,
      publishedAt: new Date(),
    },
    {
      title: 'Thực tập sinh Marketing',
      slug: 'thuc-tap-sinh-marketing',
      description: `
        <h3>Mô tả công việc:</h3>
        <ul>
          <li>Hỗ trợ team marketing trong các dự án</li>
          <li>Tạo nội dung cho social media</li>
          <li>Nghiên cứu thị trường và đối thủ</li>
          <li>Hỗ trợ tổ chức sự kiện</li>
        </ul>
      `,
      requirements: `
        <h3>Yêu cầu:</h3>
        <ul>
          <li>Đang là sinh viên năm 3, 4 hoặc mới tốt nghiệp</li>
          <li>Chuyên ngành Marketing, Truyền thông</li>
          <li>Nhiệt tình, ham học hỏi</li>
          <li>Có thể làm part-time hoặc full-time</li>
        </ul>
      `,
      benefits: `
        <h3>Quyền lợi:</h3>
        <ul>
          <li>Trợ cấp: 3-5 triệu/tháng</li>
          <li>Được đào tạo thực tế</li>
          <li>Cơ hội được nhận vào làm chính thức</li>
        </ul>
      `,
      location: 'Hà Nội',
      employmentType: 'Intern',
      level: 'Intern',
      salaryMin: 3000000,
      salaryMax: 5000000,
      currency: 'VND',
      status: 'published' as const,
      approvalStatus: 'approved' as const,
      isApproved: true,
      publishedAt: new Date(),
    },
  ];

  let createdCount = 0;
  for (const data of jobData) {
    const existing = await jobRepository.findOne({
      where: { slug: data.slug },
    });

    if (!existing) {
      const job = jobRepository.create({
        ...data,
        approvalStatus: 'approved',
        isApproved: true,
      });
      await jobRepository.save(job);
      createdCount++;
      console.log(`✅ Created job: ${data.title} (slug: ${data.slug})`);
    } else {
      console.log(`⚠️  Job already exists: ${data.title} (slug: ${data.slug})`);
    }
  }

  if (createdCount === 0) {
    console.log('⚠️  Jobs already exist, skipping...');
  } else {
    console.log(`✅ Created ${createdCount} job postings`);
  }
}
