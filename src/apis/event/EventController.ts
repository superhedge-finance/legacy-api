import { Controller, Inject } from "@tsed/di";
import { ContractService } from "../../services/ContractService";
import { ProductService } from "../product/services/ProductService";
import { HistoryRepository, MarketplaceRepository, UserRepository } from "../../dal";
import { HISTORY_TYPE, WITHDRAW_TYPE } from "../../services/dto/enum";

@Controller("/events")
export class EventsController {
  @Inject()
  private readonly contractService: ContractService;

  @Inject()
  private readonly productService: ProductService;

  @Inject(HistoryRepository)
  private readonly historyRepository: HistoryRepository;

  @Inject(UserRepository)
  private readonly userRepository: UserRepository;

  @Inject(MarketplaceRepository)
  private readonly marketplaceRepository: MarketplaceRepository;

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
              console.log("event", event);
              let withdrawType: WITHDRAW_TYPE = WITHDRAW_TYPE.NONE;
              let address = "";
              if (eventName === "WithdrawPrincipal") {
                withdrawType = WITHDRAW_TYPE.PRINCIPAL;
                address = event.args._to;
              } else if (eventName === "WithdrawCoupon") {
                withdrawType = WITHDRAW_TYPE.COUPON;
                address = event.args._to;
              } else if (eventName === "WithdrawOption") {
                withdrawType = WITHDRAW_TYPE.OPTION;
                address = event.args._to;
              } else {
                address = event.args._from;
              }
              this.historyRepository
                .createHistory(
                  address,
                  event.args._amount,
                  event.transactionHash,
                  product.id,
                  eventName === "Deposit" ? HISTORY_TYPE.DEPOSIT : HISTORY_TYPE.WITHDRAW,
                  withdrawType,
                  event.args._currentTokenId,
                  event.args._supply,
                )
                .then(() => console.log("History saved"));

              this.userRepository.saveProductId(address, product.id).then(() => console.log("Product ID saved to user entity"));
            }
          },
        );
      });
    });

    this.contractService.subscribeToMarketplaceEvents(["ItemListed", "ItemSold", "ItemCanceled", "ItemUpdated"], (eventName, event) => {
      if (eventName === "ItemListed") {
        this.marketplaceRepository
          .syncItemListedEntity(
            event.args.owner,
            event.args.nft,
            event.args.tokenId,
            event.args.quantity,
            event.args.payToken,
            event.args.pricePerItem,
            event.args.startingTime,
            event.transactionHash,
          )
          .then((r) => console.log(r));
      }
    });
  }
}
