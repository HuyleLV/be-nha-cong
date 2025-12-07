import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ThuChiItem } from './thu-chi-item.entity';

@Entity('thu_chi')
export class ThuChi {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'type', type: 'varchar', length: 20 })
  type: string; // 'thu' or 'chi'

  @Column({ name: 'building_id', type: 'int', nullable: true })
  buildingId: number | null;

  @Column({ name: 'apartment_id', type: 'int', nullable: true })
  apartmentId: number | null;

  @Column({ name: 'contract_id', type: 'int', nullable: true })
  contractId: number | null;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'payer_name', type: 'varchar', length: 255, nullable: true })
  payerName: string | null;

  @Column({ name: 'account', type: 'varchar', length: 200, nullable: true })
  account: string | null;

  @Column({ name: 'date', type: 'date' })
  date: Date;

  @Column({ name: 'note', type: 'text', nullable: true })
  note: string | null;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy: number | null;

  @OneToMany(() => ThuChiItem, (it: ThuChiItem) => it.thuChi, { cascade: true })
  items: ThuChiItem[];
}
