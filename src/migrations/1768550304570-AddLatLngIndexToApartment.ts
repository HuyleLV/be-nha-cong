import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLatLngIndexToApartment1768550304570 implements MigrationInterface {
    name = 'AddLatLngIndexToApartment1768550304570'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`rent_schedules\` (\`id\` int NOT NULL AUTO_INCREMENT, \`contract_id\` int NOT NULL, \`apartment_id\` int NOT NULL, \`customer_id\` int NOT NULL, \`scheduled_date\` date NOT NULL, \`amount\` decimal(14,2) NOT NULL, \`status\` enum ('pending', 'paid', 'overdue', 'cancelled') NOT NULL DEFAULT 'pending', \`invoice_id\` int NULL, \`payment_id\` int NULL, \`reminder_sent_at\` datetime NULL, \`late_fee\` decimal(12,2) NOT NULL DEFAULT '0.00', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_798084282a933608a8b2945b61\` (\`contract_id\`), INDEX \`IDX_fe72b3059f233e539caad3f91c\` (\`apartment_id\`), INDEX \`IDX_ef0db9564e52aaea862201671e\` (\`customer_id\`), INDEX \`IDX_a4f68e7f3fc9d8052f33f34dc9\` (\`scheduled_date\`), INDEX \`IDX_0ddcb45c90480b83f16857946f\` (\`invoice_id\`), INDEX \`IDX_7e99e3831603809bcd81c60842\` (\`payment_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`host_settings\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`profile\` json NULL, \`notifications\` json NULL, \`payment\` json NULL, \`storage\` json NULL, \`preferences\` json NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`system_settings\` (\`id\` int NOT NULL AUTO_INCREMENT, \`site_title\` varchar(255) NOT NULL DEFAULT 'Nhà Cộng', \`site_description\` text NULL, \`site_logo\` varchar(500) NULL, \`site_favicon\` varchar(500) NULL, \`contact_email\` varchar(255) NULL, \`contact_phone\` varchar(50) NULL, \`contact_address\` text NULL, \`social_media\` json NULL, \`storage_type\` varchar(20) NOT NULL DEFAULT 'local', \`storage_config\` json NULL, \`email_config\` json NULL, \`default_language\` varchar(50) NOT NULL DEFAULT 'vi', \`timezone\` varchar(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh', \`currency\` varchar(10) NOT NULL DEFAULT 'VND', \`date_format\` varchar(20) NOT NULL DEFAULT 'DD/MM/YYYY', \`meta_keywords\` text NULL, \`meta_description\` text NULL, \`google_analytics_id\` varchar(500) NULL, \`google_tag_manager_id\` varchar(500) NULL, \`features\` json NULL, \`maintenance_mode\` tinyint NOT NULL DEFAULT 0, \`maintenance_message\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`apartments\` ADD \`discount_percent\` int UNSIGNED NULL`);
        await queryRunner.query(`ALTER TABLE \`bank_accounts\` CHANGE \`balance\` \`balance\` decimal(14,2) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`bank_accounts\` CHANGE \`balance\` \`balance\` decimal(14,2) NOT NULL DEFAULT '0.00'`);
        await queryRunner.query(`ALTER TABLE \`apartments\` DROP COLUMN \`discount_percent\``);
        await queryRunner.query(`DROP TABLE \`system_settings\``);
        await queryRunner.query(`DROP TABLE \`host_settings\``);
        await queryRunner.query(`DROP INDEX \`IDX_7e99e3831603809bcd81c60842\` ON \`rent_schedules\``);
        await queryRunner.query(`DROP INDEX \`IDX_0ddcb45c90480b83f16857946f\` ON \`rent_schedules\``);
        await queryRunner.query(`DROP INDEX \`IDX_a4f68e7f3fc9d8052f33f34dc9\` ON \`rent_schedules\``);
        await queryRunner.query(`DROP INDEX \`IDX_ef0db9564e52aaea862201671e\` ON \`rent_schedules\``);
        await queryRunner.query(`DROP INDEX \`IDX_fe72b3059f233e539caad3f91c\` ON \`rent_schedules\``);
        await queryRunner.query(`DROP INDEX \`IDX_798084282a933608a8b2945b61\` ON \`rent_schedules\``);
        await queryRunner.query(`DROP TABLE \`rent_schedules\``);
    }

}
