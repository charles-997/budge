import { AccountTypes } from '../entities/Account'
import { DataResponse } from '../controllers/responses'

/**
 * @example {
 *   id: "abc123",
 *   budgetId: "abc456",
 *   name: "My Budget",
 *   type: 0,
 *   created: "2011-10-05T14:48:00.000Z",
 *   updated: "2011-10-05T14:48:00.000Z",
 * }
 */
export interface AccountModel {
  /**
   * Unique id
   */
  id: string

  /**
   * Parent budget ID
   */
  budgetId: string

  /**
   * ID of payee for account transfers
   */
  transferPayeeId: string

  /**
   * Budget name
   */
  name: string

  /**
   * Account type
   */
  type: AccountTypes

  /**
   * Account balance (cleared + uncleared)
   */
  balance: number

  /**
   * Cleared account balance
   */
  cleared: number

  /**
   * Pending account balance
   */
  uncleared: number

  /**
   * Order position of accounts
   */
  order: number

  /**
   * Datetime user was created
   */
  created: Date

  /**
   * Datetime user was updated
   */
  updated: Date
}

/**
 * @example {
 *  "name": "My Budget",
 *  "type": 0,
 * }
 */
export interface AccountRequest {
  name: string
  type: AccountTypes
}

/**
 * @example {
 *  "name": "My Budget",
 *  "type": 0,
 *  "balance": 100,
 * }
 */
export interface CreateAccountRequest {
  name: string
  type: AccountTypes
  balance: number
  date: string
}

/**
 * @example {
 *  "name": "My Budget",
 *  "balance": 100,
 * }
 */
export interface EditAccountRequest {
  name?: string
  order?: number
  balance?: number
}

export type AccountResponse = DataResponse<AccountModel>

export type AccountsResponse = DataResponse<AccountModel[]>
