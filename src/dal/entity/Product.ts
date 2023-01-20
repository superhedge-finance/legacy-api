import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import {CycleDto} from "../../apis/product/dto/CycleDto";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
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

  @Column("json")
  issuanceCycle: CycleDto;
}
