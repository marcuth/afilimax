export function requireVanillaPuppeteer() {
    try {
        return [require("puppeteer"), undefined]
    }
    catch (_) {}
    
    try {
        return [require("puppeteer-core"), undefined]
    }
    catch (err) {
        return [undefined, err]
    }
}