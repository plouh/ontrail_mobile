import { Either, left, right } from 'fp-ts/lib/Either'
import { IOEither } from 'fp-ts/lib/IOEither'
import { TaskEither, tryCatch } from 'fp-ts/lib/TaskEither'
import { ReaderTaskEither } from 'fp-ts/lib/ReaderTaskEither'
import * as R from 'fp-ts/lib/Record'
import { Lens } from 'monocle-ts'
import { semigroupString } from 'fp-ts/lib/Semigroup'

// import { querystring, _isEmpty } from './utils'

const encode = encodeURIComponent

const encodeKeyValue = (key: string, value: string) =>
  value === null ? encode(key) : `${encode(key)}=${encode(value)}`

const querystring = (obj: Record<string, any>) =>
    R.foldr(
        R.mapWithKey(obj, (key, value) => encodeKeyValue(key, value)),
        '',
        (keyValue, acc) => `${keyValue}&${acc}`
    )

export type IResp<T> = Either<Error, T>
export type IReq<T> = TaskEither<Error, T>
export type RawRequest = IReq<Response>

export enum LoginStatusReason { NotLoggedIn, AuthenticationRequired, LoginFailed, LoginError, ExistingAccount, NetworkError }
export interface ILoginStatus {
  readonly status: LoginStatusReason
  readonly message: string
}

export enum HTTPMethod {
  POST = 'POST',
  GET = 'GET',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS'
}

export type IParamMap = Record<string, string>

export interface IRequest {
  readonly host: string,
  readonly method: HTTPMethod
  readonly path: string
  readonly query: IParamMap,
  readonly headers: IParamMap,
  readonly body?: string
}

export type RequestBuilder = (req: IRequest) => IRequest
export const noop: RequestBuilder = (req: IRequest) => req

/**
 * Sets a property inside a map in IRequest
 */
// Merge existing param map with updated
const extendParamsWith = (updated: IParamMap) => (existing: IParamMap) => R.getMonoid(semigroupString).concat(existing, updated)

const queryLens = Lens.fromProp<IRequest, 'query'>('query')
const headerLens = Lens.fromProp<IRequest, 'headers'>('headers')
const bodyLens = Lens.fromProp<IRequest, 'body'>('body')

/**
 * Appends or replaces query parameters from request
 */
export const query: (query: IParamMap) => RequestBuilder = q => queryLens.modify(extendParamsWith(q))
export const header: (header: IParamMap) => RequestBuilder = h => headerLens.modify(extendParamsWith(h))
export const body: (body: string) => RequestBuilder = reqBody => bodyLens.set(reqBody)

export class RemoteError extends Error {}

export class LoginError extends RemoteError {
  public readonly status: ILoginStatus
  constructor(status: ILoginStatus) {
    super(status.message)
    this.status = status
  }
}

const send = (req: IRequest) => tryCatch(
    () => fetch(`${req.host}${req.path}?${querystring(req.query)}`, {
            body: req.body,
            headers: R.toArray(req.headers)
                .reduce((headers, [key, value]) => { headers.set(key, value); return headers }, new Headers()),
            method: req.method.toString()
        }),
    (reason: unknown) => reason as Error
)

const Request = (method: HTTPMethod, path: string, host: string): IRequest => ({
  body: undefined,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  host,
  method,
  path,
  query: {}
})

interface RequestConfig {
    method: HTTPMethod,
    host: string
}

export const request = (path: string, ...builders: RequestBuilder[]) => 
    new ReaderTaskEither<RequestConfig, Error, Response>(e => {
        const req = builders.reduce(
            (requestParams, builder) => builder(requestParams), // apply request builders one by one
            Request(e.method, path, e.host)  // initial request
          )
        
        return send(req)
        }
    )
