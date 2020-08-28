// import AppError from '../errors/AppError';

import { getCustomRepository, Repository, getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService extends Repository<Transaction> {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    const balance = await transactionsRepository.getBalance();

    if (balance.total < value && type === 'outcome') {
      throw new AppError('Cannot buy without money');
    }

    let foundCategory = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!foundCategory) {
      foundCategory = await categoryRepository.create({ title: category });
      await categoryRepository.save(foundCategory);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: foundCategory.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
