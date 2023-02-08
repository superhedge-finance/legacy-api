import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { CycleDto } from "../../apis";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  address: string;

  @Column()
  name: string;

  @Column()
  underlying: string;

  @Column()
  maxCapacity: string;

  @Column()
  currentCapacity: string;

  @Column()
  status: number;

  @Column()
  isPaused: boolean = false;

  @Column("json")
  issuanceCycle: CycleDto;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  public created_at: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
  public updated_at: Date;
}
