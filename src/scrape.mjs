import puppeteer, { Browser, Page, DEFAULT_INTERCEPT_RESOLUTION_PRIORITY  } from 'puppeteer'

let browser
let page 

export default {
    init: async () => {
        browser = await puppeteer.launch({
            headless: false,
        }) 
    },
    /**
     * 
     * @param {string} url 
     * @param {string} waitForSelector 
     * @returns string
     */
    crawl: async (url, waitForSelector = 'body') => {
        if (!browser) {
            return false
        }

        page = await browser.newPage()

        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'

        await Promise.all([
            page.setUserAgent(userAgent),
            page.setJavaScriptEnabled(false),
            page.setDefaultNavigationTimeout(0),
            page.setRequestInterception(true),
        ])
    
        page.on('request', (req) => {
            if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
                req.abort();
            } else {
                req.continue();
            }
        })

        await page.goto(url, {
            timeout: 0,
            waitUntil: 'networkidle2'
        })
        const content = await page.content()

        await page.close()

        return content
    }, 
    close: async () => {
        await browser?.close()
    }
}
