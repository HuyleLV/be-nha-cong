import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../../modules/users/entities/user.entity';

/**
 * Users Seeding
 * Creates admin, host, and customer users
 */
export async function seedUsers(dataSource: DataSource) {
  console.log('👤 Seeding users...');

  const userRepository = dataSource.getRepository(User);
  const users: { admin?: User; host?: User; customer?: User } = {};

  // Admin user
  let existingAdmin = await userRepository.findOne({
    where: { email: 'admin@nhacong.com' },
  });

  if (!existingAdmin) {
    const adminPassword = await bcrypt.hash('admin123', 10);
    existingAdmin = userRepository.create({
      name: 'Administrator',
      email: 'admin@nhacong.com',
      passwordHash: adminPassword,
      phone: '+84901234567',
      role: UserRole.ADMIN,
      emailVerified: true,
      phoneVerified: true,
      referralCode: 'ADMIN001',
      provider: 'local',
    });
    await userRepository.save(existingAdmin);
    console.log('✅ Admin user created: admin@nhacong.com / admin123');
  } else {
    console.log('⚠️  Admin user already exists, skipping...');
  }
  users.admin = existingAdmin;

  // Host user
  let existingHost = await userRepository.findOne({
    where: { email: 'host@nhacong.com' },
  });

  if (!existingHost) {
    const hostPassword = await bcrypt.hash('host123', 10);
    existingHost = userRepository.create({
      name: 'Chủ Nhà Mẫu',
      email: 'host@nhacong.com',
      passwordHash: hostPassword,
      phone: '+84901234568',
      role: UserRole.OWNER,
      emailVerified: true,
      phoneVerified: true,
      referralCode: 'HOST001',
      provider: 'local',
    });
    await userRepository.save(existingHost);
    console.log('✅ Host user created: host@nhacong.com / host123');
  } else {
    console.log('⚠️  Host user already exists, skipping...');
  }
  users.host = existingHost;

  // Customer user
  let existingCustomer = await userRepository.findOne({
    where: { email: 'user@nhacong.com' },
  });

  if (!existingCustomer) {
    const customerPassword = await bcrypt.hash('user123', 10);
    existingCustomer = userRepository.create({
      name: 'Người Dùng Mẫu',
      email: 'user@nhacong.com',
      passwordHash: customerPassword,
      phone: '+84901234569',
      role: UserRole.CUSTOMER,
      emailVerified: true,
      phoneVerified: true,
      referralCode: 'USER001',
      provider: 'local',
    });
    await userRepository.save(existingCustomer);
    console.log('✅ Customer user created: user@nhacong.com / user123');
  } else {
    console.log('⚠️  Customer user already exists, skipping...');
  }
  users.customer = existingCustomer;

  // Additional sample users
  const additionalUsers = [
    {
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@example.com',
      phone: '+84901234570',
      role: UserRole.CUSTOMER,
      referralCode: 'USER002',
    },
    {
      name: 'Trần Thị B',
      email: 'tranthib@example.com',
      phone: '+84901234571',
      role: UserRole.CUSTOMER,
      referralCode: 'USER003',
    },
    {
      name: 'Lê Văn C',
      email: 'levanc@example.com',
      phone: '+84901234572',
      role: UserRole.OWNER,
      referralCode: 'HOST002',
    },
  ];

  for (const userData of additionalUsers) {
    const existing = await userRepository.findOne({
      where: { email: userData.email },
    });

    if (!existing) {
      const password = await bcrypt.hash('password123', 10);
      const user = userRepository.create({
        ...userData,
        passwordHash: password,
        emailVerified: true,
        phoneVerified: true,
        provider: 'local',
      });
      await userRepository.save(user);
      console.log(`✅ Created user: ${userData.email}`);
    }
  }

  return users;
}
