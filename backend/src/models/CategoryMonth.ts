import { DataResponse } from '../controllers/responses'

/**
 * @example {
 *   id: "abc123",
 *   categoryGroupId: "def456",
 *   name: "My Budget",
 *   created: "2011-10-05T14:48:00.000Z",
 *   updated: "2011-10-05T14:48:00.000Z",
 * }
 */
export interface CategoryMonthModel {
  /**
   * Unique ID
   */
  id: string

  /**
   * Category ID
   */
  categoryId: string

  /**
   * Date string
   */
  month: string

  /**
   * Amount budgeted
   */
  budgeted: number

  /**
   * Activity amount
   */
  activity: number

  /**
   * Month balance
   */
  balance: number

  /**
   * Date created
   */
  created: Date

  /**
   * Date updated
   */
  updated: Date
}

/**
 * @example {
 *  "budgeted": 0,
 * }
 */
export interface CategoryMonthRequest {
  budgeted: number
}

export type CategoryMonthResponse = DataResponse<CategoryMonthModel>

export type CategoryMonthsResponse = DataResponse<CategoryMonthModel[]>
