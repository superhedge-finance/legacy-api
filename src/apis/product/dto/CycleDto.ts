import { Property } from "@tsed/schema";

export class CycleDto {
  @Property()
  coupon: number;

  @Property()
  strikePrice1: number;

  @Property()
  strikePrice2: number;

  @Property()
  strikePrice3: number;

  @Property()
  strikePrice4: number;

  @Property()
  url: string;
}
