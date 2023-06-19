import { Property } from "@tsed/schema";

export class SummaryDto {
  @Property()
  dates: Date;

  @Property()
  totalBalance: number;
}
