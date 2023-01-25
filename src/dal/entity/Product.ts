import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
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
}
