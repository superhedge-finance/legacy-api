import { Property } from "@tsed/schema";
import { CreatedProductDto } from "./CreatedProductDto";

export type DepositActivity = {
    date: Date;
    amount: number;
    lots: number;
    txhash: string;
};

export class ProductDetailDto extends CreatedProductDto {
    @Property()
    chainId: number;
    
    @Property()
    vaultStrategy: string;

    @Property()
    risk: string;
    
    @Property()
    fees: string;
    
    @Property()
    counterparties: string;

    @Property()
    estimatedApy: string;

    @Property()
    mtmPrice: number;

    @Property()
    deposits: DepositActivity[];
}
