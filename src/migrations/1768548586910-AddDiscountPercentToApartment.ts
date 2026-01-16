import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex } from "typeorm";

export class AddDiscountPercentToApartment1768548586910 implements MigrationInterface {
    name = 'AddDiscountPercentToApartment1768548586910'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create rent_schedules table
        await queryRunner.createTable(new Table({
            name: 'rent_schedules',
            columns: [
                { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
                { name: 'contract_id', type: 'int', isNullable: false },
                { name: 'apartment_id', type: 'int', isNullable: false },
                { name: 'customer_id', type: 'int', isNullable: false },
                { name: 'scheduled_date', type: 'date', isNullable: false },
                { name: 'amount', type: 'decimal', precision: 14, scale: 2, isNullable: false },
                {
                    name: 'status',
                    type: 'enum',
                    enum: ['pending', 'paid', 'overdue', 'cancelled'],
                    default: "'pending'",
                    isNullable: false
                },
                { name: 'invoice_id', type: 'int', isNullable: true },
                { name: 'payment_id', type: 'int', isNullable: true },
                { name: 'reminder_sent_at', type: 'datetime', isNullable: true },
                { name: 'late_fee', type: 'decimal', precision: 12, scale: 2, default: '0.00', isNullable: false },
                { name: 'created_at', type: 'datetime', precision: 6, default: 'CURRENT_TIMESTAMP(6)' },
                { name: 'updated_at', type: 'datetime', precision: 6, default: 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' },
            ],
            indices: [
                { columnNames: ['contract_id'] },
                { columnNames: ['apartment_id'] },
                { columnNames: ['customer_id'] },
                { columnNames: ['scheduled_date'] },
                { columnNames: ['invoice_id'] },
                { columnNames: ['payment_id'] },
            ]
        }), true);

        // 2. Create host_settings table
        await queryRunner.createTable(new Table({
            name: 'host_settings',
            columns: [
                { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
                { name: 'user_id', type: 'int', isNullable: false },
                { name: 'profile', type: 'json', isNullable: true },
                { name: 'notifications', type: 'json', isNullable: true },
                { name: 'payment', type: 'json', isNullable: true },
                { name: 'storage', type: 'json', isNullable: true },
                { name: 'preferences', type: 'json', isNullable: true },
                { name: 'created_at', type: 'datetime', precision: 6, default: 'CURRENT_TIMESTAMP(6)' },
                { name: 'updated_at', type: 'datetime', precision: 6, default: 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' },
            ]
        }), true);

        // 3. Create system_settings table
        await queryRunner.createTable(new Table({
            name: 'system_settings',
            columns: [
                { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
                { name: 'site_title', type: 'varchar', length: '255', default: "'Nhà Cộng'" },
                { name: 'site_description', type: 'text', isNullable: true },
                { name: 'site_logo', type: 'varchar', length: '500', isNullable: true },
                { name: 'site_favicon', type: 'varchar', length: '500', isNullable: true },
                { name: 'contact_email', type: 'varchar', length: '255', isNullable: true },
                { name: 'contact_phone', type: 'varchar', length: '50', isNullable: true },
                { name: 'contact_address', type: 'text', isNullable: true },
                { name: 'social_media', type: 'json', isNullable: true },
                { name: 'storage_type', type: 'varchar', length: '20', default: "'local'" },
                { name: 'storage_config', type: 'json', isNullable: true },
                { name: 'email_config', type: 'json', isNullable: true },
                { name: 'default_language', type: 'varchar', length: '50', default: "'vi'" },
                { name: 'timezone', type: 'varchar', length: '50', default: "'Asia/Ho_Chi_Minh'" },
                { name: 'currency', type: 'varchar', length: '10', default: "'VND'" },
                { name: 'date_format', type: 'varchar', length: '20', default: "'DD/MM/YYYY'" },
                { name: 'meta_keywords', type: 'text', isNullable: true },
                { name: 'meta_description', type: 'text', isNullable: true },
                { name: 'google_analytics_id', type: 'varchar', length: '500', isNullable: true },
                { name: 'google_tag_manager_id', type: 'varchar', length: '500', isNullable: true },
                { name: 'features', type: 'json', isNullable: true },
                { name: 'maintenance_mode', type: 'tinyint', default: 0 },
                { name: 'maintenance_message', type: 'text', isNullable: true },
                { name: 'created_at', type: 'datetime', precision: 6, default: 'CURRENT_TIMESTAMP(6)' },
                { name: 'updated_at', type: 'datetime', precision: 6, default: 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' },
            ]
        }), true);

        // 4. Add discount_percent to apartments
        await queryRunner.addColumn('apartments', new TableColumn({
            name: 'discount_percent',
            type: 'int',
            unsigned: true,
            isNullable: true,
        }));

        // 5. Change bank_accounts balance default
        await queryRunner.changeColumn('bank_accounts', 'balance', new TableColumn({
            name: 'balance',
            type: 'decimal',
            precision: 14,
            scale: 2,
            default: '0',
            isNullable: false
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert bank_accounts balance default
        await queryRunner.changeColumn('bank_accounts', 'balance', new TableColumn({
            name: 'balance',
            type: 'decimal',
            precision: 14,
            scale: 2,
            default: '0.00',
            isNullable: false
        }));

        // Remove discount_percent
        await queryRunner.dropColumn('apartments', 'discount_percent');

        // Drop tables
        await queryRunner.dropTable('system_settings');
        await queryRunner.dropTable('host_settings');
        await queryRunner.dropTable('rent_schedules');
    }

}
