import { Property } from "@tsed/schema";
import { CycleDto } from "./CycleDto";

export class StatsDto {
  @Property()
  status: number;

  @Property()
  currentCapacity: string;

  @Property()
  paused: boolean;

  @Property()
  cycle: CycleDto;
}
