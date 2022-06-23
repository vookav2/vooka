import { request } from 'https'

const makeRequest = (url: string, method?: string) =>
  new Promise((resolve, reject) => {
    const req = request(url, { method: method ?? 'GET' }, res => {
      if (res.statusCode && res.statusCode > 200 && res.statusCode <= 300) {
        return reject(`Request failed with status code: ${res.statusCode}`)
      }

      const data: any[] = []
      res.on('data', chunk => data.push(chunk))
      res.on('end', () => {
        const raw = Buffer.concat(data).toString('utf-8')
        return resolve(JSON.parse(raw))
      })
    })
    req.on('error', reject)
    req.end()
  })

const tenorRequestUrl = (path: string) => {
  const hostname = 'https://tenor.googleapis.com'
  const key = 'AIzaSyC-P6_qz3FzCoXGLk6tgitZo4jEJ5mLzD8'
  return `${hostname}/v2/${path}?key=${key}&client_key=tenor_web&locale=en`
}

const search = async (query: string, limit = 10) => {
  const url = `${tenorRequestUrl(
    'search'
  )}&q=${query}&limit=${limit}&searchfilter=&contentfilter=off&random=true&media_filter=gif&ar_range=wide`
  return (await makeRequest(url)) as SearchGifResponse
}

export const getRandomGifUrl = async () => {
  const queries = ['dance', 'sexy dance', 'funny dance', 'baby dance', 'joget', 'joget tiktok']
  const randomIndex = Math.floor(Math.random() * queries.length)
  try {
    const res = await search(queries[randomIndex], 1)
    return res.results.shift()?.media_formats?.gif?.url
  } catch (error) {
    return undefined
  }
}
