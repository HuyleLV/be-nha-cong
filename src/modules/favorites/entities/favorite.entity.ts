import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Unique,
    Index,
    Column,
  } from 'typeorm';
  
  @Entity('favorites')
  @Unique(['userId', 'apartmentId'])
  @Index(['userId'])
  @Index(['apartmentId'])
  export class Favorite {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    userId: number;
  
    @Column()
    apartmentId: number;
  
    @CreateDateColumn()
    createdAt: Date;
  }
  