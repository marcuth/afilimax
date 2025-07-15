function removeRefSegment(url: string): string {
    try {
        const urlObj = new URL(url)
        const pathSegments = urlObj.pathname.split("/")
        const filteredSegments = pathSegments.filter((segment) => !segment.startsWith("ref="))
        const cleanPath = filteredSegments.join("/")
        const cleanUrl = `${urlObj.protocol}//${urlObj.host}${cleanPath}${urlObj.search}`
        return cleanUrl
    } catch (error) {
        console.error(error)

        return url
    }
}

export function removeQueryParams(url: string): string {
    url = removeRefSegment(url)

    try {
        const urlObj = new URL(url)
        return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`
    } catch (error) {
        console.error(error)

        return url
    }
}