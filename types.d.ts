type FuncParams<P, R> = (params: P) => R
type AsyncFuncParams<P, R> = FuncParams<P, Promise<R>>
type AsyncFunc<R> = () => Promise<R>
type ReturnFunc<R> = () => R

type Gif = {
  id: string
  legacy_info: { post_id: string }
  title: string
  content_rating: string
  media_formats: {
    [key: string]: {
      url: string
      duration: number
      preview: string
      dims: number[]
      size: number
    }
  }
  bg_color: string
  content_description: string
  h1_title: string
  long_title: string
  embed: string
  itemurl: string
  url: string
  tags: string[]
  flags: string[]
  user: {
    username: string
    partnername: string
    url: string
    tagline: string
    userid: string
    profile_id: string
    avatars: { [key as string]: string }
    usertype: string
  }
  shares: number
}

type SearchGifResponse = {
  results: Gif[]
}
