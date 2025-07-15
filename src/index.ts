import { isAliExpressUrl, isAmazonProductUrl, isMercadoLivreUrl, isShopeeUrl } from "./utils/url-validator"
import { MercadoLivreService, MercadoLivreServiceOptions } from "./marketplaces/mercado-livre"
import { AliExpressService, AliExpressServiceOptions } from "./marketplaces/aliexpress"
import { AmazonService, AmazonServiceOptions } from "./marketplaces/amazon"
import { ShopeeService, ShopeeServiceOptions } from "./marketplaces/shopee"

export type AfilimaxOptions = {
    mercadoLivre?: MercadoLivreServiceOptions
    amazon?: AmazonServiceOptions
    shopee?: ShopeeServiceOptions
    aliExpress?: AliExpressServiceOptions
}

export enum AfilimaxService {
    Amazon = "amazon",
    MercadoLivre = "mercado_livre",
    Shopee = "shopee",
    AliExpress = "aliexpress"
}

export class Afilimax {
    private readonly amazon?: AmazonService
    private readonly mercadoLivre?: MercadoLivreService
    private readonly shopee?: ShopeeService
    private readonly aliExpress?: AliExpressService

    constructor(private readonly options: AfilimaxOptions) {
        this.amazon = options.amazon && new AmazonService(options.amazon)
        this.mercadoLivre = options.mercadoLivre && new MercadoLivreService(options.mercadoLivre)
        this.shopee = options.shopee && new ShopeeService(options.shopee)
        this.aliExpress = options.aliExpress && new AliExpressService(options.aliExpress)
    }

    private detectService(url: string): AfilimaxService | null {
        if (isAmazonProductUrl(url)) return AfilimaxService.Amazon
        if (isMercadoLivreUrl(url)) return AfilimaxService.MercadoLivre
        if (isShopeeUrl(url)) return AfilimaxService.Shopee
        if (isAliExpressUrl(url)) return AfilimaxService.AliExpress
        return null
    }

    async createAffiliateUrl(url: string) {
        const service = this.detectService(url)

        switch (service) {
            case AfilimaxService.Amazon:
                if (!this.amazon) {
                    throw new Error("Amazon service is not configured")
                }

                return await this.amazon?.createAffiliateUrl(url)
            case AfilimaxService.MercadoLivre:
                if (!this.mercadoLivre) {
                    throw new Error("Mercado Livre service is not configured")
                }

                return this.mercadoLivre?.createAffiliateUrl(url)
            case AfilimaxService.Shopee:
                if (!this.shopee) {
                    throw new Error("Shopee service is not configured")
                }

                return await this.shopee?.createAffiliateUrl(url)
            case AfilimaxService.AliExpress:
                if (!this.aliExpress) {
                    throw new Error("AliExpress service is not configured")
                }

                return await this.aliExpress?.createAffiliateUrl(url)
        }
    }
}