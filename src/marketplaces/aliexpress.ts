import crypto from "node:crypto"
import axios from "axios"

import { removeQueryParams } from "../utils/remove-query-params"

export type AliExpressServiceOptions = {
    appKey: string
    appSecret: string
    trackingId: string
}

export type AliexpressAffiliateApiResponse = {
    aliexpress_affiliate_link_generate_response: {
        resp_result: {
            result: {
                promotion_links: {
                    promotion_link: Array<{ promotion_link: string }>
                }
                tracking_id: string
            }
            resp_code: number
            resp_msg: string
        }
        request_id: string
    }
}

export class AliExpressService {
    constructor(private readonly options: AliExpressServiceOptions) { }

    private generateSignature(params: Record<string, string>): string {
        const sorted = Object.keys(params).sort()
        const base = sorted.map(k => k + params[k]).join("")
        const hash = crypto.createHmac("sha256", this.options.appSecret)
            .update(base)
            .digest("hex")

        return hash.toUpperCase()
    }

    async createAffiliateUrl(url: string) {
        const cleanUrl = removeQueryParams(url)
        const method = "aliexpress.affiliate.link.generate"
        const timestamp = new Date().getTime().toString()

        const params: Record<string, string> = {
            app_key: this.options.appKey,
            method: method,
            timestamp: timestamp,
            sign_method: "sha256",
            v: "2.0",
            tracking_id: this.options.trackingId,
            promotion_link_type: "0",
            source_values: url,
        }

        const sign = this.generateSignature(params)

        const response = await axios.get("https://api-sg.aliexpress.com/sync", {
            params: { ...params, sign },
            headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" }
        })

        const data: AliexpressAffiliateApiResponse = response.data
        const affiliateUrl = data.aliexpress_affiliate_link_generate_response.resp_result.result.promotion_links.promotion_link[0].promotion_link

        return affiliateUrl
    }
}