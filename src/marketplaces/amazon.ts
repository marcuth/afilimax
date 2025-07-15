import AmazonCaptchaPlugin from "@mihnea.dev/puppeteer-extra-amazon-captcha"
import { PuppeteerExtra, VanillaPuppeteer, } from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import { executablePath } from "puppeteer"

import { requireVanillaPuppeteer } from "../utils/require-vanilla-puppeteer"
import { removeQueryParams } from "../utils/remove-query-params"

export type AmazonServiceOptions = {
    cookies: any[]
    puppeteer?: Parameters<VanillaPuppeteer["launch"]>[0]
}

export class AmazonService {
    private readonly puppeteer: PuppeteerExtra

    constructor(private readonly options: AmazonServiceOptions) {
        this.puppeteer = new PuppeteerExtra(...requireVanillaPuppeteer())
        this.puppeteer.use(AmazonCaptchaPlugin())
        this.puppeteer.use(StealthPlugin())
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

            await page.waitForSelector("#amzn-ss-get-link-button", { timeout: 12000 })
            page.click("#amzn-ss-get-link-button")

            try {
                await page.waitForResponse(
                    (response) => response.url().includes("amazon.com.br/associates/sitestripe/getShortUrl"),
                    { timeout: 6000 }
                )
            } catch(error) {}

            await page.waitForSelector("#amzn-ss-text-shortlink-textarea", { timeout: 12000, visible: true })
            const affiliateUrl = await page.evaluate(() => document.querySelector("#amzn-ss-text-shortlink-textarea")?.textContent)

            await browser.close()

            if (!affiliateUrl) {
                throw new Error("Failed to create Amazon affiliate URL")
            }

            return affiliateUrl
        } catch(error) {
            await browser.close()
            throw error
        }
    }

    createAffiliateUrlWithTag(url: string, tag: string) {
        const cleanUrl = removeQueryParams(url) 
        return `${cleanUrl}?tag=${tag}`
    }
}