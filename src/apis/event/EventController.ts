import { Controller, Inject } from "@tsed/di";
import { ContractService } from "../../services/ContractService";
import { ProductService } from "../product/services/ProductService";
import { HistoryRepository, MarketplaceRepository, UserRepository, Product } from "../../dal";
import { HISTORY_TYPE, WITHDRAW_TYPE } from "../../shared/enum";
import { DECIMAL, SUPPORT_CHAINS } from "../../shared/constants";
import { ethers, constants } from "ethers";

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
    // listen to get transaction from on chain event
    console.log(SUPPORT_CHAINS);
    for (const chainId of SUPPORT_CHAINS) {
      // console.log(chainId)
      this.contractService.subscribeToEvents(chainId, "ProductCreated", () => {
        this.contractService.getLatestBlockNumber(chainId).then((blockNumber) => {
          this.contractService.getPastEvents(chainId, "ProductCreated", blockNumber - 10, blockNumber).then((pastEvents) => {
            this.productService.syncProducts(chainId, pastEvents).then((r) => console.log(r));
            console.log("running")
          });
        });
      });

      this.contractService.subscribeToEvents(chainId, "ProductUpdated", (event) => {
        this.productService.updateProductName(chainId, event[0], event[1]).then(() => {
          console.log("Product name was updated")
        });
      });
      // Listen NFT transfer event
      this.contractService.subscribeToTransferEvent(chainId, "TransferSingle", (event) => {
        if(event.args.from != constants.AddressZero && event.args.to != constants.AddressZero) {
          const value = event.args.value;
          const amountInDecimal = parseInt(value) * 1000;
          const amount = ethers.utils.parseUnits(amountInDecimal.toString(), DECIMAL[chainId]);
          this.historyRepository
            .createHistory(
              chainId,
              event.args.to,
              amount,
              event.transactionHash,
              event.logIndex,
              HISTORY_TYPE.TRANSFER,
              WITHDRAW_TYPE.NONE,
              0,
              event.args.id,
              event.args.value,
              event.args.from
            )
            .then(() => console.log("Transfer History saved"));
        }
      });

      this.productService.getProductsWithoutStatus(chainId).then((products) => {
        products.forEach((product) => {
          this.contractService.subscribeToProductEvents(
            chainId,
            product.address,
            [
              "Deposit",
              "WithdrawPrincipal",
              "WithdrawCoupon",
              "WithdrawOption",
              "FundAccept",
              "FundLock",
              "Issuance",
              // "WeeklyCoupon",
              "OptionPayout",
              "Mature",
              "Unpaused",
              "Paused",
            ],
            (eventName, event) => {
              if (eventName === "Paused" || eventName === "Unpaused") {
                this.productService.updateProductPauseStatus(
                  chainId, product.address, eventName === "Paused"
                ).then((r) => console.log(r));
              } else {
                this.contractService.getProductStats(chainId, product.address).then((stats) => {
                  this.productService.updateProduct(chainId, product.address, stats).then((r) => console.log(r));
                });
              }
              // if (["Deposit", "WithdrawPrincipal", "WithdrawCoupon", "WithdrawOption", "WeeklyCoupon", "OptionPayout"].includes(eventName)) {
              if (["Deposit", "WithdrawPrincipal", "WithdrawCoupon", "WithdrawOption", "OptionPayout"].includes(eventName)) {
                let withdrawType: WITHDRAW_TYPE = WITHDRAW_TYPE.NONE;
                let type: HISTORY_TYPE;

                if (eventName === "WithdrawPrincipal") {
                  withdrawType = WITHDRAW_TYPE.PRINCIPAL;
                  type = HISTORY_TYPE.WITHDRAW;
                } else if (eventName === "WithdrawCoupon") {
                  withdrawType = WITHDRAW_TYPE.COUPON;
                  type = HISTORY_TYPE.WITHDRAW;
                } else if (eventName === "WithdrawOption") {
                  withdrawType = WITHDRAW_TYPE.OPTION;
                  type = HISTORY_TYPE.WITHDRAW;
                } else if (eventName === "Deposit") {
                  type = HISTORY_TYPE.DEPOSIT;
                } else {
                  type = HISTORY_TYPE.OPTION_PAYOUT;
                }

                // else if (eventName === "WeeklyCoupon") {
                //   type = HISTORY_TYPE.WEEKLY_COUPON;
                // } 

                const address = event.args._user;
                
                this.historyRepository
                  .createHistory(
                    chainId,
                    address,
                    event.args._amount,
                    event.transactionHash,
                    event.logIndex,
                    type,
                    withdrawType,
                    product.id,
                    event.args._tokenId,
                    event.args._supply,
                  )
                  .then(() => console.log("History saved"));

                this.userRepository.saveProductId(address, product.id).then(() => console.log("Product ID saved to user entity"));

                this.contractService.getProductPrincipalBalance(chainId, address, product.address).then((_principal) => {
                  if (_principal) {
                    this.userRepository.removeProductId(address, product.id).then(() => console.log("Product ID removed from user entity"));
                  }
                });
              }

              if (eventName === "Mature") {
                this.marketplaceRepository
                  .find({
                    where: {
                      chainId: chainId,
                      product_address: product.address,
                    },
                  })
                  .then((marketplaceEntities) => {
                    for (const marketplaceEntity of marketplaceEntities) {
                      marketplaceEntity.isExpired = true;
                      this.marketplaceRepository.save(marketplaceEntity).then(
                        () => console.log("Marketplace entity updated")
                      );
                    }
                  });
              }
            },
          );
        });
      });

      this.contractService.subscribeToMarketplaceEvents(
        chainId,
        ["ItemListed", "ItemSold", "ItemCanceled", "ItemUpdated"],
        async (eventName, event) => {
          if (eventName === "ItemListed") {
            this.marketplaceRepository
              .syncItemListedEntity(
                chainId,
                event.args.owner,
                event.args.nft,
                event.args.product,
                event.args.tokenId,
                event.args.quantity,
                event.args.payToken,
                event.args.pricePerItem,
                event.args.startingTime,
                event.args.listingId,
                event.transactionHash,
              )
              .then((r) => console.log(r));
          } else if (eventName === "ItemSold") {
            const listingId = event.args.listingId;
            const buyer = event.args.buyer;
            const seller = event.args.seller;
            const marketplace = await this.marketplaceRepository
              .createQueryBuilder("marketplace")
              .where("marketplace.listing_id = :listingId", { listingId: listingId.toString() })
              .leftJoinAndMapOne("marketplace.product", Product, "product", "marketplace.product_address = product.address")
              .getOne();
            if (!marketplace) return null;

            this.marketplaceRepository
              .syncItemSoldEntity(
                chainId,
                event.args.seller,
                event.args.buyer,
                event.args.unitPrice,
                event.args.listingId,
                event.transactionHash,
              )
              .then(() => {
                this.userRepository
                  .saveProductId(buyer, marketplace.product.id)
                  .then(() => console.log("Item sold & Product saved to buyer's position"));

                this.contractService.getProductPrincipalBalance(chainId, seller, marketplace.product_address).then((_principal) => {
                  if (_principal) {
                    this.userRepository
                      .removeProductId(seller, marketplace.product.id)
                      .then(() => console.log("Product ID removed from seller entity"));
                  }
                });
              });
          } else if (eventName === "ItemCanceled") {
            this.marketplaceRepository
              .syncItemCanceledEntity(chainId, event.args.owner, event.args.listingId, event.transactionHash)
              .then((r) => console.log(r));
          } else if (eventName === "ItemUpdated") {
            this.marketplaceRepository
              .syncItemUpdatedEntity(
                chainId,
                event.args.owner,
                event.args.payToken,
                event.args.newPrice,
                event.args.listingId,
                event.transactionHash,
              )
              .then((r) => console.log(r));
          }
        },
      );
    }
  }
}
