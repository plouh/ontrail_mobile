import { Either } from 'fp-ts/lib/Either'
import { Option, none } from 'fp-ts/lib/Option'

export interface ILogin {
  readonly authToken: string
  readonly email: string
  readonly expires: number
}

export enum LoginStatusReason { NotLoggedIn, AuthenticationRequired, LoginFailed, LoginError, ExistingAccount, NetworkError }
export interface ILoginStatus {
  readonly status: LoginStatusReason
  readonly message: Option<string>
}

export const NOT_LOGGED_IN: ILoginStatus = { status: LoginStatusReason.NotLoggedIn, message: none }

export type Login = Either<ILoginStatus, ILogin>

export interface ICredentials {
  readonly email: string
  readonly pass: string
}
