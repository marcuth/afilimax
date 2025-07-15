import crypto from "node:crypto"
import axios from "axios"

import { removeQueryParams } from "../utils/remove-query-params"

export type ShopeeServiceOptions = {
    appId: string
    appSecret: string
    subIds: string[]
}

export type ShopeeShortLinkResult = {
    shortLink: string
}

export class ShopeeService {
    constructor(private readonly options: ShopeeServiceOptions) {}

    private generateSignature(rawBody: string, timestamp: number): string {
        const payload = `${this.options.appId}${timestamp}${rawBody}${this.options.appSecret}`
        return crypto.createHash("sha256").update(payload).digest("hex")
    }

    async createAffiliateUrl(url: string) {
        const cleanUrl = removeQueryParams(url)
        const timestamp = Math.floor(Date.now() / 1000)
        const subIds = JSON.stringify(this.options.subIds)
        const rawQuery = `mutation{\ngenerateShortLink(input:{originUrl:"${cleanUrl}",subIds:${subIds}}){shortLink}\n}`
        const rawBody = JSON.stringify({ query: rawQuery })
        const signature = this.generateSignature(rawBody, timestamp)
        const authorizationHeader = `SHA256 Credential=${this.options.appId}, Signature=${signature}, Timestamp=${timestamp}`

        const response = await axios.post(
            "https://open-api.affiliate.shopee.com.br/graphql",
            rawBody,
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authorizationHeader,
                },
            }
        )

        const data = response.data

        if (data.errors) {
            const errorMessage = data.errors.map((err: any) => err.message).join(" ")
            throw new Error(`Shopee Error: ${response.status} - ${errorMessage}`)
        }

        const shortLinkResult: ShopeeShortLinkResult = data.data.generateShortLink

        return shortLinkResult.shortLink
    }
}