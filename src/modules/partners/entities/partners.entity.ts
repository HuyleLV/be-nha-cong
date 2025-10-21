import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
  } from 'typeorm';
  
  export type PartnerRole = 'landlord' | 'customer' | 'operator';
  
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
  
    @CreateDateColumn()
    createdAt: Date;
  }
  