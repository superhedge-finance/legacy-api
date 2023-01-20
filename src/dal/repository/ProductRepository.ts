import { Repository } from "typeorm";
import { Product } from "../entity";

export class ProductRepository extends Repository<Product> {}
