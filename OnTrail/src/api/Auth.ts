import { fromOption, left, right } from 'fp-ts/lib/Either'
import { none, Option, some } from 'fp-ts/lib/Option'
import { fromTaskEither, ReaderTaskEither } from 'fp-ts/lib/ReaderTaskEither'
import { Task } from 'fp-ts/lib/Task'
import { fromEither, right as taskEitherRight, TaskEither, tryCatch } from 'fp-ts/lib/TaskEither'
import * as t from 'io-ts'
import { Lens } from 'monocle-ts'
import { ICredentials, ILogin } from '../model/Login'
import { storage } from '../utils/storage'
import { authToken } from './AuthTokenType'
import { body, header, HTTPMethod, ILoginStatus, IReq, IRequest, IResp, LoginError, LoginStatusReason, request, RequestBuilder, RequestConfig } from './Request'


// import { ICredentials, ILogin, LoginStatusReason, storage } from '../model'
const AUTH_KEY = '@OnTrail:auth_token'
const CREDENTIALS_KEY = '@OnTrail:credentials'

export const authorization = storage<ILogin>(AUTH_KEY)
const credentials = storage<ICredentials>(CREDENTIALS_KEY)

interface AuthParams {
  login: Option<ILogin>
  credentials: Option<ICredentials>
}

const setAuth = (auth: Option<ILogin>, creds: Option<ICredentials>): Task<AuthParams> => {
  return authorization.set(auth).chain(l => credentials.set(creds).map(c => ({login: l, credentials: c})))
}

export const mapErrors = (response: Response): IResp<Response> => {
  if (response.ok) {
    return right(response)
  }
  switch (response.status) {
    case 401:
      return left(new LoginError({ status: LoginStatusReason.AuthenticationRequired, message: 'Sähköposti ja salasana tarvitaan' }))
    case 403:
      return left(new LoginError({ status: LoginStatusReason.LoginFailed, message: 'Virheellinen sähköpostiosoite tai salasana' }))
    case 409:
      return left(new LoginError({ status: LoginStatusReason.ExistingAccount, message: 'Account with given email already exists' }))
    default:
      return left(new LoginError({ status: LoginStatusReason.LoginError, message: 'Tunnistamaton virhe, yritä uudelleen' }))
  }
}

function renderResponse(response: Response) {
  return tryCatch(async () => { 
    const text = await response.text()
    console.log('response', text)
    return {} as ILogin
  }, _ => new Error('could not parse response'))
}

const authTokenResponse = t.type({
  auth_token: authToken
})

function validateLoginResponse(response: Response) {
  return fromEither(mapErrors(response))
    .chain(r => tryCatch(() => r.json(), _ => new Error('could not parse response')))
    .chain(json => fromEither(authTokenResponse.decode(json).mapLeft(l => { console.log('parse errors', l); return new Error(`${l}`) })))
    .map(r => r.auth_token)
}

const isLoginError = (error: Error): error is LoginError => error instanceof LoginError

export const errorToStatus = (error: Error): ILoginStatus => {
  return (error instanceof LoginError) ?
    error.status : { status: LoginStatusReason.NetworkError, message: error.message || 'Tunnistamaton virhe' }
}

export function loginRequest(creds: ICredentials, logoutWhenFailed: boolean = true): IReq<ILogin> {
  return request(HTTPMethod.POST)(
    '/rpc/login',
    header({'Content-Type': 'application/json'}),
    body(JSON.stringify(creds))
  ).chain(
    response => fromTaskEither(validateLoginResponse(response))
  ).chain(r =>
    fromTaskEither<RequestConfig, Error, AuthParams>(taskEitherRight(setAuth(some(r), some(creds)))).map(_ => r)
  )
}

export function logout(): Task<void> {
  return setAuth(none, none).map(_ => { return })
}

const checkAuthenticationValidity = (auth: Option<ILogin>) =>
  auth.chain(a => a.expires * 1000 > Date.now() ? some(a.authToken) : none)

/** get authToken using credentials */
const tokenWithCredentials = (creds: ICredentials): IReq<string> =>
  loginRequest(creds, false).map(a => a.authToken)

const LOGIN_EXPIRED: Error = new LoginError({ status: LoginStatusReason.AuthenticationRequired, message: 'Sisäänkirjautuminen vanhentunut'})
const LOGIN_REQUIRED = new LoginError({ status: LoginStatusReason.AuthenticationRequired, message: 'Sisäänkirjautuminen vaaditaan'})

/** Gets the auth token first from credentials */
const credentialsFromStorage = new TaskEither<Error, ICredentials>(credentials.get().map(fromOption(LOGIN_REQUIRED)))

/** Make a authentication request to the server with credentials */
const refreshCredentials = (): IReq<string> => 
  fromTaskEither<RequestConfig, Error, ICredentials>(credentialsFromStorage).chain(creds => tokenWithCredentials(creds))

/** Get JWT auth token from local storage */
const authTokenFromStorage = new TaskEither<Error, string>(
  authorization.get().map(checkAuthenticationValidity).map(fromOption<Error>(LOGIN_EXPIRED))
)

/** to get valid auth token, first check auth from local storage, then attempt to refresh credentials with email & pass */
export const getTokenReq: IReq<string> =
  fromTaskEither<RequestConfig, Error, string>(authTokenFromStorage).orElse(_ => refreshCredentials())
      
const authLens = Lens.fromPath<IRequest, 'headers', 'Authorization'>(['headers', 'Authorization'])

/**
 * Set auth using special formats. Only one string paramter is passed and it
 * is interpreted as a bearer token.
 *
 * @param {string} The access token.
 * @param {request} request to add the access token to
 * @returns {IRequest} The API request object.
 */
const authBuilder = (token: string): RequestBuilder => authLens.set(`Bearer ${token}`)

const checkCredentials = (r: Response) => {
  switch (r.status) {
    case 401 || 403: setAuth(none, none)
  }
  return r
}

export const authRequest = (method: HTTPMethod) => (path: string, ...opts: RequestBuilder[]): ReaderTaskEither<RequestConfig, Error, Response> =>
  getTokenReq.chain(
    token => request(method)(path, authBuilder(token), ...opts).map(checkCredentials)      
  )
