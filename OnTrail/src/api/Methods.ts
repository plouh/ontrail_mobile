import { authRequest } from './Auth'
import { HTTPMethod, request, header, RequestBuilder } from './Request'

export { loginRequest } from './Auth'
export * from './PostGREST'
export * from './Request'

export const authDel = authRequest(HTTPMethod.DELETE)
export const authGet = authRequest(HTTPMethod.GET)

export const authGetOne = (url: string, ...rest: RequestBuilder[]) =>
  authGet(url, header({Accept: 'application/vnd.pgrst.object+json'}), ...rest)

export const authOptions = authRequest(HTTPMethod.OPTIONS)
export const authPatch = authRequest(HTTPMethod.PATCH)
export const authPost = authRequest(HTTPMethod.POST)
export const authPut = authRequest(HTTPMethod.PUT)

export const del = request(HTTPMethod.DELETE)
export const get = request(HTTPMethod.GET)
export const options = request(HTTPMethod.OPTIONS)
export const patch = request(HTTPMethod.PATCH)
export const post = request(HTTPMethod.POST)
export const put = request(HTTPMethod.PUT)
