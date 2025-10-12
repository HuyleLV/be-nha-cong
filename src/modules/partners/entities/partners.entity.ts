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
    note?: string;
  
    /** Chỉ cho landlord */
    @Column({ type: 'int', nullable: true })
    propertyCount?: number;
  
    /** Chỉ cho customer */
    @Column({ type: 'int', nullable: true })
    budget?: number;
  
    /** Chỉ cho operator */
    @Column({ length: 200, nullable: true })
    companyName?: string;
  
    @CreateDateColumn()
    createdAt: Date;
  }
  