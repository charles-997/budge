import { Get, Put, Route, Path, Security, Post, Body, Controller, Tags, Request, Example } from 'tsoa'
import { Budget } from '../entities/Budget'
import { ExpressRequest } from './requests'
import { ErrorResponse } from './responses'
import { Account, AccountTypes } from '../entities/Account'
import { AccountResponse, AccountsResponse, CreateAccountRequest, EditAccountRequest } from '../models/Account'
import { Payee } from '../entities/Payee'
import { Transaction, TransactionStatus } from '../entities/Transaction'
import { Category } from '../entities/Category'
import { getRepository } from 'typeorm'

@Tags('Accounts')
@Route('budgets/{budgetId}/accounts')
export class AccountsController extends Controller {
  /**
   * Create a new account
   */
  @Security('jwtRequired')
  @Post()
  @Example<AccountResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      budgetId: 'def456',
      transferPayeeId: 'xyz789',
      name: 'Checking Account',
      type: AccountTypes.Bank,
      balance: 0,
      cleared: 0,
      uncleared: 0,
      order: 0,
      created: '2011-10-05T14:48:00.000Z',
      updated: '2011-10-05T14:48:00.000Z',
    },
  })
  public async createAccount(
    @Path() budgetId: string,
    @Body() requestBody: CreateAccountRequest,
    @Request() request: ExpressRequest,
  ): Promise<AccountResponse | ErrorResponse> {
    try {
      const budget = await getRepository(Budget).findOne({ id: budgetId, userId: request.user.id })
      if (!budget) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const account: Account = getRepository(Account).create({
        ...requestBody,
        budgetId,
      })
      await getRepository(Account).insert(account)

      // Create a transaction for the starting balance of the account
      if (requestBody.balance !== 0) {
        let categoryId = null

        let amount = requestBody.balance
        switch (account.type) {
          case AccountTypes.CreditCard:
            amount = amount * -1 // Inverse balance for CCs
            break
          case AccountTypes.Bank:
            const inflowCategory = await getRepository(Category).findOne({ budgetId: account.budgetId, inflow: true })
            categoryId = inflowCategory.id
            break
        }

        const startingBalancePayee = await getRepository(Payee).findOne({
          budgetId,
          name: 'Starting Balance',
          internal: true,
        })
        const startingBalanceTransaction = getRepository(Transaction).create({
          budgetId,
          accountId: account.id,
          payeeId: startingBalancePayee.id,
          categoryId: categoryId,
          amount,
          date: requestBody.date,
          memo: 'Starting Balance',
          status: TransactionStatus.Reconciled,
        })
        await getRepository(Transaction).insert(startingBalanceTransaction)
      }

      // Reload account to get the new balanace after the 'initial' transaction was created
      // await account.reload()

      return {
        message: 'success',
        data: await (await getRepository(Account).findOne(account.id)).toResponseModel(),
      }
    } catch (err) {
      console.log(err)
      return { message: err.message }
    }
  }

  /**
   * Update an account's name or balance. Updating a balance will result in a possible
   * reconciled transaction.
   */
  @Security('jwtRequired')
  @Put('{id}')
  @Example<AccountResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      budgetId: 'def456',
      transferPayeeId: 'xyz789',
      name: 'Checking Account',
      type: AccountTypes.Bank,
      balance: 0,
      cleared: 0,
      uncleared: 0,
      order: 0,
      created: '2011-10-05T14:48:00.000Z',
      updated: '2011-10-05T14:48:00.000Z',
    },
  })
  public async updateAccount(
    @Path() budgetId: string,
    @Path() id: string,
    @Body() requestBody: EditAccountRequest,
    @Request() request: ExpressRequest,
  ): Promise<AccountResponse | ErrorResponse> {
    try {
      const budget = await getRepository(Budget).findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      let account = await getRepository(Account).findOne(id)
      if (!account) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      if (requestBody.name !== account.name || requestBody.order !== account.order) {
        account.name = requestBody.name

        if (account.order !== requestBody.order) {
          account.order = requestBody.order

          // Update all accounts because of order change
          let accounts = (await getRepository(Account).find({ budgetId })).map(act => {
            if (account.id === act.id) {
              return account
            }

            return act
          })

          accounts = Account.sort(accounts)
          await getRepository(Account).save(accounts)
        } else {
          await getRepository(Account).update(account.id, account.getUpdatePayload())
        }
      }

      if (typeof requestBody.balance === 'number') {
        // Reconcile the account
        const difference = requestBody.balance - account.cleared
        if (difference !== 0) {
          const reconciliationPayee = await getRepository(Payee).findOne({
            budgetId,
            name: 'Reconciliation Balance Adjustment',
            internal: true,
          })
          const inflowCategory = await getRepository(Category).findOne({ budgetId: account.budgetId, inflow: true })
          const startingBalanceTransaction = getRepository(Transaction).create({
            budgetId,
            accountId: account.id,
            payeeId: reconciliationPayee.id,
            categoryId: inflowCategory.id,
            amount: difference,
            date: new Date(),
            memo: 'Reconciliation Transaction',
            status: TransactionStatus.Reconciled,
          })
          await getRepository(Transaction).insert(startingBalanceTransaction)
        }

        const clearedTransactions = await getRepository(Transaction).find({
          accountId: account.id,
          status: TransactionStatus.Cleared,
        })
        for (const transaction of clearedTransactions) {
          transaction.status = TransactionStatus.Reconciled
          await getRepository(Transaction).update(transaction.id, transaction.getUpdatePayload())
        }

        account = await getRepository(Account).findOne(account.id)
      }

      return {
        message: 'success',
        data: await account.toResponseModel(),
      }
    } catch (err) {
      console.log(err)
      return { message: err.message }
    }
  }

  /**
   * Find all budget accounts
   */
  @Security('jwtRequired')
  @Get()
  @Example<AccountsResponse>({
    message: 'success',
    data: [
      {
        id: 'abc123',
        budgetId: 'def456',
        transferPayeeId: 'xyz789',
        name: 'Checking Account',
        type: AccountTypes.Bank,
        balance: 0,
        cleared: 0,
        uncleared: 0,
        order: 0,
        created: '2011-10-05T14:48:00.000Z',
        updated: '2011-10-05T14:48:00.000Z',
      },
    ],
  })
  public async getAccounts(
    @Path() budgetId: string,
    @Request() request: ExpressRequest,
  ): Promise<AccountsResponse | ErrorResponse> {
    try {
      const budget = await getRepository(Budget).findOne({ id: budgetId, userId: request.user.id })
      if (!budget) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const accounts = await getRepository(Account).find({ where: { budgetId } })

      return {
        message: 'success',
        data: await Promise.all(accounts.map(account => account.toResponseModel())),
      }
    } catch (err) {
      return { message: err.message }
    }
  }

  /**
   * Find a single budget account
   */
  @Security('jwtRequired')
  @Get('{accountId}')
  @Example<AccountResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      budgetId: 'def456',
      transferPayeeId: 'xyz789',
      name: 'Checking Account',
      type: AccountTypes.Bank,
      balance: 0,
      cleared: 0,
      uncleared: 0,
      order: 0,
      created: '2011-10-05T14:48:00.000Z',
      updated: '2011-10-05T14:48:00.000Z',
    },
  })
  public async getAccount(
    @Path() budgetId: string,
    @Path() accountId: string,
    @Request() request: ExpressRequest,
  ): Promise<AccountResponse | ErrorResponse> {
    try {
      const budget = await getRepository(Budget).findOne({ id: budgetId, userId: request.user.id })
      if (!budget) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const account = await getRepository(Account).findOne(accountId)

      return {
        message: 'success',
        data: await account.toResponseModel(),
      }
    } catch (err) {
      return { message: err.message }
    }
  }
}
