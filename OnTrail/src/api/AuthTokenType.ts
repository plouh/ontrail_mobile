import * as t from 'io-ts'
import { ILogin } from '../model/Login'
import { Either, isLeft, isRight } from 'fp-ts/lib/Either'
import { tryCatch } from 'fp-ts/lib/IOEither'
import { atob } from '../utils/Base64'

const JWTType = t.type({
    email: t.string,
    role: t.string,
    exp: t.number
})

const parseAuthToken = (m: t.mixed, context: t.Context): Either<t.Errors, ILogin> => {
    if (typeof m !== 'string') {
        return t.failure('token is not a string', context)
    }
    const parts = m.split('.')
    if (parts.length !== 3) {
        return t.failure(`expected 3 parts in JWT, but got ${parts.length}`, context)
    }
    const dataPart = atob(parts[1])
    const dataPartJson = tryCatch(() => JSON.parse(dataPart)).run()

    if (isLeft(dataPartJson)) {
        return t.failure(`invalid content in JWT '${dataPart}'`, context)
    }

    return JWTType.decode(dataPartJson.value).map(token => ({
        authToken: m, email: token.email, expires: token.exp
    }))
}

// runtime type definition
export class AuthTokenType extends t.Type<ILogin, string, t.mixed> {
    // equivalent to Type<string, string, mixed> as per type parameter defaults
    readonly _tag: 'StringType' = 'StringType'
    constructor() {
        super(
            'authToken',
            (m): m is ILogin => typeof m === 'object' && m !== null && m.hasOwnProperty('authToken') && m.hasOwnProperty('email') && m.hasOwnProperty('exp'),
            parseAuthToken,
            i => i.authToken
        )
    }
}

// runtime type instance: use this when building other runtime types instances
export const authToken = new AuthTokenType()
