import { header, noop, query, RequestBuilder, IParamMap } from './Request'
import * as R from 'fp-ts/lib/Record'
import { array } from 'fp-ts/lib/Array'

/**
 * Takes a query object and translates it to a PostgREST filter query string.
 * All values are prefixed with `eq.`.
 *
 * @param {object} The object to match against.
 * @returns {IRequest} The API request object.
 */

export const match = (queryParams: IParamMap): RequestBuilder =>
  query(
    R.toArray(queryParams)
      .map(([key, value]) => [key, `eq.${value}`])
      .reduce((map, [key, value]) => ({ ...map, [key]: value }), {})
  )

/**
 * Cleans up a select string by stripping all whitespace. Then the string is
 * set as a query string value. Also always forces a root @id column.
 *
 * @param {string} The unformatted select string.
 * @returns {IRequest} The API request object.
 */
export const select = (selectParams: any): RequestBuilder => {
  if (!selectParams) { return noop }
  return query({select: selectParams.replace(/\s/g, '')})
}

/**
 * Tells PostgREST in what order the result should be returned.
 *
 * @param {string} The property name to order by.
 * @param {bool} True for descending results, false by default.
 * @param {bool} True for nulls first, false by default.
 * @returns {IRequest} The API request object.
 */
export const order = (property: string, ascending: boolean = false, nullsFirst: boolean = false): RequestBuilder =>
  query({
    order: `${property}.${ascending ? 'asc' : 'desc'}.${nullsFirst ? 'nullsfirst' : 'nullslast'}`
  })

/**
 * Specify a range of items for PostgREST to return. If the second value is
 * not defined, the rest of the collection will be sent back.
 *
 * @param {number} The first object to select.
 * @param {number|void} The last object to select.
 * @returns {ApiRequest} The API request object.
 */

export const range = (from: number, to: number): RequestBuilder =>
  header({
    'Range': `${from || 0}-${to || ''}`,
    'Range-Unit': 'items',
  })

/**
 * Sets the header which signifies to PostgREST the response must be a single
 * object or 404.
 *
 * @returns {ApiRequest} The API request object.
 */
export const single = (): RequestBuilder => header({Prefer: 'plurality=singular'})

/**
 * For all of the PostgREST filters add a shortcut method to use it.
 *
 * @param {string} The name of the column.
 * @param {any} The value of the column to be filtered.
 * @returns {IRequest} The API request object.
 */

const filter = (filterStr: string) => (name: string, value: any): RequestBuilder => {
  return query(
      R.fromFoldable(array)
        ([[name, `${filterStr}.${Array.isArray(value) ? value.join(',') : value}`]], 
         (_, a) => a))
}

interface IBooleanRequest {
  columnName: string
  filter: string
  value: any
}

const booleanOperator = (operator: string) => (req: IBooleanRequest[]): RequestBuilder => {
  return query(
    R.fromFoldable(array)
        ([[operator, `(${req.map(n => `${n.columnName}.${n.filter}.${n.value}`).join()})`]],
         (_, a) => a))
}

export const eq = filter('eq')
export const gt = filter('gt')
export const lt = filter('lt')
export const gte = filter('gte')
export const lte = filter ('lte')
export const like = filter('like')
export const ilike = filter('ilike')
export const is = filter('is')
export const valueIn = filter('in')
export const not = booleanOperator('not')
export const andFilter = booleanOperator('and')
