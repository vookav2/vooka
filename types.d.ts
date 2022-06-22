type FuncParams<P, R> = (params: P) => R
type AsyncFuncParams<P, R> = FuncParams<P, Promise<R>>
type AsyncFunc<R> = () => Promise<R>
