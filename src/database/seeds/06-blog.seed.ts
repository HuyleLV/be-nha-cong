import { DataSource } from 'typeorm';
import { Blog } from '../../modules/blog/entities/blog.entity';
import { User } from '../../modules/users/entities/user.entity';

/**
 * Blog Posts Seeding
 * Creates sample blog articles
 */
export async function seedBlog(dataSource: DataSource, admin?: User) {
  console.log('📝 Seeding blog posts...');

  const blogRepository = dataSource.getRepository(Blog);

  const blogData = [
    {
      title: '10 Mẹo Tìm Phòng Trọ Phù Hợp Cho Sinh Viên',
      slug: '10-meo-tim-phong-tro-phu-hop-cho-sinh-vien',
      excerpt:
        'Những bí quyết giúp sinh viên tìm được phòng trọ ưng ý với ngân sách hạn chế',
      content: `
        <h2>Giới thiệu</h2>
        <p>Tìm phòng trọ phù hợp là một trong những thách thức lớn nhất đối với sinh viên khi bắt đầu cuộc sống tự lập. Bài viết này sẽ chia sẻ 10 mẹo hữu ích giúp bạn tìm được phòng trọ ưng ý.</p>
        
        <h2>1. Xác định ngân sách</h2>
        <p>Trước tiên, hãy xác định rõ ngân sách của bạn. Thông thường, chi phí thuê phòng nên chiếm khoảng 30-40% thu nhập hoặc trợ cấp hàng tháng.</p>
        
        <h2>2. Chọn vị trí phù hợp</h2>
        <p>Ưu tiên các khu vực gần trường học, giao thông thuận tiện. Điều này sẽ giúp bạn tiết kiệm thời gian và chi phí đi lại.</p>
        
        <h2>3. Kiểm tra tiện ích</h2>
        <p>Đảm bảo phòng có đầy đủ các tiện ích cơ bản như wifi, nước nóng, điều hòa (nếu cần).</p>
        
        <h2>4. Đọc kỹ hợp đồng</h2>
        <p>Luôn đọc kỹ hợp đồng trước khi ký, đặc biệt chú ý đến các điều khoản về tiền cọc, thời hạn thuê, và quy định về việc chấm dứt hợp đồng.</p>
        
        <h2>5. Tham khảo ý kiến người đi trước</h2>
        <p>Hỏi thăm các anh chị khóa trên hoặc bạn bè đã từng thuê phòng trong khu vực để có thông tin chính xác.</p>
        
        <h2>Kết luận</h2>
        <p>Với những mẹo trên, hy vọng bạn sẽ tìm được phòng trọ phù hợp với nhu cầu và ngân sách của mình.</p>
      `,
      status: 1,
      isPinned: true,
      tags: ['sinh viên', 'phòng trọ', 'mẹo vặt'],
      focusKeyword: 'tìm phòng trọ sinh viên',
      authorId: admin?.id,
    },
    {
      title: 'Hướng Dẫn Ký Hợp Đồng Thuê Nhà An Toàn',
      slug: 'huong-dan-ky-hop-dong-thue-nha-an-toan',
      excerpt:
        'Những lưu ý quan trọng khi ký hợp đồng thuê nhà để tránh rủi ro',
      content: `
        <h2>Giới thiệu</h2>
        <p>Ký hợp đồng thuê nhà là bước quan trọng trong quá trình thuê nhà. Bài viết này sẽ hướng dẫn bạn cách ký hợp đồng an toàn và đúng pháp luật.</p>
        
        <h2>1. Kiểm tra thông tin chủ nhà</h2>
        <p>Đảm bảo bạn đang giao dịch với chủ nhà thật hoặc người được ủy quyền hợp pháp. Yêu cầu xem giấy tờ chứng minh quyền sở hữu.</p>
        
        <h2>2. Đọc kỹ các điều khoản</h2>
        <p>Đọc kỹ từng điều khoản trong hợp đồng, đặc biệt chú ý đến:</p>
        <ul>
          <li>Giá thuê và phương thức thanh toán</li>
          <li>Thời hạn thuê và điều kiện gia hạn</li>
          <li>Tiền cọc và điều kiện hoàn trả</li>
          <li>Quy định về sửa chữa, bảo trì</li>
        </ul>
        
        <h2>3. Ghi nhận tình trạng ban đầu</h2>
        <p>Chụp ảnh và ghi chép lại tình trạng căn phòng khi nhận để tránh tranh chấp sau này.</p>
        
        <h2>Kết luận</h2>
        <p>Một hợp đồng rõ ràng và đầy đủ sẽ bảo vệ quyền lợi của cả hai bên.</p>
      `,
      status: 1,
      isPinned: false,
      tags: ['hợp đồng', 'pháp lý', 'thuê nhà'],
      focusKeyword: 'hợp đồng thuê nhà',
      authorId: admin?.id,
    },
    {
      title: 'Xu Hướng Bất Động Sản Cho Thuê Năm 2024',
      slug: 'xu-huong-bat-dong-san-cho-thue-nam-2024',
      excerpt:
        'Phân tích các xu hướng mới trong thị trường bất động sản cho thuê',
      content: `
        <h2>Giới thiệu</h2>
        <p>Thị trường bất động sản cho thuê đang có nhiều thay đổi trong năm 2024. Bài viết này phân tích các xu hướng chính.</p>
        
        <h2>1. Tăng trưởng nhu cầu thuê nhà</h2>
        <p>Nhu cầu thuê nhà tiếp tục tăng cao, đặc biệt ở các thành phố lớn như Hà Nội và TP.HCM.</p>
        
        <h2>2. Xu hướng sống xanh</h2>
        <p>Người thuê nhà ngày càng quan tâm đến các căn hộ thân thiện với môi trường, có không gian xanh.</p>
        
        <h2>3. Công nghệ trong quản lý</h2>
        <p>Nhiều chủ nhà đang áp dụng công nghệ để quản lý tài sản hiệu quả hơn.</p>
        
        <h2>Kết luận</h2>
        <p>Thị trường bất động sản cho thuê đang phát triển mạnh với nhiều cơ hội mới.</p>
      `,
      status: 1,
      isPinned: false,
      tags: ['bất động sản', 'xu hướng', '2024'],
      focusKeyword: 'bất động sản cho thuê 2024',
      authorId: admin?.id,
    },
    {
      title: 'Cách Tiết Kiệm Chi Phí Khi Thuê Nhà',
      slug: 'cach-tiet-kiem-chi-phi-khi-thue-nha',
      excerpt: 'Bí quyết giúp bạn tiết kiệm chi phí khi thuê nhà trọ',
      content: `
        <h2>Giới thiệu</h2>
        <p>Thuê nhà là một khoản chi phí lớn. Bài viết này sẽ chia sẻ các cách để tiết kiệm chi phí khi thuê nhà.</p>
        
        <h2>1. Chia sẻ phòng với bạn bè</h2>
        <p>Thuê chung phòng với bạn bè là cách hiệu quả để giảm chi phí. Bạn có thể tiết kiệm 30-50% chi phí.</p>
        
        <h2>2. Tìm phòng ở khu vực ngoại thành</h2>
        <p>Phòng ở khu vực ngoại thành thường rẻ hơn, nhưng vẫn đảm bảo tiện nghi và giao thông thuận tiện.</p>
        
        <h2>3. Đàm phán giá thuê</h2>
        <p>Đừng ngại đàm phán giá thuê với chủ nhà, đặc biệt nếu bạn thuê dài hạn.</p>
        
        <h2>4. Tiết kiệm điện nước</h2>
        <p>Sử dụng điện nước hợp lý để giảm chi phí hàng tháng.</p>
        
        <h2>Kết luận</h2>
        <p>Với những cách trên, bạn có thể tiết kiệm đáng kể chi phí thuê nhà.</p>
      `,
      status: 1,
      isPinned: false,
      tags: ['tiết kiệm', 'chi phí', 'thuê nhà'],
      focusKeyword: 'tiết kiệm chi phí thuê nhà',
      authorId: admin?.id,
    },
    {
      title: 'Quyền Lợi Của Người Thuê Nhà Theo Pháp Luật',
      slug: 'quyen-loi-cua-nguoi-thue-nha-theo-phap-luat',
      excerpt: 'Tìm hiểu về quyền lợi của người thuê nhà được pháp luật bảo vệ',
      content: `
        <h2>Giới thiệu</h2>
        <p>Người thuê nhà có nhiều quyền lợi được pháp luật bảo vệ. Bài viết này sẽ giúp bạn hiểu rõ hơn về các quyền này.</p>
        
        <h2>1. Quyền được sử dụng nhà thuê</h2>
        <p>Người thuê có quyền sử dụng nhà thuê theo đúng mục đích đã thỏa thuận trong hợp đồng.</p>
        
        <h2>2. Quyền yêu cầu sửa chữa</h2>
        <p>Chủ nhà có trách nhiệm sửa chữa các hư hỏng không do lỗi của người thuê.</p>
        
        <h2>3. Quyền được bồi thường</h2>
        <p>Nếu chủ nhà vi phạm hợp đồng, người thuê có quyền yêu cầu bồi thường.</p>
        
        <h2>Kết luận</h2>
        <p>Hiểu rõ quyền lợi của mình sẽ giúp bạn tự tin hơn khi thuê nhà.</p>
      `,
      status: 1,
      isPinned: false,
      tags: ['pháp luật', 'quyền lợi', 'người thuê'],
      focusKeyword: 'quyền lợi người thuê nhà',
      authorId: admin?.id,
    },
  ];

  let createdCount = 0;
  for (const data of blogData) {
    const existing = await blogRepository.findOne({
      where: { slug: data.slug },
    });

    if (!existing) {
      const blog = blogRepository.create(data);
      await blogRepository.save(blog);
      createdCount++;
      console.log(`✅ Created blog post: ${data.title}`);
    }
  }

  if (createdCount === 0) {
    console.log('⚠️  Blog posts already exist, skipping...');
  } else {
    console.log(`✅ Created ${createdCount} blog posts`);
  }
}
