import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Product } from "./Product";
import { Property } from "@tsed/schema";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Property()
  address: string;

  @Column({ nullable: true })
  @Property()
  userName: string;

  @Column({ nullable: true })
  @Property()
  email: string;

  @Column({ default: false })
  @Property()
  subscribed: boolean;

  @Column({ type: "json", default: [] })
  @Property()
  productIds: number[];

  @OneToMany(() => Product, (product) => product.user)
  products: Product[];

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  public created_at: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
  public updated_at: Date;
}
