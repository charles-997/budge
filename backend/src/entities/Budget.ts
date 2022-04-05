import { BudgetModel } from '../models/Budget'
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, DeepPartial } from 'typeorm'
import { User } from './User'
import { Account } from './Account'
import { CategoryGroup } from './CategoryGroup'
import { Category } from './Category'
import { BudgetMonth } from './BudgetMonth'
import { Transaction } from './Transaction'

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', nullable: false })
  userId: string

  @Column({ type: 'varchar' })
  name: string

  @CreateDateColumn()
  created: Date

  @CreateDateColumn()
  updated: Date

  /**
   * Belongs to a user
   */
  @ManyToOne(() => User, user => user.budgets)
  user: User

  /**
   * Has many accounts
   */
  @OneToMany(() => Account, account => account.budget)
  accounts: Promise<Account[]>

  /**
   * Has many categories
   */
  @OneToMany(() => Category, category => category.budget)
  categories: Promise<Category[]>

  /**
   * Has many category groups
   */
  @OneToMany(() => CategoryGroup, categoryGroup => categoryGroup.budget)
  categoryGroups: Promise<CategoryGroup[]>

  /**
   * Has many budget months
   */
  @OneToMany(() => BudgetMonth, budgetMonth => budgetMonth.budget)
  months: Promise<BudgetMonth[]>

  /**
   * Has many budget transactions
   */
  @OneToMany(() => Transaction, transaction => transaction.budget)
  transactions: Promise<Transaction[]>

  public update(partial: DeepPartial<Budget>): Budget {
    Object.assign(this, partial)
    return this
  }

  public getUpdatePayload() {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
    }
  }

  public async toResponseModel(): Promise<BudgetModel> {
    return {
      id: this.id,
      name: this.name,
      accounts: await Promise.all((await this.accounts).map(account => account.toResponseModel())),
      created: this.created,
      updated: this.updated,
    }
  }

  public async getMonths(): Promise<string[]> {
    return (await this.months).map(month => month.month).sort()
  }
}
