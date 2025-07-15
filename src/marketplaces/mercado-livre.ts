import { requireVanillaPuppeteer } from "../utils/require-vanilla-puppeteer"
import { CookieData, executablePath, LaunchOptions, Page } from "puppeteer"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import { PuppeteerExtra } from "puppeteer-extra"

import { removeQueryParams } from "../utils/remove-query-params"

export type MercadoLivreServiceOptions = {
    cookies: CookieData[]
    puppeteer?: LaunchOptions
}

export class MercadoLivreService {
    private readonly puppeteer: PuppeteerExtra

    constructor(private readonly options: MercadoLivreServiceOptions) {
        this.puppeteer = new PuppeteerExtra(...requireVanillaPuppeteer())
        this.puppeteer.use(StealthPlugin())
    }

    private async redirectToProductPage(page: Page) {
        const productLinkSelector = "a.poly-component__title[href*=\"https://produto.mercadolivre.com.br/\"]"
        await page.waitForSelector(productLinkSelector, { timeout: 12000 })
        await page.click(productLinkSelector)
    }

    private async resolveProductPage(page: Page) {
        const isAffiliateUrl = page.url().includes("mercadolivre.com.br/social")

        if (isAffiliateUrl) {
            await this.redirectToProductPage(page)
        }
    }

    private async tryCloseCashbackInfoModal(page: Page) {
        try {
            await page.waitForSelector("xpath///button[.//span[contains(text(), \"Entendi\")]]", { timeout: 3000 })
            await page.click("xpath///button[.//span[contains(text(), \"Entendi\")]]")
        } catch(_) {}
    }

    private async tryWaitForAffilateApiResonse(page: Page) {
        try {
            await page.waitForResponse(
                (request) => request.url().includes("mercadolivre.com.br/affiliate-program/api/v2/stripe/user/links"),
                { timeout: 10000 }
            )
        } catch(_) {}
    }

    private async clickToInitAffiliateUrlGeneration(page: Page) {
        await page.waitForSelector("#P0-2", { timeout: 12000 })
        page.click("#P0-2")
    }

    private async getAffilateUrl(page: Page) {
        await page.waitForSelector("textarea[data-testid=\"text-field__label_link\"]", { timeout: 12000, visible: true })
        return await page.evaluate(() => (document.querySelector("textarea[data-testid=\"text-field__label_link\"]") as HTMLTextAreaElement).value)
    }

    async createAffiliateUrl(url: string) {
        const browser = await this.puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--no-first-run",
                "--no-zygote",
                "--disable-gpu",
                "--start-maximized",
            ],
            defaultViewport: null,
            executablePath: executablePath(),
            ...this.options.puppeteer,
        })

        try {
            const cleanUrl = removeQueryParams(url)
            const page = await browser.newPage()

            await browser.setCookie(...this.options.cookies)
            await page.goto(cleanUrl, { waitUntil: "domcontentloaded" })
            await this.resolveProductPage(page)
            await this.tryCloseCashbackInfoModal(page)
            await this.clickToInitAffiliateUrlGeneration(page)
            await this.tryWaitForAffilateApiResonse(page)

            const affiliateUrl = await this.getAffilateUrl(page)

            await browser.close()

            return affiliateUrl
        } catch (error) {
            await browser.close()
            throw error
        }
    }
}