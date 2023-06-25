import puppeteer from 'puppeteer'
import * as cheerio from "cheerio";
import scrape from './scrape.mjs'
import fs from 'fs'

const page = 1
const filename = `csv/ekonomi-${page}-${Date.now()}.csv`

;(async () => {
    await scrape.init();

    // Scraping halaman utama
    const content = await scrape.crawl(`https://www.cnnindonesia.com/ekonomi/indeks/5/${page}`)
    const $ = cheerio.load(content);

    console.log('Sedang menganalisa artikel dihalaman utama ...')
    
    const links = $('.feed article').map((i, el) => {
        return $(el).find('a').attr('href') ?? null
    }).toArray()
    .filter((el) => {
      return el != null;
    });

    console.log(`Ditemukan ${links.length} artikel ...`)

    const results = []

    for (const link of links) {
        console.log( `Sedang melakukan memproses artikel dengan alamat: ${link}`)
        const content = await scrape.crawl(link);
        const $ = cheerio.load(content);
        
        const judul = $('.content_detail h1.title').text().trim()
        const isiBerita = $('.content_detail .detail_text p').map((i, el) => {
            return $(el).text().trim();
        }).toArray().slice(0, 1).join(' ')
        const penulis = $('.content_detail .author').text().trim()
        const tahun = $('.content_detail .date').text().trim().match(/(\d{4})/)?.[0] ?? '-'

        if (!isiBerita) {
            console.log('Isi berita kosong, skip...')
            continue;
        }

        const data = {
            judul,
            isiBerita,
            penulis,
            tahun,            
        }

        results.push(data)
    }

    const headers = Object.keys(results[0]);
    const headerRow = headers.join(',');
    const dataRows = results.map(item => {
      const rowValues = headers.map(header => {
        const value = item[header];
        if (typeof value === 'string' && value.includes(' ')) {
          return `"${value}"`;
        }
        return value;
      });
      return rowValues.join(',');
    });
    const csvString = `${headerRow}\n${dataRows.join('\n')}`;
  
    fs.writeFileSync(filename, csvString, { encoding: 'utf8', flag: 'w' });

    console.log(`Menulis hasil scraping menjadi file csv: ${filename}`)

    await scrape.close();
})()