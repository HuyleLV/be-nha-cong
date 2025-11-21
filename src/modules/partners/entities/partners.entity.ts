import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
  } from 'typeorm';
  
  export type PartnerRole = 'landlord' | 'customer' | 'operator';
  export type PartnerStatus = 'pending' | 'approved' | 'cancelled';
  
  @Entity('partners')
  export class Partners {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ type: 'enum', enum: ['landlord', 'customer', 'operator'] })
    @Index()
    role: PartnerRole;
  
    @Column({ length: 180 })
    @Index()
    fullName: string;
  
    @Column({ length: 60 })
    phone: string;
  
    @Column({ length: 180 })
    email: string;
  
    @Column({ type: 'text', nullable: true })
    need?: string;
  
    @Column({ type: 'enum', enum: ['pending', 'approved', 'cancelled'], default: 'pending' })
    @Index()
    status: PartnerStatus;

    @CreateDateColumn()
    createdAt: Date;
  }
  