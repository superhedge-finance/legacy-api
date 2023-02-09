import { Controller, Inject } from "@tsed/di";
import { ContractService } from "../../services/ContractService";
import { ProductService } from "../product/services/ProductService";
import { HistoryRepository } from "../../dal/repository/HistoryRepository";
import { HISTORY_TYPE, WITHDRAW_TYPE } from "../../services/dto/enum";

@Controller("/events")
export class EventsController {
  @Inject()
  private readonly contractService: ContractService;

  @Inject()
  private readonly productService: ProductService;

  @Inject(HistoryRepository)
  private readonly historyRepository: HistoryRepository;

  $onInit() {
    this.contractService.subscribeToEvents("ProductCreated", () => {
      this.contractService.getLatestBlockNumber().then((blockNumber) => {
        this.contractService.getPastEvents("ProductCreated", blockNumber - 10, blockNumber).then((pastEvents) => {
          this.productService.syncProducts(pastEvents).then((r) => console.log(r));
        });
      });
    });

    this.productService.getProductsWithoutStatus().then((products) => {
      products.forEach((product) => {
        this.contractService.subscribeToProductEvents(
          product.address,
          [
            "Deposit",
            "WithdrawPrincipal",
            "WithdrawCoupon",
            "WithdrawOption",
            "FundAccept",
            "FundLock",
            "Issuance",
            "Mature",
            "Unpaused",
            "Paused",
          ],
          (eventName, event) => {
            if (eventName === "Paused" || eventName === "Unpaused") {
              this.productService.updateProductPauseStatus(product.address, eventName === "Paused").then((r) => console.log(r));
            } else {
              this.contractService.getProductStats(product.address).then((stats) => {
                this.productService.updateProduct(product.address, stats).then((r) => console.log(r));
              });
            }

            if (["Deposit", "WithdrawPrincipal", "WithdrawCoupon", "WithdrawOption"].includes(eventName)) {
              console.log('event', event);
              let withdrawType: WITHDRAW_TYPE = WITHDRAW_TYPE.NONE;
              if (eventName === "WithdrawPrincipal") {
                withdrawType = WITHDRAW_TYPE.PRINCIPAL;
              } else if (eventName === "WithdrawCoupon") {
                withdrawType = WITHDRAW_TYPE.COUPON;
              } else if (eventName === "WithdrawOption") {
                withdrawType = WITHDRAW_TYPE.OPTION;
              }
              this.historyRepository
                .createHistory(event, product.id, eventName === "Deposit" ? HISTORY_TYPE.DEPOSIT : HISTORY_TYPE.WITHDRAW, withdrawType)
                .then(() => console.log("History saved"));
            }
          },
        );
      });
    });
  }
}
