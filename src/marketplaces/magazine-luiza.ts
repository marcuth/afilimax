import { CookieData, executablePath, LaunchOptions, Page } from "puppeteer"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import { PuppeteerExtra } from "puppeteer-extra"

import { requireVanillaPuppeteer } from "../utils/require-vanilla-puppeteer"

export type MagazineLuizaServiceOptions = {
    cookies: CookieData[]
    puppeteer?: LaunchOptions
    affiliateSlug: string
}

export class MagazineLuizaService {
    private readonly puppeteer: PuppeteerExtra

    constructor(private readonly options: MagazineLuizaServiceOptions) {
        this.puppeteer = new PuppeteerExtra(...requireVanillaPuppeteer())
        this.puppeteer.use(StealthPlugin())
    }

    private async resolveProductUrl(page: Page, url: string): Promise<string> {
        const isMainDomain = url.includes("magazineluiza.com.br")
        const isAffiliateUrl = url.includes("magazinevoce.com.br")
        const isShortAffiliateUrl = url.includes("magazineluiza.onelink.me")

        if (isMainDomain) {
            return url.replace("magazineluiza.com.br", `magazinevoce.com.br/${this.options.affiliateSlug}`)
        } else if (isAffiliateUrl) {
            return url.replace(/(magazinevoce\.com\.br)\/[^/]+/, `$1/${this.options.affiliateSlug}`)
        } else if (isShortAffiliateUrl) {
            await page.goto(url, { waitUntil: "load" })
            return await this.resolveProductUrl(page, page.url())
        } else {
            throw new Error("Invalid url")
        }
    }

    private async clickOnGenerateLinkButton(page: Page) {
        await page.waitForSelector("xpath///button[label[contains(., \"Gerar link\")]]", { timeout: 12000, visible: true })
        page.click("xpath///button[label[contains(., \"Gerar link\")]]")
    }

    private async tryWaitForAffilateApiResonse(page: Page) {
        try {
            await page.waitForResponse(
                (request) => request.url().includes("magazinevoce.com.br/azion-rochelle-proxy/v1/shortenlink/onelink"),
                { timeout: 10000 }
            )
        } catch (_) {}
    }

    private async getAffilateUrl(page: Page) {
        await page.waitForSelector("input[data-testid=\"copy-to-clipboard-input\"]", { timeout: 12000, visible: true })
        return await page.evaluate(() => (document.querySelector("input[data-testid=\"copy-to-clipboard-input\"]") as HTMLInputElement).value)
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
            const page = await browser.newPage()

            await browser.setCookie(...this.options.cookies)
            const productUrl = await this.resolveProductUrl(page, url)
            await page.goto(productUrl, { waitUntil: "domcontentloaded" })
            await this.clickOnGenerateLinkButton(page)
            await this.tryWaitForAffilateApiResonse(page)
            const affiliateUrl = await this.getAffilateUrl(page)

            await browser.close()

            if (!affiliateUrl) {
                throw new Error("Affiliate url not found")
            }

            return affiliateUrl
        } catch (error) {
            await browser.close()
            throw error
        }
    }
}