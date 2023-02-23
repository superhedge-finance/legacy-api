import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne } from "typeorm";
import { Property } from "@tsed/schema";
import { Product } from "./Product";

@Entity("marketplaces")
export class Marketplace {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Property()
  seller: string;

  @Column()
  @Property()
  nft: string;

  @Column()
  @Property()
  product_address: string;

  @Column()
  @Property()
  tokenId: string;

  @Column()
  @Property()
  tokenIdInDecimal: number;

  @Column()
  @Property()
  quantity: string;

  @Column()
  @Property()
  quantityInDecimal: number;

  @Column()
  @Property()
  payToken: string;

  @Column()
  @Property()
  price: string;

  @Column()
  @Property()
  priceInDecimal: number;

  @Column()
  @Property()
  startingTime: number;

  @Column({ unique: true })
  @Property()
  transactionHash: string;

  @Column({ default: false })
  @Property()
  isExpired: boolean;

  @OneToOne(() => Product, (product) => product.address)
  product: Product;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  public created_at: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
  public updated_at: Date;
}
