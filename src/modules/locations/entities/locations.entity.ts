import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
  } from 'typeorm';
  
export type LocationLevel = 'Province' | 'City' | 'District';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 180, nullable: true })
  @Index()
  name: string;

  @Column({ length: 200, unique: true, nullable: true })
  slug: string;

  @Column({ type: 'enum', enum: ['Province', 'City', 'District']})
  level: LocationLevel;
  
  @ManyToOne(() => Location, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: Location | null;

  @Column({ length: 500, nullable: true })
  coverImageUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
