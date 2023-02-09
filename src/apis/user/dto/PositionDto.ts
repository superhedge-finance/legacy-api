import { Property } from "@tsed/schema";
import { Product } from "../../../dal";

export class PositionDto {
  @Property()
  product: Product;
}
