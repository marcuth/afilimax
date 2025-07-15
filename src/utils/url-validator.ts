import { config } from "../config"

export function isAmazonProductUrl(url: string): boolean {
    const domainPattern = config.domains.amazon.join("|")

    const amazonProductRegex = new RegExp(
        `https?://(?:www\\.)?(?:${domainPattern})/(?:.+/)?(?:gp/product|dp|exec/obidos/tg/detail|gp/aw/d|gp/offer-listing|d)/[\\w\\d]+|https://amzn\\.to/[\\w\\d]+`,
        "i",
    )

    return amazonProductRegex.test(url)
}

export function isMercadoLivreUrl(url: string): boolean {
    const domainPattern = config.domains.mercadoLivre.join("|")

    const mercadoLivreProductRegex = new RegExp(
        `^https?://(?:www\\.|lista\\.|produto\\.)?(?:${domainPattern})/(?:[^/]+/)?(ML[AB]-?\\d{7,}|p/[\\w\\d]+|sec/[\\w\\d]+)`,
        "i"
    )

    return mercadoLivreProductRegex.test(url)
}

export const isAliExpressUrl = (url: string): boolean => url.includes("aliexpress.com")

export function isShopeeUrl(url: string): boolean {
    const domainPattern = config.domains.shopee.join("|")

    const shopeeRegex = new RegExp(
        `^https?://(?:www\\.)?(?:${domainPattern})/(?:.+-)?i\\.\\d+\\.\\d+|^https://shp\\.ee/[\\w\\d]+`,
        "i"
    )

    return shopeeRegex.test(url)
}

export function isMagazineLuizaUrl(url: string): boolean {
    const domainPattern = config.domains.magalu.join("|")

    const magaluRegex = new RegExp(
        `^https?://(?:www\\.)?(?:${domainPattern})/(?:.+)?`,
        "i"
    )

    return magaluRegex.test(url)
}

export const isValidUrl = (url: string): boolean => {
    return isAmazonProductUrl(url) || isMercadoLivreUrl(url) || isAliExpressUrl(url) || isShopeeUrl(url) || isMagazineLuizaUrl(url)
}