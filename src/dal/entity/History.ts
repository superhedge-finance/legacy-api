import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne } from "typeorm";
import { Property } from "@tsed/schema";
import { Product } from "./Product";
import { HISTORY_TYPE, WITHDRAW_TYPE } from "../../services/dto/enum";

@Entity("histories")
export class History {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Property()
  address: string;

  @Column({
    type: "enum",
    enum: HISTORY_TYPE,
    default: HISTORY_TYPE.DEPOSIT,
  })
  @Property()
  type: HISTORY_TYPE;

  @Column({
    type: "enum",
    enum: WITHDRAW_TYPE,
    default: WITHDRAW_TYPE.NONE,
  })
  @Property()
  withdrawType: WITHDRAW_TYPE;

  @Column()
  @Property()
  productId: number;

  @Column()
  @Property()
  amount: string;

  @Column()
  @Property()
  amountInDecimal: number;

  @Column({ unique: true })
  @Property()
  transactionHash: string;

  @Column({ nullable: true })
  @Property()
  tokenId: string;

  @Column({ nullable: true })
  @Property()
  supply: string;

  @Column({ nullable: true })
  @Property()
  supplyInDecimal: number;

  @OneToOne(() => Product, (product) => product.history)
  product: Product;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  public created_at: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
  public updated_at: Date;
}
